import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/goals", () => ({
  getGoals: () => [],
}));

vi.mock("@/lib/investments", () => {
  const samplePortfolio = [
    { type: "Asset", name: "Equity MF", category: "Mutual Fund", currentValue: 1000000 },
    { type: "Asset", name: "Emergency Fund", category: "Cash", currentValue: 300000 },
  ];
  return {
    getPortfolio: () => samplePortfolio,
    getAssets: (items: any) => (items || samplePortfolio).filter((i: any) => i.type === "Asset"),
  };
});

import {
  calculateFutureMonthlyIncome,
  calculateAnnualRetirementIncome,
  calculateRequiredCorpus,
  calculateYearsRemaining,
  calculateFireScore,
  calculateRetirementStatus,
} from "../lib/retirement/calculations";
import { getRetirementGapAnalysis } from "../lib/retirement/gap-intelligence-engine";

const mockProfile: any = {
  householdMode: "individual",
  personal: { currentAge: 32, retirementAge: 54 },
  income: { monthlySalary: 150000, monthlyInvestment: 50000, annualIncrement: 7 },
  assets: { mutualFunds: 1000000, emergencyFund: 300000 },
  liabilities: {},
  assumptions: {
    equityReturn: 12,
    debtReturn: 7,
    inflationRate: 6,
    withdrawalRate: 4,
  },
  goals: { desiredMonthlyIncome: 80000 },
};

describe("Retirement Calculations (lib/retirement/calculations.ts)", () => {
  it("calculates future monthly income adjusted for inflation compounding", () => {
    const todayIncome = 100000;
    const inflation = 0.06;
    const years = 10;

    const futureIncome = calculateFutureMonthlyIncome(todayIncome, inflation, years);
    expect(Math.round(futureIncome)).toBe(179085);
  });

  it("calculates annual retirement income from monthly income", () => {
    expect(calculateAnnualRetirementIncome(150000)).toBe(1800000);
  });

  it("calculates required corpus using Safe Withdrawal Rate (SWR)", () => {
    const annualIncome = 1200000;
    const swr = 0.04;

    const requiredCorpus = calculateRequiredCorpus(annualIncome, swr);
    expect(requiredCorpus).toBe(30000000);
  });

  it("calculates remaining working years until target retirement age", () => {
    const assumptions = {
      currentAge: 32,
      retirementAge: 54,
    } as any;

    expect(calculateYearsRemaining(assumptions)).toBe(22);
  });

  it("computes FIRE score bounded between 0 and 100", () => {
    expect(calculateFireScore(15000000, 30000000)).toBe(50);
    expect(calculateFireScore(30000000, 30000000)).toBe(100);
    expect(calculateFireScore(45000000, 30000000)).toBe(100);
    expect(calculateFireScore(10000000, 0)).toBe(100);
  });

  it("evaluates retirement status classification correctly", () => {
    expect(calculateRetirementStatus(100)).toBe("Ahead");
    expect(calculateRetirementStatus(95)).toBe("On Track");
    expect(calculateRetirementStatus(80)).toBe("On Track");
    expect(calculateRetirementStatus(79)).toBe("Behind");
    expect(calculateRetirementStatus(40)).toBe("Behind");
  });
});

describe("Retirement Gap Intelligence Engine (lib/retirement/gap-intelligence-engine.ts)", () => {
  it("computes retirement gap analysis and required investments for profile", () => {
    const analysis = getRetirementGapAnalysis(mockProfile);

    expect(analysis).toHaveProperty("status");
    expect(["ON_TRACK", "NEEDS_ATTENTION", "AT_RISK"]).toContain(analysis.status);
    expect(analysis).toHaveProperty("currentCorpus");
    expect(analysis).toHaveProperty("requiredCorpus");
    expect(analysis).toHaveProperty("projectedCorpus");
    expect(analysis).toHaveProperty("corpusGap");
    expect(analysis).toHaveProperty("requiredMonthlyInvestment");
    expect(analysis).toHaveProperty("recommendation");

    expect(analysis.currentCorpus).toBeGreaterThanOrEqual(1000000);
    expect(typeof analysis.recommendation).toBe("string");
    expect(analysis.recommendation.length).toBeGreaterThan(0);
  });

  it("respects override assumptions when provided", () => {
    const analysisWithCustomRetirementAge = getRetirementGapAnalysis(
      mockProfile,
      { retirementAge: 60 }
    );

    expect(analysisWithCustomRetirementAge.yearsLeft).toBe(28);
  });
});
