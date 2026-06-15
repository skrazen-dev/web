import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { riskRouter } from "./routers/risk";
import {
  clearUsdtCalculations,
  createAccount,
  createAgent,
  createExpense,
  createUsdtCalculation,
  deleteAccount,
  deleteAgent,
  deleteExpense,
  deleteUsdtCalculation,
  getAccounts,
  getAgents,
  getExpenses,
  getSettings,
  getUsdtCalculations,
  updateAccount,
  updateAgent,
  updateExpense,
  upsertSettings,
} from "./db";

// ─── Accounts Router ──────────────────────────────────────────────────────────
const accountsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getAccounts(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        bankCode: z.string().min(1),
        bankName: z.string().min(1),
        accountName: z.string().min(1),
        accountNumber: z.string().min(1),
        balance: z.string().default("0.00"),
        note: z.string().optional(),
        isActive: z.enum(["yes", "no"]).default("yes"),
      })
    )
    .mutation(({ ctx, input }) =>
      createAccount({ userId: ctx.user.id, ...input })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        bankCode: z.string().min(1).optional(),
        bankName: z.string().min(1).optional(),
        accountName: z.string().min(1).optional(),
        accountNumber: z.string().min(1).optional(),
        balance: z.string().optional(),
        note: z.string().optional().nullable(),
        isActive: z.enum(["yes", "no"]).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateAccount(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => deleteAccount(input.id, ctx.user.id)),
});

// ─── Agents Router ────────────────────────────────────────────────────────────
const agentsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getAgents(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        lineId: z.string().optional(),
        note: z.string().optional(),
        isActive: z.enum(["yes", "no"]).default("yes"),
      })
    )
    .mutation(({ ctx, input }) =>
      createAgent({ userId: ctx.user.id, ...input })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).optional(),
        phone: z.string().optional().nullable(),
        lineId: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
        isActive: z.enum(["yes", "no"]).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateAgent(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => deleteAgent(input.id, ctx.user.id)),
});

// ─── Expenses Router ──────────────────────────────────────────────────────────
const expensesRouter = router({
  list: protectedProcedure.query(({ ctx }) => getExpenses(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        accountId: z.number().int().positive().optional().nullable(),
        agentId: z.number().int().positive().optional().nullable(),
        title: z.string().min(1),
        amount: z.string(),
        category: z.string().optional(),
        status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
        proofUrl: z.string().optional().nullable(),
        proofKey: z.string().optional().nullable(),
        dueDate: z.date().optional().nullable(),
        paidAt: z.date().optional().nullable(),
        note: z.string().optional().nullable(),
      })
    )
    .mutation(({ ctx, input }) =>
      createExpense({ userId: ctx.user.id, ...input })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        accountId: z.number().int().positive().optional().nullable(),
        agentId: z.number().int().positive().optional().nullable(),
        title: z.string().min(1).optional(),
        amount: z.string().optional(),
        category: z.string().optional().nullable(),
        status: z.enum(["pending", "paid", "cancelled"]).optional(),
        proofUrl: z.string().optional().nullable(),
        proofKey: z.string().optional().nullable(),
        dueDate: z.date().optional().nullable(),
        paidAt: z.date().optional().nullable(),
        note: z.string().optional().nullable(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateExpense(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => deleteExpense(input.id, ctx.user.id)),
});

// ─── USDT Calculations Router ─────────────────────────────────────────────────
const usdtCalcsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    getUsdtCalculations(ctx.user.id)
  ),

  create: protectedProcedure
    .input(
      z.object({
        buyAmountThb: z.string(),
        usdtReceived: z.string(),
        sellRate: z.string(),
        costPerUsdt: z.string(),
        sellAmountThb: z.string(),
        profitThb: z.string(),
        profitPercent: z.string(),
        isProfit: z.enum(["yes", "no"]),
        note: z.string().optional().nullable(),
      })
    )
    .mutation(({ ctx, input }) =>
      createUsdtCalculation({ userId: ctx.user.id, ...input })
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      deleteUsdtCalculation(input.id, ctx.user.id)
    ),

  clear: protectedProcedure.mutation(({ ctx }) =>
    clearUsdtCalculations(ctx.user.id)
  ),
});

// ─── Settings Router ──────────────────────────────────────────────────────────
const settingsRouter = router({
  get: protectedProcedure.query(({ ctx }) => getSettings(ctx.user.id)),

  update: protectedProcedure
    .input(
      z.object({
        telegramBotToken: z.string().optional().nullable(),
        telegramChatId: z.string().optional().nullable(),
        telegramEnabled: z.enum(["yes", "no"]).optional(),
        notifyThreshold: z.string().optional().nullable(),
        soundEnabled: z.enum(["yes", "no"]).optional(),
      })
    )
    .mutation(({ ctx, input }) => upsertSettings(ctx.user.id, input)),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  accounts: accountsRouter,
  agents: agentsRouter,
  expenses: expensesRouter,
  usdtCalcs: usdtCalcsRouter,
  settings: settingsRouter,
  risk: riskRouter,
});

export type AppRouter = typeof appRouter;
