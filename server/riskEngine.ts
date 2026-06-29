/**
 * CE Empire — Account Risk Analysis Engine
 *
 * Logic ประเมินความเสี่ยงบัญชีธนาคาร:
 * 1. วงเงินรวม (Balance Utilization) — ถ้าออเดอร์ที่กำลังจะเข้า + ที่รับแล้ว > X% ของวงเงิน → เสี่ยง
 * 2. ความถี่ออเดอร์ (Order Frequency) — รับออเดอร์ซ้ำในช่วงเวลาสั้น → ธนาคารตรวจสอบ
 * 3. ช่วงเวลาซ้อน (Time Overlap) — ออเดอร์ใหม่เข้าก่อนออเดอร์เก่าเสร็จ → เสี่ยงสูง
 * 4. ยอดสะสมรายวัน (Daily Volume) — ยอดรวมวันนี้เกิน threshold → แจ้งเตือน
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskFactor {
  type: string;
  level: RiskLevel;
  message: string;
  details: string;
  score: number; // 0-100
}

export interface AccountRiskResult {
  accountId: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  overallLevel: RiskLevel;
  overallScore: number;
  factors: RiskFactor[];
  recommendation: string;
  shouldNotify: boolean;
}

export interface OrderSlot {
  id: number;
  amount: number;
  scheduledAt: Date;
  completedAt?: Date | null;
  status: "pending" | "completed" | "cancelled";
}

export interface AccountInfo {
  id: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  balance: number; // วงเงินรวมของบัญชี
  orders: OrderSlot[];
}

// ─── Config ค่า threshold ─────────────────────────────────────────────────────

const RISK_CONFIG = {
  // % ของวงเงินที่ถือว่าเสี่ยง
  balanceUtilization: {
    medium: 0.5,   // 50% → medium
    high: 0.75,    // 75% → high
    critical: 0.9, // 90% → critical
  },
  // จำนวนออเดอร์ใน 24 ชั่วโมงที่ถือว่าเสี่ยง
  dailyOrderCount: {
    medium: 3,
    high: 5,
    critical: 8,
  },
  // ช่วงเวลาห่างระหว่างออเดอร์ (นาที) ที่ถือว่าเสี่ยง
  orderGapMinutes: {
    critical: 30,  // น้อยกว่า 30 นาที → critical
    high: 60,      // น้อยกว่า 1 ชั่วโมง → high
    medium: 120,   // น้อยกว่า 2 ชั่วโมง → medium
  },
  // ยอดสะสมรายวัน (% ของวงเงิน)
  dailyVolumePercent: {
    medium: 0.6,
    high: 0.8,
    critical: 1.0,
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function minutesBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60);
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ─── Risk Factor Analyzers ────────────────────────────────────────────────────

/**
 * 1. วิเคราะห์ Balance Utilization
 * ออเดอร์ pending ทั้งหมดเทียบกับวงเงิน
 */
function analyzeBalanceUtilization(account: AccountInfo): RiskFactor {
  const pendingOrders = account.orders.filter((o) => o.status === "pending");
  const pendingTotal = pendingOrders.reduce((s, o) => s + o.amount, 0);
  const utilization = account.balance > 0 ? pendingTotal / account.balance : 0;

  let score = Math.min(100, Math.round(utilization * 100));
  let level: RiskLevel = "low";
  let message = "";
  let details = "";

  if (utilization >= RISK_CONFIG.balanceUtilization.critical) {
    level = "critical";
    score = 95;
    message = `⚠️ วงเงินใกล้เต็ม! ออเดอร์ค้างอยู่ ${pendingTotal.toLocaleString()} บาท จากวงเงิน ${account.balance.toLocaleString()} บาท (${(utilization * 100).toFixed(1)}%)`;
    details = `ออเดอร์ pending ${pendingOrders.length} รายการ รวม ${pendingTotal.toLocaleString()} บาท — ความเสี่ยงถูกระงับบัญชีสูงมาก`;
  } else if (utilization >= RISK_CONFIG.balanceUtilization.high) {
    level = "high";
    score = 75;
    message = `🔴 วงเงินใช้ไปแล้ว ${(utilization * 100).toFixed(1)}% — ควรระวังการรับออเดอร์เพิ่ม`;
    details = `ออเดอร์ pending ${pendingOrders.length} รายการ รวม ${pendingTotal.toLocaleString()} บาท`;
  } else if (utilization >= RISK_CONFIG.balanceUtilization.medium) {
    level = "medium";
    score = 50;
    message = `🟡 วงเงินใช้ไปแล้ว ${(utilization * 100).toFixed(1)}% — ติดตามสถานะออเดอร์`;
    details = `ออเดอร์ pending ${pendingOrders.length} รายการ รวม ${pendingTotal.toLocaleString()} บาท`;
  } else {
    level = "low";
    score = Math.max(5, score);
    message = `✅ วงเงินยังเหลือพอ — ใช้ไปแล้ว ${(utilization * 100).toFixed(1)}%`;
    details = `ออเดอร์ pending ${pendingOrders.length} รายการ รวม ${pendingTotal.toLocaleString()} บาท`;
  }

  return { type: "balance_utilization", level, message, details, score };
}

