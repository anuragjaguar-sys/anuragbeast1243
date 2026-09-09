import type { FinancialProfile } from "@/lib/profile/profile.types";
import { calculateFinancialRules } from "@/lib/intelligence/financial-rules";
import type { FinancialRulesResult } from "@/lib/intelligence/financial-rules";
import type { RetirementGapAnalysis } from "@/lib/retirement/gap-intelligence-engine";

export type PortfolioItemSummary = {
  type: "Asset" | "Liability";
  name: string;
  category?: string;
  currentValue?: number;
};

export type BehaviourSummaryInput = {
  currentStreak: number;
  relapseCount: number;
};

export type CFOMetricsInput = {
  profile: FinancialProfile;
  portfolio: PortfolioItemSummary[];
  retirementGap: RetirementGapAnalysis;
  behaviour: BehaviourSummaryInput;
};

export type CFODeterministicMetrics = {
  totalAssets: number;
  totalLiabilities: number;
  calculatedNetWorth: number;
  emergencyFundValue: number;
  emergencyFundTarget: number;
  emergencyFundCoverage: number;
  emergencyFundBelowTarget: boolean;
  homeLoanOutstanding: number;
  hasHomeLoan: boolean;
  activeRecoveryRisk: boolean;
  recentBehaviouralRelapse: boolean;
  retirementGapExists: boolean;
  corpusGap: number;
  additionalMonthlyInvestmentNeeded: number;
  rules: FinancialRulesResult;
};

export function calculateCFOMetrics(input: CFOMetricsInput): CFODeterministicMetrics {
  const { profile, portfolio, retirementGap, behaviour } = input;

  const currentStreak = behaviour.currentStreak ?? 0;
  const relapseCount = behaviour.relapseCount ?? 0;

  const activeRecoveryRisk = relapseCount > 0 && currentStreak < 30;
  const recentBehaviouralRelapse = relapseCount > 0 && currentStreak < 14;

  const emergencyFundAsset = portfolio.find(
    (item) => item.type === "Asset" && item.name === "Emergency Fund"
  );
  const emergencyFundValue = emergencyFundAsset?.currentValue ?? 0;

  const rawAssets = (profile.assets || {}) as Record<string, any>;
  const emergencyFundTarget = Math.max(rawAssets.emergencyFund || 0, 0);

  const homeLoan = portfolio.find(
    (item) => item.type === "Liability" && item.name === "Home Loan"
  );
  const homeLoanOutstanding = homeLoan?.currentValue ?? 0;
  const hasHomeLoan = homeLoanOutstanding > 0;

  const totalAssets = portfolio
    .filter((item) => item.type === "Asset")
    .reduce((sum, item) => sum + (item.currentValue ?? 0), 0);

  const totalLiabilities = portfolio
    .filter((item) => item.type === "Liability")
    .reduce((sum, item) => sum + (item.currentValue ?? 0), 0);

  const calculatedNetWorth = totalAssets - totalLiabilities;

  const rawProfile = profile as Record<string, any>;
  const rawIncome = (profile.income || {}) as Record<string, any>;

  const rules = calculateFinancialRules({
    monthlyIncome: rawIncome.monthlySalary || rawIncome.salaryInHand || rawIncome.salary || 0,
    monthlyExpenses:
      rawProfile.expense?.totalExpenses ||
      rawProfile.expenses?.totalExpenses ||
      rawProfile.monthlyExpenses ||
      50000,
    monthlyInvestments: rawProfile.investments?.monthlySip || rawProfile.monthlyInvestment || 0,
    emergencyFundCorpus: emergencyFundValue,
    totalDebt: homeLoanOutstanding,
    liquidAssets: emergencyFundValue + (rawAssets.savings || rawAssets.cash || rawAssets.savingsAccount || 0),
    netWorth: calculatedNetWorth,
  });

  const emergencyFundCoverage =
    emergencyFundTarget > 0
      ? emergencyFundValue / emergencyFundTarget
      : rules.emergencyFundMonths / 6;

  const emergencyFundBelowTarget =
    emergencyFundTarget > 0
      ? emergencyFundCoverage < 1
      : !rules.isEmergencyFundAdequate;

  const corpusGap = Math.max(retirementGap?.corpusGap ?? 0, 0);
  const retirementGapExists = corpusGap > 0;
  const additionalMonthlyInvestmentNeeded = Math.max(
    retirementGap?.additionalMonthlyInvestmentNeeded ?? 0,
    0
  );

  return {
    totalAssets,
    totalLiabilities,
    calculatedNetWorth,
    emergencyFundValue,
    emergencyFundTarget,
    emergencyFundCoverage,
    emergencyFundBelowTarget,
    homeLoanOutstanding,
    hasHomeLoan,
    activeRecoveryRisk,
    recentBehaviouralRelapse,
    retirementGapExists,
    corpusGap,
    additionalMonthlyInvestmentNeeded,
    rules,
  };
}
