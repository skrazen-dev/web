import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { accountOrders, accounts, riskAlerts } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  analyzeAccountRisk,
  formatRiskAlertForTelegram,
  type AccountInfo,
} from "../riskEngine";

// ─── DB Helpers ───────────────────────────────────────────────────────────────

async function getAccountWithOrders(
  accountId: number,
  userId: number
): Promise<AccountInfo | null> {
  const db = await getDb();
  if (!db) return null;

  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);

  if (!account) return null;

  const orders = await db
    .select()
    .from(accountOrders)
    .where(
      and(eq(accountOrders.accountId, accountId), eq(accountOrders.userId, userId))
    )
    .orderBy(desc(accountOrders.scheduledAt));

  return {
    id: account.id,
    accountName: account.accountName,
    accountNumber: account.accountNumber,
    bankName: account.bankName,
    balance: parseFloat(account.balance),
    orders: orders.map((o) => ({
      id: o.id,
      amount: parseFloat(o.orderAmount),
      scheduledAt: o.scheduledAt,
      completedAt: o.completedAt ?? null,
      status: o.status,
    })),
  };
}

async function sendTelegramAlert(
  botToken: string,
  chatId: string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Risk Router ──────────────────────────────────────────────────────────────

export const riskRouter = router({
  /** วิเคราะห์ความเสี่ยงบัญชีเดียว (พร้อม optional incoming order time) */
  analyzeAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.number().int().positive(),
        incomingOrderTime: z.date().optional(),
        incomingOrderAmount: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const accountInfo = await getAccountWithOrders(
        input.accountId,
        ctx.user.id
      );
      if (!accountInfo) throw new Error("Account not found");

      // ถ้ามีออเดอร์ใหม่ที่กำลังจะเข้า ให้เพิ่มเข้าไปใน simulation
      if (input.incomingOrderAmount) {
        accountInfo.orders.push({
          id: -1,
          amount: input.incomingOrderAmount,
          scheduledAt: input.incomingOrderTime ?? new Date(),
          status: "pending",
        });
      }

      return analyzeAccountRisk(accountInfo, input.incomingOrderTime);
    }),

  /** วิเคราะห์ความเสี่ยงทุกบัญชีของ user */
  analyzeAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isActive, "yes")));

    const results = await Promise.all(
      userAccounts.map(async (acc) => {
        const info = await getAccountWithOrders(acc.id, ctx.user.id);
        if (!info) return null;
        return analyzeAccountRisk(info);
      })
    );

    return results.filter(Boolean);
  }),

  /** บันทึก order ใหม่ที่กำลังจะเข้าบัญชี */
  addOrder: protectedProcedure
    .input(
      z.object({
        accountId: z.number().int().positive(),
        orderAmount: z.number().positive(),
        scheduledAt: z.date(),
        telegramGroup: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(accountOrders).values({
        userId: ctx.user.id,
        accountId: input.accountId,
        orderAmount: input.orderAmount.toString(),
        scheduledAt: input.scheduledAt,
        telegramGroup: input.telegramGroup,
        note: input.note,
        status: "pending",
      });

      const [inserted] = await db
        .select()
        .from(accountOrders)
        .where(eq(accountOrders.id, result[0].insertId))
        .limit(1);

      // วิเคราะห์ความเสี่ยงหลังเพิ่มออเดอร์
      const accountInfo = await getAccountWithOrders(input.accountId, ctx.user.id);
      if (accountInfo) {
        const riskResult = analyzeAccountRisk(accountInfo, input.scheduledAt);

        // บันทึก risk alert ถ้าเสี่ยงสูง
        if (riskResult.shouldNotify) {
          const highFactors = riskResult.factors.filter(
            (f) => f.level === "high" || f.level === "critical"
          );
          for (const factor of highFactors) {
            await db.insert(riskAlerts).values({
              userId: ctx.user.id,
              accountId: input.accountId,
              riskLevel: factor.level,
              riskType: factor.type,
              message: factor.message,
              details: factor.details,
            });
          }
        }

        return { order: inserted, risk: riskResult };
      }

      return { order: inserted, risk: null };
    }),

  /** อัปเดตสถานะออเดอร์ (completed/cancelled) */
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number().int().positive(),
        status: z.enum(["completed", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(accountOrders)
        .set({
          status: input.status,
          completedAt: input.status === "completed" ? new Date() : null,
        })
        .where(
          and(
            eq(accountOrders.id, input.orderId),
            eq(accountOrders.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /** ดึงรายการ orders ของบัญชี */
  listOrders: protectedProcedure
    .input(
      z.object({
        accountId: z.number().int().positive(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(accountOrders)
        .where(
          and(
            eq(accountOrders.accountId, input.accountId),
            eq(accountOrders.userId, ctx.user.id)
          )
        )
        .orderBy(desc(accountOrders.scheduledAt))
        .limit(input.limit);
    }),

  /** ดึง risk alerts ที่ยังไม่ได้อ่าน */
  listAlerts: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(riskAlerts.userId, ctx.user.id)];
      if (input.unreadOnly) {
        conditions.push(eq(riskAlerts.isRead, "no"));
      }

      return db
        .select()
        .from(riskAlerts)
        .where(and(...conditions))
        .orderBy(desc(riskAlerts.createdAt))
        .limit(input.limit);
    }),

  /** ทำเครื่องหมาย alert ว่าอ่านแล้ว */
  markAlertRead: protectedProcedure
    .input(z.object({ alertId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(riskAlerts)
        .set({ isRead: "yes" })
        .where(
          and(
            eq(riskAlerts.id, input.alertId),
            eq(riskAlerts.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /** ส่งแจ้งเตือนความเสี่ยงไป Telegram */
  sendRiskAlert: protectedProcedure
    .input(
      z.object({
        accountId: z.number().int().positive(),
        botToken: z.string().min(1),
        chatId: z.string().min(1),
        incomingOrderTime: z.date().optional(),
        incomingOrderAmount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const accountInfo = await getAccountWithOrders(
        input.accountId,
        ctx.user.id
      );
      if (!accountInfo) throw new Error("Account not found");

      if (input.incomingOrderAmount) {
        accountInfo.orders.push({
          id: -1,
          amount: input.incomingOrderAmount,
          scheduledAt: input.incomingOrderTime ?? new Date(),
          status: "pending",
        });
      }

      const riskResult = analyzeAccountRisk(accountInfo, input.incomingOrderTime);
      const message = formatRiskAlertForTelegram(riskResult);
      const sent = await sendTelegramAlert(input.botToken, input.chatId, message);

      // บันทึกว่าส่ง Telegram แล้ว
      if (sent && riskResult.shouldNotify) {
        const db = await getDb();
        if (db) {
          const highFactors = riskResult.factors.filter(
            (f) => f.level === "high" || f.level === "critical"
          );
          for (const factor of highFactors) {
            await db.insert(riskAlerts).values({
              userId: ctx.user.id,
              accountId: input.accountId,
              riskLevel: factor.level,
              riskType: factor.type,
              message: factor.message,
              details: factor.details,
              telegramSent: "yes",
            });
          }
        }
      }

      return { success: sent, risk: riskResult, message };
    }),
});