/**
 * 2. วิเคราะห์ Order Frequency (ความถี่ออเดอร์ใน 24 ชั่วโมง)
 */
function analyzeOrderFrequency(account: AccountInfo): RiskFactor {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recentOrders = account.orders.filter(
    (o) => o.scheduledAt >= last24h && o.status !== "cancelled"
  );
  const count = recentOrders.length;

  let score = 0;
  let level: RiskLevel = "low";
  let message = "";
  let details = `ออเดอร์ใน 24 ชั่วโมงที่ผ่านมา: ${count} รายการ`;

  if (count >= RISK_CONFIG.dailyOrderCount.critical) {
    score = 90;
    level = "critical";
    message = `🚨 รับออเดอร์ ${count} ครั้งใน 24 ชั่วโมง — ธนาคารอาจตรวจสอบและระงับบัญชี`;
  } else if (count >= RISK_CONFIG.dailyOrderCount.high) {
    score = 70;
    level = "high";
    message = `🔴 รับออเดอร์ ${count} ครั้งใน 24 ชั่วโมง — ความเสี่ยงสูง`;
  } else if (count >= RISK_CONFIG.dailyOrderCount.medium) {
    score = 45;
    level = "medium";
    message = `🟡 รับออเดอร์ ${count} ครั้งใน 24 ชั่วโมง — ควรระวัง`;
  } else {
    score = 10;
    level = "low";
    message = `✅ ความถี่ออเดอร์ปกติ (${count} ครั้งใน 24 ชั่วโมง)`;
  }

  return { type: "order_frequency", level, message, details, score };
}

/**
 * 3. วิเคราะห์ Time Overlap — ออเดอร์ใหม่เข้าก่อนออเดอร์เก่าเสร็จ
 * ตรวจสอบช่วงเวลาห่างระหว่างออเดอร์ที่ pending
 */
function analyzeTimeOverlap(
  account: AccountInfo,
  incomingOrderTime?: Date
): RiskFactor {
  const pendingOrders = account.orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  // เพิ่มออเดอร์ใหม่ที่กำลังจะเข้า (ถ้ามี)
  const checkTime = incomingOrderTime ?? new Date();

  let minGap = Infinity;
  let conflictDesc = "";

  // ตรวจสอบช่วงห่างระหว่าง pending orders
  for (let i = 0; i < pendingOrders.length; i++) {
    const gap = minutesBetween(pendingOrders[i].scheduledAt, checkTime);
    if (gap < minGap) {
      minGap = gap;
      conflictDesc = `ออเดอร์ ${pendingOrders[i].amount.toLocaleString()} บาท ที่ ${pendingOrders[i].scheduledAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} ห่างเพียง ${Math.round(gap)} นาที`;
    }
  }

  let score = 0;
  let level: RiskLevel = "low";
  let message = "";
  let details = pendingOrders.length === 0
    ? "ไม่มีออเดอร์ค้างอยู่"
    : `ออเดอร์ pending ${pendingOrders.length} รายการ`;

  if (minGap === Infinity || pendingOrders.length === 0) {
    score = 5;
    level = "low";
    message = "✅ ไม่มีออเดอร์ซ้อนเวลา";
  } else if (minGap < RISK_CONFIG.orderGapMinutes.critical) {
    score = 92;
    level = "critical";
    message = `🚨 ออเดอร์ใหม่ห่างจากออเดอร์เก่าเพียง ${Math.round(minGap)} นาที — เสี่ยงสูงมากที่ธนาคารจะตรวจสอบ`;
    details = conflictDesc;
  } else if (minGap < RISK_CONFIG.orderGapMinutes.high) {
    score = 72;
    level = "high";
    message = `🔴 ออเดอร์ห่างกัน ${Math.round(minGap)} นาที — ควรรอให้ออเดอร์เก่าเสร็จก่อน`;
    details = conflictDesc;
  } else if (minGap < RISK_CONFIG.orderGapMinutes.medium) {
    score = 48;
    level = "medium";
    message = `🟡 ออเดอร์ห่างกัน ${Math.round(minGap)} นาที — ติดตามสถานะ`;
    details = conflictDesc;
  } else {
    score = 15;
    level = "low";
    message = `✅ ช่วงเวลาออเดอร์ห่างกันพอสมควร (${Math.round(minGap)} นาที)`;
    details = conflictDesc;
  }

  return { type: "time_overlap", level, message, details, score };
}

/**
 * 4. วิเคราะห์ Daily Volume สะสมรายวัน
 */
