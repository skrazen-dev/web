/**
 * Grok AI router (xAI ผ่าน Vercel AI Gateway) — 3 ฟีเจอร์:
 *   1. ask          — AI Assistant ถามข้อมูลในระบบ (กำไรวันนี้, วงเงิน SCB, รายการไม่มีสลิป)
 *   2. readSlip     — AI OCR อ่านสลิป → {ยอดเงิน, เวลา, ธนาคาร} เติมฟอร์มอัตโนมัติ
 *   3. dailySummary — สรุปรายวัน (รายรับ/รายจ่าย/กำไร/งานค้าง) ส่งเข้า Telegram
 */
import { z } from "zod";
import {
  getAccounts,
  getExpenses,
  getSettings,
  getUsdtCalculations,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  gatewayChat,
  gatewayJSON,
  isAIGatewayConfigured,
} from "../_core/aiGateway";

// xAI models ผ่าน gateway
const GROK_MODEL = "xai/grok-4";
const GROK_VISION_MODEL = "xai/grok-2-vision-1212";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** รวบรวมภาพรวมระบบของ user ไว้ป้อนให้ AI (กระชับ ไม่หลุดข้อมูลเกินจำเป็น) */
async function buildSystemContext(userId: number) {
  const [accounts, expenses, usdtCalcs] = await Promise.all([
    getAccounts(userId),
    getExpenses(userId),
    getUsdtCalculations(userId),
  ]);

  const todayCalcs = usdtCalcs.filter((c) => isToday(c.createdAt));
  const profitToday = todayCalcs.reduce(
    (s, c) => s + parseFloat(c.profitThb),
    0
  );
  const revenueToday = todayCalcs.reduce(
    (s, c) => s + parseFloat(c.sellAmountThb),
    0
  );
  const expensesPaidToday = expenses
    .filter((e) => e.status === "paid" && isToday(e.paidAt))
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  const expensesNoSlip = expenses.filter(
    (e) => !e.proofUrl && e.status !== "cancelled"
  );
  const expensesPending = expenses.filter((e) => e.status === "pending");

  return {
    accounts: accounts.map((a) => ({
      bank: a.bankName,
      name: a.accountName,
      number: a.accountNumber,
      balance: parseFloat(a.balance),
      active: a.isActive === "yes",
    })),
    today: {
      profitThb: profitToday,
      revenueThb: revenueToday,
      expensePaidThb: expensesPaidToday,
      netThb: profitToday - expensesPaidToday,
    },
    expensesWithoutSlip: expensesNoSlip.map((e) => ({
      id: e.id,
      title: e.title,
      amount: parseFloat(e.amount),
      status: e.status,
    })),
    pendingExpenses: expensesPending.map((e) => ({
      id: e.id,
      title: e.title,
      amount: parseFloat(e.amount),
    })),
  };
}

