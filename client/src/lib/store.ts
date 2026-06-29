import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BankAccount, Expense, Agent, PageId, UsdtCalc, AppSettings } from './types';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface AppState {
  currentPage: PageId;
  setPage: (page: PageId) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  accounts: BankAccount[];
  addAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, data: Partial<BankAccount>) => void;
  deleteAccount: (id: string) => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  agents: Agent[];
  addAgent: (name: string) => void;
  deleteAgent: (id: string) => void;

  // USDT Calc History
  usdtCalcs: UsdtCalc[];
  addUsdtCalc: (calc: Omit<UsdtCalc, 'id' | 'createdAt'>) => void;
  deleteUsdtCalc: (id: string) => void;
  clearUsdtCalcs: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'dashboard',
      setPage: (page) => set({ currentPage: page }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      accounts: [],
      addAccount: (account) =>
        set((state) => ({
          accounts: [...state.accounts, { ...account, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        })),
      updateAccount: (id, data) =>
        set((state) => ({
          accounts: state.accounts.map((a) => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a),
        })),
      deleteAccount: (id) =>
        set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),

      expenses: [],
      addExpense: (expense) =>
        set((state) => ({
          expenses: [...state.expenses, { ...expense, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateExpense: (id, data) =>
        set((state) => ({
          expenses: state.expenses.map((e) => e.id === id ? { ...e, ...data } : e),
        })),
      deleteExpense: (id) =>
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),

      agents: [],
      addAgent: (name) =>
        set((state) => ({
          agents: [...state.agents, { id: uid(), name, createdAt: new Date().toISOString() }],
        })),
      deleteAgent: (id) =>
        set((state) => ({ agents: state.agents.filter((a) => a.id !== id) })),

      // USDT Calc
      usdtCalcs: [],
      addUsdtCalc: (calc) =>
        set((state) => ({
          usdtCalcs: [{ ...calc, id: uid(), createdAt: new Date().toISOString() }, ...state.usdtCalcs].slice(0, 100), // Keep last 100
        })),
      deleteUsdtCalc: (id) =>
        set((state) => ({ usdtCalcs: state.usdtCalcs.filter((c) => c.id !== id) })),
      clearUsdtCalcs: () => set({ usdtCalcs: [] }),

      // Settings
      settings: {
        soundEnabled: true,
        telegramBotToken: '',
        telegramChatId: '',
        notificationThreshold: 5,
        theme: 'dark',
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'ce-empire-data',
      partialize: (state) => ({
        accounts: state.accounts,
        expenses: state.expenses,
        agents: state.agents,
        usdtCalcs: state.usdtCalcs,
        settings: state.settings,
      }),
    }
  )
);