function analyzeDailyVolume(account: AccountInfo): RiskFactor {
  const todayOrders = account.orders.filter(
    (o) => isToday(o.scheduledAt) && o.status !== "cancelled"
  );
  const todayTotal = todayOrders.reduce((s, o) => s + o.amount, 0);
  const ratio = account.balance > 0 ? todayTotal / account.balance : 0;

  let score = Math.min(100, Math.round(ratio * 100));
  let level: RiskLevel = "low";
  let message = "";
  let details = `ยอดสะสมวันนี้: ${todayTotal.toLocaleString()} บาท จากวงเงิน ${account.balance.toLocaleString()} บาท`;

  if (ratio >= RISK_CONFIG.dailyVolumePercent.critical) {
    score = 88;
    level = "critical";
    message = `🚨 ยอดสะสมวันนี้ ${todayTotal.toLocaleString()} บาท เกินวงเงิน! ธนาคารตรวจสอบแน่นอน`;
  } else if (ratio >= RISK_CONFIG.dailyVolumePercent.high) {
    score = 68;
    level = "high";
    message = `🔴 ยอดสะสมวันนี้ ${(ratio * 100).toFixed(0)}% ของวงเงิน — ควรหยุดรับออเดอร์`;
  } else if (ratio >= RISK_CONFIG.dailyVolumePercent.medium) {
    score = 42;
    level = "medium";
    message = `🟡 ยอดสะสมวันนี้ ${(ratio * 100).toFixed(0)}% ของวงเงิน — ระวังการรับเพิ่ม`;
  } else {
    score = Math.max(5, score);
    level = "low";
    message = `✅ ยอดสะสมวันนี้ปกติ (${(ratio * 100).toFixed(0)}% ของวงเงิน)`;
  }

  return { type: "daily_volume", level, message, details, score };
}

// ─── Main Risk Analyzer ───────────────────────────────────────────────────────

export function analyzeAccountRisk(
  account: AccountInfo,
  incomingOrderTime?: Date
): AccountRiskResult {
  const factors: RiskFactor[] = [
    analyzeBalanceUtilization(account),
    analyzeOrderFrequency(account),
    analyzeTimeOverlap(account, incomingOrderTime),
    analyzeDailyVolume(account),
  ];

  // คำนวณ overall score (weighted average)
  const weights = { balance_utilization: 0.3, order_frequency: 0.2, time_overlap: 0.35, daily_volume: 0.15 };
  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * (weights[f.type as keyof typeof weights] ?? 0.25), 0)
  );
  const overallLevel = scoreToLevel(overallScore);

  // สร้างคำแนะนำ
  const criticalFactors = factors.filter((f) => f.level === "critical");
  const highFactors = factors.filter((f) => f.level === "high");

  let recommendation = "";
  if (criticalFactors.length > 0) {
    recommendation = `⛔ หยุดรับออเดอร์ทันที! มี ${criticalFactors.length} ปัจจัยความเสี่ยงระดับ Critical — โอกาสถูกระงับบัญชีสูงมาก ควรรอให้ออเดอร์ปัจจุบันเสร็จสิ้นก่อน`;
  } else if (highFactors.length > 0) {
    recommendation = `⚠️ ระวัง! มี ${highFactors.length} ปัจจัยความเสี่ยงสูง — พิจารณาหยุดรับออเดอร์ชั่วคราวและรอให้ยอดค้างอยู่ลดลง`;
  } else if (overallLevel === "medium") {
    recommendation = `🟡 ความเสี่ยงปานกลาง — ติดตามสถานะออเดอร์อย่างใกล้ชิด และอย่ารับออเดอร์ใหม่จนกว่าออเดอร์เก่าจะเสร็จ`;
  } else {
    recommendation = `✅ ความเสี่ยงต่ำ — สามารถรับออเดอร์ได้ตามปกติ แต่ควรติดตามสถานะอย่างสม่ำเสมอ`;
  }

  const shouldNotify = overallLevel === "high" || overallLevel === "critical";

  return {
    accountId: account.id,
    accountName: account.accountName,
    accountNumber: account.accountNumber,
    bankName: account.bankName,
    overallLevel,
    overallScore,
    factors,
    recommendation,
    shouldNotify,
  };
}

// ─── Telegram Alert Formatter ─────────────────────────────────────────────────

export function formatRiskAlertForTelegram(result: AccountRiskResult): string {
  const levelEmoji: Record<RiskLevel, string> = {
    low: "🟢",
    medium: "🟡",
    high: "🔴",
    critical: "🚨",
  };

  const emoji = levelEmoji[result.overallLevel];
  const lines: string[] = [
    `${emoji} *CE Empire — แจ้งเตือนความเสี่ยงบัญชี*`,
    ``,
    `🏦 *${result.bankName}* — ${result.accountName}`,
    `📋 เลขบัญชี: \`${result.accountNumber}\``,
    ``,
    `📊 *ระดับความเสี่ยง: ${result.overallLevel.toUpperCase()}* (Score: ${result.overallScore}/100)`,
    ``,
    `*ปัจจัยความเสี่ยง:*`,
  ];

  for (const factor of result.factors) {
    if (factor.level !== "low") {
      lines.push(`• ${factor.message}`);
    }
  }

  lines.push(``, `💡 *คำแนะนำ:*`, result.recommendation, ``, `_${new Date().toLocaleString("th-TH")}_`);

  return lines.join("\n");
}
