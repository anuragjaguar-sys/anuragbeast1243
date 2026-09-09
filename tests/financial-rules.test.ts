import { describe, it, expect } from "vitest";
import { calculateFinancialRules } from "../lib/intelligence/financial-rules";

describe("Financial Rules & Deterministic Math Engine", () => {
  it("correctly computes savings rate and investment rate", () => {
    const rules = calculateFinancialRules({
      monthlyIncome: 200000,
      monthlyExpenses: 80000,
      monthlyInvestments: 60000,
      emergencyFundCorpus: 480000,
      totalDebt: 0,
      liquidAssets: 500000,
      netWorth: 2500000,
    });

    expect(rules.savingsRate).toBe(60.0);
    expect(rules.investmentRate).toBe(30.0);
    expect(rules.monthlySurplus).toBe(60000);
    expect(rules.isInvestmentRateOptimal).toBe(true);
  });

  it("handles zero income safely without NaN or division by zero", () => {
    const rules = calculateFinancialRules({
      monthlyIncome: 0,
      monthlyExpenses: 50000,
      monthlyInvestments: 0,
      emergencyFundCorpus: 100000,
      totalDebt: 0,
      liquidAssets: 100000,
      netWorth: 100000,
    });

    expect(rules.savingsRate).toBe(0);
    expect(rules.investmentRate).toBe(0);
    expect(rules.debtToIncomeRatio).toBe(0);
    expect(rules.runwayMonths).toBe(2.0);
  });

  it("flags inadequate emergency fund if below 6 months", () => {
    const rules = calculateFinancialRules({
      monthlyIncome: 150000,
      monthlyExpenses: 50000,
      monthlyInvestments: 30000,
      emergencyFundCorpus: 150000,
      totalDebt: 0,
      liquidAssets: 200000,
      netWorth: 1000000,
    });

    expect(rules.emergencyFundMonths).toBe(3.0);
    expect(rules.isEmergencyFundAdequate).toBe(false);
  });

  it("calculates debt-to-income ratio correctly against annual income", () => {
    const rules = calculateFinancialRules({
      monthlyIncome: 100000,
      monthlyExpenses: 40000,
      monthlyInvestments: 20000,
      emergencyFundCorpus: 300000,
      totalDebt: 600000,
      liquidAssets: 300000,
      netWorth: 1200000,
    });

    expect(rules.debtToIncomeRatio).toBe(50.0);
  });
});
