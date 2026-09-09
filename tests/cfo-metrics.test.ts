import { describe, it, expect } from "vitest";
import { calculateCFOMetrics } from "@/lib/intelligence/cfo-metrics";
import { generateDecisionPlanFromMetrics } from "@/lib/intelligence/decision-engine";

describe("CFO Deterministic Metrics Engine (lib/intelligence/cfo-metrics.ts)", () => {
  const baseProfile: any = {
    income: { monthlySalary: 100000 },
    expense: { totalExpenses: 40000 },
    assets: { emergencyFund: 240000, savings: 50000 },
    investments: { monthlySip: 25000 },
  };

  it("accurately calculates net worth, debt presence, and emergency coverage", () => {
    const portfolio = [
      { type: "Asset", name: "Emergency Fund", currentValue: 120000 },
      { type: "Asset", name: "Mutual Funds", currentValue: 500000 },
      { type: "Liability", name: "Home Loan", currentValue: 2000000 },
    ] as any;

    const metrics = calculateCFOMetrics({
      profile: baseProfile,
      portfolio,
      retirementGap: { corpusGap: 1500000, additionalMonthlyInvestmentNeeded: 5000 } as any,
      behaviour: { currentStreak: 45, relapseCount: 1 },
    });

    expect(metrics.totalAssets).toBe(620000);
    expect(metrics.totalLiabilities).toBe(2000000);
    expect(metrics.calculatedNetWorth).toBe(-1380000);
    expect(metrics.emergencyFundCoverage).toBe(0.5);
    expect(metrics.emergencyFundBelowTarget).toBe(true);
    expect(metrics.hasHomeLoan).toBe(true);
    expect(metrics.retirementGapExists).toBe(true);
    expect(metrics.activeRecoveryRisk).toBe(false);
  });

  it("prioritizes behavioural protection when active recovery risk is detected", () => {
    const portfolio = [
      { type: "Asset", name: "Emergency Fund", currentValue: 500000 },
    ] as any;

    const metrics = calculateCFOMetrics({
      profile: baseProfile,
      portfolio,
      retirementGap: { corpusGap: 0, additionalMonthlyInvestmentNeeded: 0 } as any,
      behaviour: { currentStreak: 12, relapseCount: 1 },
    });

    const plan = generateDecisionPlanFromMetrics(metrics, { currentStreak: 12, relapseCount: 1 });
    expect(plan.phase).toBe("Behavioural Protection");
    expect(plan.priority).toBe("Protect F&O-Free Recovery");
  });
});

import { calculateMonthlyScores } from "@/lib/intelligence/monthly-cfo-engine";

describe("Monthly CFO Scoring Engine (lib/intelligence/monthly-cfo-engine.ts)", () => {
  it("grades high savings and investment rates as Excellent", () => {
    const scores = calculateMonthlyScores({
      fire54Score: 85,
      savingsRate: 55,
      investmentRate: 42,
      emergencyFundProgress: 100,
    });

    expect(scores.overallStatus).toBe("Excellent");
    expect(scores.investmentScore).toBe(100);
    expect(scores.savingScore).toBe(100);
    expect(scores.behaviourScore).toBe(100);
    expect(scores.strength).toBe("Excellent savings discipline");
    expect(scores.risks.length).toBe(0);
  });

  it("identifies low savings and emergency fund shortfalls as risks", () => {
    const scores = calculateMonthlyScores({
      fire54Score: 50,
      savingsRate: 20,
      investmentRate: 15,
      emergencyFundProgress: 60,
    });

    expect(scores.overallStatus).toBe("Needs Attention");
    expect(scores.risks).toContain("Low savings rate");
    expect(scores.risks).toContain("Emergency fund incomplete");
  });
});
