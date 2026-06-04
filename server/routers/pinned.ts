import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { accounts, pinnedAccounts } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// ─── Pinned Accounts Router ───────────────────────────────────────────────────

export const pinnedRouter = router({
  /** ดึงรายการบัญชีปักหมุดพร้อมข้อมูลบัญชีจริง */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        id: pinnedAccounts.id,
        accountId: pinnedAccounts.accountId,
        telegramGroup: pinnedAccounts.telegramGroup,
        displayOrder: pinnedAccounts.displayOrder,
        receivedAmount: pinnedAccounts.receivedAmount,
        note: pinnedAccounts.note,
        isActive: pinnedAccounts.isActive,
        createdAt: pinnedAccounts.createdAt,
        updatedAt: pinnedAccounts.updatedAt,
        // Account info
        bankCode: accounts.bankCode,
        bankName: accounts.bankName,
        accountName: accounts.accountName,
        accountNumber: accounts.accountNumber,
        balance: accounts.balance,
        accountNote: accounts.note,
      })
      .from(pinnedAccounts)
      .innerJoin(accounts, eq(pinnedAccounts.accountId, accounts.id))
      .where(
        and(
          eq(pinnedAccounts.userId, ctx.user.id),
          eq(pinnedAccounts.isActive, "yes")
        )
      )
      .orderBy(asc(pinnedAccounts.displayOrder), asc(pinnedAccounts.createdAt));

    return rows;
  }),

  /** ปักหมุดบัญชีใหม่ */
  pin: protectedProcedure
    .input(
      z.object({
        accountId: z.number().int().positive(),
        telegramGroup: z.string().min(1),
        displayOrder: z.number().int().default(0),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // ตรวจสอบว่าบัญชีนี้เป็นของ user จริง
      const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .limit(1);

      if (!account) throw new Error("Account not found");

      // ตรวจสอบว่าปักหมุดซ้ำในกลุ่มเดิมหรือไม่
      const [existing] = await db
        .select()
        .from(pinnedAccounts)
        .where(
          and(
            eq(pinnedAccounts.userId, ctx.user.id),
            eq(pinnedAccounts.accountId, input.accountId),
            eq(pinnedAccounts.telegramGroup, input.telegramGroup),
            eq(pinnedAccounts.isActive, "yes")
          )
        )
        .limit(1);

      if (existing) throw new Error("บัญชีนี้ปักหมุดในกลุ่มนี้แล้ว");

      const result = await db.insert(pinnedAccounts).values({
        userId: ctx.user.id,
        accountId: input.accountId,
        telegramGroup: input.telegramGroup,
        displayOrder: input.displayOrder,
        note: input.note,
      });

      return { success: true, id: result[0].insertId };
    }),

  /** ถอนหมุด */
  unpin: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pinnedAccounts)
        .set({ isActive: "no" })
        .where(
          and(
            eq(pinnedAccounts.id, input.id),
            eq(pinnedAccounts.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /** อัปเดตยอดที่รับแล้ว */
  updateReceived: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        receivedAmount: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pinnedAccounts)
        .set({ receivedAmount: input.receivedAmount.toString() })
        .where(
          and(
            eq(pinnedAccounts.id, input.id),
            eq(pinnedAccounts.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /** อัปเดต telegram group หรือ note */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        telegramGroup: z.string().min(1).optional(),
        displayOrder: z.number().int().optional(),
        note: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;
      await db
        .update(pinnedAccounts)
        .set(data)
        .where(
          and(
            eq(pinnedAccounts.id, id),
            eq(pinnedAccounts.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),
});
