import type { FinancialProfile } from "@/lib/profile/profile.types";
import { calculateFinancialRules } from "@/lib/intelligence/financial-rules";
import type { FinancialRulesResult } from "@/lib/intelligence/financial-rules";
import type { RetirementGapAnalysis } from "@/lib/retirement/retirement-engine";

export type PortfolioItemSummary = {
  type: "Asset" | "Liability";
  name: string;
  category?: string;
  currentValue?: number;
  outstandingAmount?: number;
  investedAmount?: number;
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

  // 1. Identify all liquid emergency reserves (Savings Account, Cash, Emergency Fund, Liquid FDs)
  const liquidCategories = [
    "savings account",
    "emergency fund",
    "emergency",
    "fixed deposit",
    "fd",
    "cash",
    "liquid funds",
    "liquid",
    "bank account",
  ];

  const liquidPortfolioAssets = portfolio.filter((item) => {
    if (item.type !== "Asset") return false;
    const cat = (item.category || "").toLowerCase().trim();
    const name = (item.name || "").toLowerCase().trim();

    // NEVER treat real estate as liquid emergency cash
    if (
      name.includes("flat") ||
      name.includes("dehradun") ||
      name.includes("property") ||
      name.includes("real estate") ||
      name.includes("house") ||
      name.includes("apartment") ||
      name.includes("plot") ||
      name.includes("land") ||
      cat.includes("real estate") ||
      cat.includes("property")
    ) {
      return false;
    }
    return (
      liquidCategories.includes(cat) ||
      name.includes("emergency") ||
      name.includes("savings") ||
      name.includes("bank") ||
      name.includes("cash") ||
      name.includes("fixed deposit") ||
      name.includes("fd") ||
      name.includes("liquid")
    );
  });

  const portfolioLiquidValue = liquidPortfolioAssets.reduce((sum, item) => {
    const val = Number(item.currentValue ?? item.investedAmount ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const rawAssets = (profile.assets || {}) as Record<string, any>;
  const profileEmergencyValue =
    Number(rawAssets.emergencyFund) ||
    Number(rawAssets.savings) ||
    Number(rawAssets.savingsAccount) ||
    Number(rawAssets.cash) ||
    0;

  const emergencyFundValue =
    portfolioLiquidValue > 0 ? portfolioLiquidValue : profileEmergencyValue;

  // 2. Identify Home Loan liability flexibly by name or category
  const homeLoan = portfolio.find((item) => {
    if (item.type !== "Liability") return false;
    const name = (item.name || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    return (
      name.includes("home loan") ||
      cat.includes("home loan") ||
      name.includes("mortgage") ||
      cat.includes("mortgage")
    );
  });

  const rawLiabilities = (profile.liabilities || {}) as Record<string, any>;
  const homeLoanOutstanding =
    Number(homeLoan?.currentValue ?? homeLoan?.outstandingAmount ?? 0) ||
    Number(rawLiabilities.homeLoanOutstanding || 0);

  const hasHomeLoan = homeLoanOutstanding > 0;

  const totalAssets = portfolio
    .filter((item) => item.type === "Asset")
    .reduce((sum, item) => {
      const val = Number(item.currentValue ?? item.investedAmount ?? 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const totalLiabilities = portfolio
    .filter((item) => item.type === "Liability")
    .reduce((sum, item) => {
      const val = Number(item.currentValue ?? item.outstandingAmount ?? 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const calculatedNetWorth = totalAssets - totalLiabilities;

  const rawProfile = profile as Record<string, any>;
  const rawIncome = (profile.income || {}) as Record<string, any>;

  const monthlyIncome =
    Number(rawIncome.monthlySalary || rawIncome.salaryInHand || rawIncome.salary) || 0;

  const monthlyExpenses =
    Number(
      rawProfile.expense?.totalExpenses ||
      rawProfile.expenses?.totalExpenses ||
      rawProfile.monthlyExpenses
    ) || 50000;

  const targetMonths =
    Number(rawProfile.goals?.emergencyFundMonths || rawProfile.emergencyFundMonths) || 6;

  // 3. Dynamic required reserve: monthlyExpenses * targetMonths (default 6 months)
  const defaultRequiredReserve = monthlyExpenses * targetMonths;
  const userConfiguredTarget =
    Number(rawProfile.goals?.emergencyFundTarget || rawAssets.emergencyFundTarget) || 0;
  const emergencyFundTarget =
    userConfiguredTarget > 0 ? userConfiguredTarget : defaultRequiredReserve;

  const rules = calculateFinancialRules({
    monthlyIncome,
    monthlyExpenses,
    monthlyInvestments:
      Number(rawProfile.investments?.monthlySip || rawProfile.monthlyInvestment) || 0,
    emergencyFundCorpus: emergencyFundValue,
    totalDebt: homeLoanOutstanding,
    liquidAssets: emergencyFundValue,
    netWorth: calculatedNetWorth,
  });

  const emergencyFundCoverage =
    emergencyFundTarget > 0
      ? emergencyFundValue / emergencyFundTarget
      : targetMonths > 0
      ? rules.emergencyFundMonths / targetMonths
      : 1;

  const emergencyFundBelowTarget = emergencyFundValue < emergencyFundTarget;

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
