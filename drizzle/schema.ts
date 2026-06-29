import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Accounts (บัญชีธนาคาร) ────────────────────────────────────────────────────
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankCode: varchar("bankCode", { length: 20 }).notNull(),
  bankName: varchar("bankName", { length: 100 }).notNull(),
  accountName: varchar("accountName", { length: 200 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  note: text("note"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

// ─── Agents (ตัวแทน) ────────────────────────────────────────────────────────────
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  lineId: varchar("lineId", { length: 100 }),
  note: text("note"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ─── Expenses (ค่าใช้จ่าย) ──────────────────────────────────────────────────────
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId"),
  agentId: int("agentId"),
  title: varchar("title", { length: 300 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  proofUrl: text("proofUrl"),
  proofKey: text("proofKey"),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── USDT Calculations (ประวัติการคำนวณ) ────────────────────────────────────────
export const usdtCalculations = mysqlTable("usdt_calculations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  buyAmountThb: decimal("buyAmountThb", { precision: 15, scale: 2 }).notNull(),
  usdtReceived: decimal("usdtReceived", { precision: 15, scale: 4 }).notNull(),
  sellRate: decimal("sellRate", { precision: 10, scale: 4 }).notNull(),
  costPerUsdt: decimal("costPerUsdt", { precision: 10, scale: 4 }).notNull(),
  sellAmountThb: decimal("sellAmountThb", { precision: 15, scale: 2 }).notNull(),
  profitThb: decimal("profitThb", { precision: 15, scale: 2 }).notNull(),
  profitPercent: decimal("profitPercent", { precision: 8, scale: 4 }).notNull(),
  isProfit: mysqlEnum("isProfit", ["yes", "no"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsdtCalculation = typeof usdtCalculations.$inferSelect;
export type InsertUsdtCalculation = typeof usdtCalculations.$inferInsert;

// ─── Settings (การตั้งค่า) ───────────────────────────────────────────────────────
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  telegramBotToken: text("telegramBotToken"),
  telegramChatId: varchar("telegramChatId", { length: 100 }),
  telegramEnabled: mysqlEnum("telegramEnabled", ["yes", "no"]).default("no").notNull(),
  notifyThreshold: decimal("notifyThreshold", { precision: 5, scale: 2 }).default("5.00"),
  soundEnabled: mysqlEnum("soundEnabled", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

// ─── Account Orders (ออเดอร์/ยอดที่รับเข้าบัญชี) ────────────────────────────────
export const accountOrders = mysqlTable("account_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId").notNull(),
  orderAmount: decimal("orderAmount", { precision: 15, scale: 2 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  completedAt: timestamp("completedAt"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  telegramGroup: varchar("telegramGroup", { length: 200 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountOrder = typeof accountOrders.$inferSelect;
export type InsertAccountOrder = typeof accountOrders.$inferInsert;

// ─── Risk Alerts (บันทึกการแจ้งเตือนความเสี่ยง) ───────────────────────────────
export const riskAlerts = mysqlTable("risk_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).notNull(),
  riskType: varchar("riskType", { length: 100 }).notNull(),
  message: text("message").notNull(),
  details: text("details"),
  isRead: mysqlEnum("isRead", ["yes", "no"]).default("no").notNull(),
  telegramSent: mysqlEnum("telegramSent", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RiskAlert = typeof riskAlerts.$inferSelect;
export type InsertRiskAlert = typeof riskAlerts.$inferInsert;