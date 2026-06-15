import { describe, it, expect } from "vitest";
import { analyzeAccountRisk, formatRiskAlertForTelegram, type AccountInfo } from "./riskEngine";

function makeAccount(overrides: Partial<AccountInfo> = {}): AccountInfo {
  return {
    id: 1,
    accountName: "Test Account",
    accountNumber: "123-456-789",
    bankName: "กสิกรไทย",
    balance: 100_000,
    orders: [],
    ...overrides,
  };
}

describe("analyzeAccountRisk", () => {
  it("returns low risk for empty orders", () => {
    const result = analyzeAccountRisk(makeAccount());
    expect(result.overallLevel).toBe("low");
    expect(result.shouldNotify).toBe(false);
    expect(result.factors).toHaveLength(4);
  });

  it("returns critical when pending orders exceed 90% of balance", () => {
    const account = makeAccount({
      balance: 50_000,
      orders: [
        { id: 1, amount: 46_000, scheduledAt: new Date(), status: "pending" },
      ],
    });
    const result = analyzeAccountRisk(account);
    const balanceFactor = result.factors.find(f => f.type === "balance_utilization");
    expect(balanceFactor?.level).toBe("critical");
    expect(result.shouldNotify).toBe(true);
  });

  it("returns high risk when order frequency is 5+ in 24h", () => {
    const now = new Date();
    const orders = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      amount: 1_000,
      scheduledAt: new Date(now.getTime() - i * 60 * 60 * 1000),
      status: "completed" as const,
    }));
    const account = makeAccount({ orders });
    const result = analyzeAccountRisk(account);
    const freqFactor = result.factors.find(f => f.type === "order_frequency");
    expect(["high", "critical"]).toContain(freqFactor?.level);
  });

  it("returns critical time overlap when orders are < 30 minutes apart", () => {
    const now = new Date();
    const account = makeAccount({
      balance: 100_000,
      orders: [
        { id: 1, amount: 5_000, scheduledAt: new Date(now.getTime() - 10 * 60 * 1000), status: "pending" },
      ],
    });
    const incomingTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 นาทีหลังจากนี้
    const result = analyzeAccountRisk(account, incomingTime);
    const overlapFactor = result.factors.find(f => f.type === "time_overlap");
    expect(overlapFactor?.level).toBe("critical");
  });

  it("returns correct account info in result", () => {
    const account = makeAccount();
    const result = analyzeAccountRisk(account);
    expect(result.accountId).toBe(1);
    expect(result.accountName).toBe("Test Account");
    expect(result.bankName).toBe("กสิกรไทย");
  });

  it("recommendation contains stop message for critical risk", () => {
    const account = makeAccount({
      balance: 50_000,
      orders: [
        { id: 1, amount: 48_000, scheduledAt: new Date(), status: "pending" },
      ],
    });
    const result = analyzeAccountRisk(account);
    expect(result.recommendation).toContain("หยุดรับออเดอร์");
  });
});

describe("formatRiskAlertForTelegram", () => {
  it("formats message with account info", () => {
    const account = makeAccount();
    const result = analyzeAccountRisk(account);
    const msg = formatRiskAlertForTelegram(result);
    expect(msg).toContain("Test Account");
    expect(msg).toContain("กสิกรไทย");
    expect(msg).toContain("123-456-789");
  });

  it("includes critical emoji for critical level", () => {
    const account = makeAccount({
      balance: 50_000,
      orders: [
        { id: 1, amount: 48_000, scheduledAt: new Date(), status: "pending" },
      ],
    });
    const result = analyzeAccountRisk(account);
    const msg = formatRiskAlertForTelegram(result);
    expect(msg).toContain("🚨");
  });
});
