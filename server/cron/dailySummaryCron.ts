/**
 * Daily Summary cron — ส่งสรุปยอดรายวันเข้า Telegram ทุกคืน
 *
 * วิธีใช้: เรียก startDailySummaryCron() ตอน server เริ่มทำงาน
 * (เช่นใน server/_core/index.ts หลังจาก server.listen)
 *
 *   import { startDailySummaryCron } from "../cron/dailySummaryCron";
 *   startDailySummaryCron();
 *
 * ใช้ setInterval เช็คทุกนาที ไม่ต้องพึ่ง dependency เพิ่ม
 * ถ้าต้องการแม่นยำ/หลาย instance แนะนำใช้ Vercel Cron หรือ node-cron แทน
 */
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { generateDailySummary } from "../routers/grok";

// เวลาส่ง (โซนเวลาเซิร์ฟเวอร์) — ปรับได้ผ่าน ENV
const SEND_HOUR = Number(process.env.DAILY_SUMMARY_HOUR ?? 22); // 22:00
const SEND_MINUTE = Number(process.env.DAILY_SUMMARY_MINUTE ?? 0);

let lastRunDate = "";

async function runForAllUsers() {
  const db = await getDb();
  if (!db) return;

  const allUsers = await db.select({ id: users.id }).from(users);
  for (const u of allUsers) {
    try {
      const { sent } = await generateDailySummary(u.id, true);
      if (sent) {
        console.log(`[dailySummary] sent to user ${u.id}`);
      }
    } catch (err) {
      console.error(`[dailySummary] failed for user ${u.id}:`, err);
    }
  }
}

export function startDailySummaryCron() {
  const tick = () => {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    if (
      now.getHours() === SEND_HOUR &&
      now.getMinutes() === SEND_MINUTE &&
      lastRunDate !== dateKey
    ) {
      lastRunDate = dateKey; // กันยิงซ้ำในนาทีเดียวกัน
      void runForAllUsers();
    }
  };

  // เช็คทุก 60 วินาที
  setInterval(tick, 60_000);
  console.log(
    `[dailySummary] cron started — ส่งทุกวันเวลา ${String(SEND_HOUR).padStart(
      2,
      "0"
    )}:${String(SEND_MINUTE).padStart(2, "0")}`
  );
}
