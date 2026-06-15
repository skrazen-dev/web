import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Account,
  accounts,
  Agent,
  agents,
  Expense,
  expenses,
  InsertAccount,
  InsertAgent,
  InsertExpense,
  InsertSettings,
  InsertUsdtCalculation,
  InsertUser,
  Settings,
  settings,
  UsdtCalculation,
  usdtCalculations,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function getAccounts(userId: number): Promise<Account[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(desc(accounts.createdAt));
}

export async function createAccount(
  data: Omit<InsertAccount, "id" | "createdAt" | "updatedAt">
): Promise<Account> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accounts).values(data);
  const inserted = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, result[0].insertId))
    .limit(1);
  return inserted[0];
}

export async function updateAccount(
  id: number,
  userId: number,
  data: Partial<Omit<InsertAccount, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Account | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(accounts)
    .set(data)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function deleteAccount(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export async function getAgents(userId: number): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId))
    .orderBy(desc(agents.createdAt));
}

export async function createAgent(
  data: Omit<InsertAgent, "id" | "createdAt" | "updatedAt">
): Promise<Agent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agents).values(data);
  const inserted = await db
    .select()
    .from(agents)
    .where(eq(agents.id, result[0].insertId))
    .limit(1);
  return inserted[0];
}

export async function updateAgent(
  id: number,
  userId: number,
  data: Partial<Omit<InsertAgent, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Agent | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(agents)
    .set(data)
    .where(and(eq(agents.id, id), eq(agents.userId, userId)));
  const result = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function deleteAgent(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, userId)));
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(userId: number): Promise<Expense[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .orderBy(desc(expenses.createdAt));
}

export async function createExpense(
  data: Omit<InsertExpense, "id" | "createdAt" | "updatedAt">
): Promise<Expense> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(expenses).values(data);
  const inserted = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, result[0].insertId))
    .limit(1);
  return inserted[0];
}

export async function updateExpense(
  id: number,
  userId: number,
  data: Partial<Omit<InsertExpense, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Expense | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(expenses)
    .set(data)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
  const result = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function deleteExpense(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

// ─── USDT Calculations ────────────────────────────────────────────────────────

export async function getUsdtCalculations(userId: number): Promise<UsdtCalculation[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(usdtCalculations)
    .where(eq(usdtCalculations.userId, userId))
    .orderBy(desc(usdtCalculations.createdAt))
    .limit(200);
}

export async function createUsdtCalculation(
  data: Omit<InsertUsdtCalculation, "id" | "createdAt">
): Promise<UsdtCalculation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(usdtCalculations).values(data);
  const inserted = await db
    .select()
    .from(usdtCalculations)
    .where(eq(usdtCalculations.id, result[0].insertId))
    .limit(1);
  return inserted[0];
}

export async function deleteUsdtCalculation(
  id: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(usdtCalculations)
    .where(
      and(eq(usdtCalculations.id, id), eq(usdtCalculations.userId, userId))
    );
}

export async function clearUsdtCalculations(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(usdtCalculations)
    .where(eq(usdtCalculations.userId, userId));
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(userId: number): Promise<Settings | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertSettings(
  userId: number,
  data: Partial<Omit<InsertSettings, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Settings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getSettings(userId);
  if (existing) {
    await db
      .update(settings)
      .set(data)
      .where(eq(settings.userId, userId));
    const updated = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);
    return updated[0];
  } else {
    const result = await db.insert(settings).values({ userId, ...data });
    const inserted = await db
      .select()
      .from(settings)
      .where(eq(settings.id, result[0].insertId))
      .limit(1);
    return inserted[0];
  }
}
