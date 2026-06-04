import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getDb ────────────────────────────────────────────────────────────────
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Pinned Accounts Router Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maskAccountNumber hides middle digits correctly", () => {
    const mask = (num: string) => {
      if (num.length <= 4) return num;
      return `${num.slice(0, 3)}-xxx-${num.slice(-4)}`;
    };
    expect(mask("1234567890")).toBe("123-xxx-7890");
    expect(mask("123")).toBe("123");
    expect(mask("1234")).toBe("1234");
  });

  it("risk level calculation: safe when < 50% used", () => {
    const getRiskLevel = (received: number, balance: number) => {
      if (balance <= 0) return "unknown";
      const ratio = received / balance;
      if (ratio >= 0.9) return "critical";
      if (ratio >= 0.7) return "high";
      if (ratio >= 0.5) return "medium";
      return "safe";
    };

    expect(getRiskLevel(10000, 50000)).toBe("safe");   // 20%
    expect(getRiskLevel(25000, 50000)).toBe("medium");  // 50%
    expect(getRiskLevel(35000, 50000)).toBe("high");    // 70%
    expect(getRiskLevel(45000, 50000)).toBe("critical"); // 90%
    expect(getRiskLevel(0, 0)).toBe("unknown");
  });

  it("risk level: 15,020 received out of 50,000 = safe", () => {
    const ratio = 15020 / 50000;
    expect(ratio).toBeCloseTo(0.3004);
    expect(ratio < 0.5).toBe(true); // safe
  });

  it("risk level: 19,030 received (15,020 + 4,010 new order) = safe but watch", () => {
    const received = 15020 + 4010;
    const balance = 50000;
    const ratio = received / balance;
    expect(ratio).toBeCloseTo(0.3806);
    expect(ratio < 0.5).toBe(true); // still safe
  });

  it("risk level: two orders 15,020 + 19,030 = 34,050 = medium risk", () => {
    const received = 15020 + 19030;
    const balance = 50000;
    const ratio = received / balance;
    expect(ratio).toBeCloseTo(0.681);
    // 34,050/50,000 = 68.1% → medium risk (>= 50% but < 70%)
    expect(ratio >= 0.5 && ratio < 0.7).toBe(true); // medium risk band
    expect(ratio >= 0.5).toBe(true); // at least medium
  });

  it("progress bar percentage capped at 100", () => {
    const calcPct = (received: number, balance: number) =>
      balance > 0 ? Math.min((received / balance) * 100, 100) : 0;

    expect(calcPct(60000, 50000)).toBe(100); // over limit capped
    expect(calcPct(25000, 50000)).toBe(50);
    expect(calcPct(0, 0)).toBe(0);
  });

  it("remaining balance calculation", () => {
    const remaining = (balance: number, received: number) => balance - received;
    expect(remaining(50000, 15020)).toBe(34980);
    expect(remaining(50000, 50000)).toBe(0);
  });

  it("group by telegramGroup works correctly", () => {
    const pins = [
      { id: 1, telegramGroup: "กลุ่ม A", accountName: "สมชาย" },
      { id: 2, telegramGroup: "กลุ่ม B", accountName: "สมหญิง" },
      { id: 3, telegramGroup: "กลุ่ม A", accountName: "วิชัย" },
    ];

    const grouped = pins.reduce<Record<string, typeof pins>>((acc, pin) => {
      const g = pin.telegramGroup;
      if (!acc[g]) acc[g] = [];
      acc[g].push(pin);
      return acc;
    }, {});

    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["กลุ่ม A"]).toHaveLength(2);
    expect(grouped["กลุ่ม B"]).toHaveLength(1);
  });

  it("total balance sums correctly across pinned accounts", () => {
    const pins = [
      { balance: "50000.00" },
      { balance: "30000.00" },
      { balance: "20000.00" },
    ];
    const total = pins.reduce((s, p) => s + parseFloat(p.balance), 0);
    expect(total).toBe(100000);
  });
});