export async function sendTelegram(
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
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlipOcrResult = {
  amount: number | null;
  time: string | null; // ISO หรือ "HH:mm" ตามที่อ่านได้
  bankName: string | null;
  ref: string | null;
};

/**
 * สร้างสรุปรายวันของ user หนึ่งคน แล้ว (ถ้าเปิด Telegram) ส่งเข้ากลุ่ม
 * ใช้ร่วมกันระหว่าง tRPC procedure และ cron กลางคืน
 */
export async function generateDailySummary(
  userId: number,
  sendToTelegram = true
): Promise<{ summary: string; sent: boolean }> {
  const context = await buildSystemContext(userId);

  const summary = await gatewayChat({
    model: GROK_MODEL,
    temperature: 0.3,
    maxTokens: 600,
    messages: [
      {
        role: "system",
        content:
          "คุณคือผู้ช่วยสรุปยอดรายวันของ CE Empire เขียนสรุปสั้นเป็นภาษาไทยแบบ Telegram Markdown " +
          "มีหัวข้อ: 💰 รายรับ, 💸 รายจ่าย, 📈 กำไรสุทธิ, 📋 งานค้าง (รายการที่ยังไม่มีสลิป + ค่าใช้จ่ายค้างจ่าย) " +
          "ใช้ตัวเลขจาก JSON เท่านั้น ใส่ ฿ และคั่นหลักพัน",
      },
      {
        role: "user",
        content: `สรุปยอดวันนี้ (${new Date().toLocaleDateString(
          "th-TH"
        )}) จากข้อมูล:\n${JSON.stringify(context)}`,
      },
    ],
  });

  let sent = false;
  if (sendToTelegram) {
    const settings = await getSettings(userId);
    if (
      settings?.telegramEnabled === "yes" &&
      settings.telegramBotToken &&
      settings.telegramChatId
    ) {
      sent = await sendTelegram(
        settings.telegramBotToken,
        settings.telegramChatId,
        summary
      );
    }
  }

  return { summary, sent };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const grokRouter = router({
  /** ให้ UI รู้ว่าตั้งค่า AI พร้อมไหม */
  status: protectedProcedure.query(() => ({
    configured: isAIGatewayConfigured(),
    model: GROK_MODEL,
  })),

  // ── 1) AI Assistant ─────────────────────────────────────────────────────────
  /** ถามข้อมูลในระบบเป็นภาษาธรรมชาติ เช่น "วันนี้กำไรเท่าไร", "SCB เหลือวงเงินเท่าไร" */
  ask: protectedProcedure
    .input(z.object({ question: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }): Promise<{ answer: string }> => {
      const context = await buildSystemContext(ctx.user.id);

      const answer = await gatewayChat({
        model: GROK_MODEL,
        temperature: 0.2,
        maxTokens: 500,
        messages: [
          {
            role: "system",
            content:
              "คุณคือผู้ช่วยทางการเงินของระบบ CE Empire ตอบเป็นภาษาไทยสั้นกระชับ " +
              "ใช้เฉพาะข้อมูล JSON ที่ให้มาเท่านั้น ห้ามเดาหรือแต่งตัวเลขเพิ่ม " +
              "ถ้าข้อมูลไม่พอให้บอกตรงๆ ว่าไม่มีข้อมูล จำนวนเงินใส่เครื่องหมาย ฿ และคั่นหลักพัน",
          },
          {
            role: "user",
            content: `ข้อมูลระบบ (JSON):\n${JSON.stringify(
              context
            )}\n\nคำถาม: ${input.question}`,
          },
        ],
      });

      return { answer };
    }),

  // ── 2) AI OCR สลิป ───────────────────────────────────────────────────────────
  /** อ่านสลิปโอนเงินจากรูป → {ยอดเงิน, เวลา, ธนาคาร, เลขอ้างอิง} สำหรับเติมฟอร์ม */
  readSlip: protectedProcedure
    .input(
      z.object({
        // ใส่อย่างใดอย่างหนึ่ง: URL รูป หรือ data URL (base64)
        imageUrl: z.string().url().optional(),
        imageBase64: z.string().optional(),
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }): Promise<SlipOcrResult> => {
      const url =
        input.imageUrl ??
        (input.imageBase64
          ? `data:${input.mimeType};base64,${input.imageBase64.replace(
              /^data:[^,]+,/,
              ""
            )}`
          : null);
      if (!url) throw new Error("ต้องส่ง imageUrl หรือ imageBase64 อย่างใดอย่างหนึ่ง");

      return gatewayJSON<SlipOcrResult>({
        model: GROK_VISION_MODEL,
        temperature: 0,
        maxTokens: 400,
        messages: [
          {
            role: "system",
            content:
              "คุณคือ OCR อ่านสลิปโอนเงินของธนาคารไทย ดึงข้อมูลจากรูปแล้วตอบเป็น JSON object เท่านั้น: " +
              '{"amount": number|null, "time": "ISO หรือ HH:mm"|null, "bankName": string|null, "ref": string|null}. ' +
              "amount เป็นจำนวนเงินบาท (ตัวเลขล้วน ไม่มีคอมมา), bankName เป็นชื่อธนาคารผู้โอน/ผู้รับ " +
              "ถ้าอ่านค่าไหนไม่ได้ให้เป็น null",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "อ่านสลิปนี้แล้วดึงยอดเงิน เวลา ธนาคาร และเลขอ้างอิง" },
              { type: "image_url", image_url: { url, detail: "high" } },
            ],
          },
        ],
      });
    }),

  // ── 3) Daily Summary → Telegram ──────────────────────────────────────────────
  /** สรุปรายวัน (รายรับ/รายจ่าย/กำไร/งานค้าง) — ส่งเข้า Telegram ได้ (ใช้กับ cron ตอนกลางคืน) */
  dailySummary: protectedProcedure
    .input(z.object({ sendToTelegram: z.boolean().default(true) }))
    .mutation(({ ctx, input }) =>
      generateDailySummary(ctx.user.id, input.sendToTelegram)
    ),
});
