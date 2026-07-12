import { loadMonthlyReview, getAllMonthlyReviews } from "./storage";
import { parseAmount } from "./spending-analytics";
import type { MonthlyReviewFormData } from "./monthly-review";

export type FinancialMetrics = {
  netWorth: number;
  financialAssets: number;
  savingsRate: number;
  investmentRate: number;
  emergencyFundProgress: number;
  loanProgress: number;
  fire54Score: number;
  retirementScore: number;
};

export type PortfolioAllocation = {
  name: string;
  amount: number;
  value: number;
  color: string;
  liability?: boolean;
};

export type GoalProgress = {
  name: string;
  progress: number;
  target: string;
  current: string;
  color: string;
};

/**
 * Parse currency string to number with fallback to 0
 */
function safeParseAmount(value: string): number {
  if (!value || !value.trim()) return 0;
  return parseAmount(value);
}

/**
 * Calculate Net Worth
 * Net Worth = (Mutual Funds + PPF + NPS + Emergency Fund + Bank Balance + Property) - (Home Loan Outstanding)
 */
export function calculateNetWorth(review: MonthlyReviewFormData): number {
  const assets =
    safeParseAmount(review.mutualFundValue) +
    safeParseAmount(review.ppfValue) +
    safeParseAmount(review.npsValue) +
    safeParseAmount(review.emergencyFund) +
    safeParseAmount(review.bankBalance) +
    5000000; // Property value (₹50L hardcoded as per dashboard)

  const liabilities = safeParseAmount(review.homeLoanOutstanding);

  return assets - liabilities;
}

/**
 * Calculate Financial Assets
 * Financial Assets = Mutual Funds + PPF + NPS + Emergency Fund + Bank Balance
 */
export function calculateFinancialAssets(review: MonthlyReviewFormData): number {
  return (
    safeParseAmount(review.mutualFundValue) +
    safeParseAmount(review.ppfValue) +
    safeParseAmount(review.npsValue) +
    safeParseAmount(review.emergencyFund) +
    safeParseAmount(review.bankBalance)
  );
}

/**
 * Calculate Savings Rate
 * Savings Rate = ((Total Income - Total Expenses) / Total Income) * 100
 */
export function calculateSavingsRate(review: MonthlyReviewFormData): number {
  const totalIncome = safeParseAmount(review.netSalary) + safeParseAmount(review.otherIncome);
  const totalExpenses =
    safeParseAmount(review.livingExpenses) +
    safeParseAmount(review.travel) +
    safeParseAmount(review.medical) +
    safeParseAmount(review.otherExpenses);

  if (totalIncome <= 0) return 0;

  const savings = totalIncome - totalExpenses;
  return Math.round((savings / totalIncome) * 1000) / 10;
}

/**
 * Calculate Investment Rate
 * Investment Rate = (Total Investments / Total Income) * 100
 */
export function calculateInvestmentRate(review: MonthlyReviewFormData): number {
  const totalIncome = safeParseAmount(review.netSalary) + safeParseAmount(review.otherIncome);
  const totalInvestments =
    safeParseAmount(review.ppf) +
    safeParseAmount(review.mutualFundSip) +
    safeParseAmount(review.additionalMutualFund) +
    safeParseAmount(review.nps);

  if (totalIncome <= 0) return 0;

  return Math.round((totalInvestments / totalIncome) * 1000) / 10;
}

/**
 * Calculate Emergency Fund Progress
 * Assumes target is ₹6L (₹600,000)
 */
export function calculateEmergencyFundProgress(review: MonthlyReviewFormData): number {
  const current = safeParseAmount(review.emergencyFund);
  const target = 600000; // ₹6L target

  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Calculate Home Loan Progress
 * Assumes original loan was ₹15.5L (₹1,550,000)
 */
export function calculateLoanProgress(review: MonthlyReviewFormData): number {
  const outstanding = safeParseAmount(review.homeLoanOutstanding);
  const originalLoan = 1550000; // ₹15.5L original loan

  if (originalLoan <= 0) return 0;
  const paid = originalLoan - outstanding;
  return Math.min(Math.round((paid / originalLoan) * 100), 100);
}

/**
 * Calculate FIRE54 Score
 * Composite score based on:
 * - Savings rate (weight: 30%)
 * - Investment rate (weight: 25%)
 * - Emergency fund progress (weight: 20%)
 * - Loan progress (weight: 15%)
 * - Confidence score (weight: 10%)
 */
export function calculateFIRE54Score(review: MonthlyReviewFormData): number {
  const savingsRate = calculateSavingsRate(review);
  const investmentRate = calculateInvestmentRate(review);
  const emergencyFundProgress = calculateEmergencyFundProgress(review);
  const loanProgress = calculateLoanProgress(review);
  const confidence = review.confidence || 7;

  // Normalize each component to 0-100 scale
  const savingsScore = Math.min(savingsRate * 2, 100); // 50% savings = 100 points
  const investmentScore = Math.min(investmentRate * 3.33, 100); // 30% investment = 100 points
  const emergencyScore = emergencyFundProgress;
  const loanScore = loanProgress;
  const confidenceScore = confidence * 10; // 1-10 scale to 0-100

  // Weighted average
  const weightedScore =
    savingsScore * 0.3 +
    investmentScore * 0.25 +
    emergencyScore * 0.2 +
    loanScore * 0.15 +
    confidenceScore * 0.1;

  return Math.round(weightedScore);
}

/**
 * Calculate Retirement Score
 * Based on FIRE54 score with additional factors
 */
export function calculateRetirementScore(review: MonthlyReviewFormData): number {
  const fire54Score = calculateFIRE54Score(review);
  const netWorth = calculateNetWorth(review);

  // Bonus for high net worth (assuming ₹5Cr as FIRE target)
  const netWorthBonus = Math.min((netWorth / 50000000) * 10, 10);

  return Math.min(Math.round(fire54Score + netWorthBonus), 100);
}

/**
 * Get portfolio allocation data
 */
export function getPortfolioAllocation(review: MonthlyReviewFormData): PortfolioAllocation[] {
  return [
    {
      name: "Mutual Funds",
      amount: safeParseAmount(review.mutualFundValue),
      value: safeParseAmount(review.mutualFundValue) / 100000, // in Lakhs
      color: "bg-emerald-500",
    },
    {
      name: "PPF",
      amount: safeParseAmount(review.ppfValue),
      value: safeParseAmount(review.ppfValue) / 100000,
      color: "bg-blue-500",
    },
    {
      name: "NPS",
      amount: safeParseAmount(review.npsValue),
      value: safeParseAmount(review.npsValue) / 100000,
      color: "bg-violet-500",
    },
    {
      name: "Property",
      amount: 5000000,
      value: 50,
      color: "bg-amber-500",
    },
    {
      name: "Home Loan",
      amount: safeParseAmount(review.homeLoanOutstanding),
      value: safeParseAmount(review.homeLoanOutstanding) / 100000,
      color: "bg-rose-500",
      liability: true,
    },
  ];
}

/**
 * Get goals progress data
 */
export function getGoalsProgress(review: MonthlyReviewFormData): GoalProgress[] {
  const emergencyFundCurrent = safeParseAmount(review.emergencyFund);
  const emergencyFundTarget = 600000;
  const emergencyFundProgress = calculateEmergencyFundProgress(review);

  const loanOutstanding = safeParseAmount(review.homeLoanOutstanding);
  const loanOriginal = 1550000;
  const loanPaid = loanOriginal - loanOutstanding;
  const loanProgress = calculateLoanProgress(review);

  // Retirement: Assuming ₹5Cr target, using net worth as proxy
  const netWorth = calculateNetWorth(review);
  const retirementTarget = 50000000;
  const retirementProgress = Math.min(Math.round((netWorth / retirementTarget) * 100), 100);

  // Travel: Assuming ₹8L target, using bank balance as proxy
  const travelCurrent = safeParseAmount(review.bankBalance);
  const travelTarget = 800000;
  const travelProgress = Math.min(Math.round((travelCurrent / travelTarget) * 100), 100);

  return [
    {
      name: "Emergency Fund",
      progress: emergencyFundProgress,
      target: "₹6L",
      current: `₹${(emergencyFundCurrent / 100000).toFixed(1)}L`,
      color: "bg-emerald-500",
    },
    {
      name: "Home Loan",
      progress: loanProgress,
      target: "₹15.5L",
      current: `₹${(loanPaid / 100000).toFixed(1)}L paid`,
      color: "bg-blue-500",
    },
    {
      name: "Retirement",
      progress: retirementProgress,
      target: "₹5 Cr",
      current: `₹${(netWorth / 10000000).toFixed(2)} Cr`,
      color: "bg-violet-500",
    },
    {
      name: "Travel",
      progress: travelProgress,
      target: "₹8L",
      current: `₹${(travelCurrent / 100000).toFixed(1)}L`,
      color: "bg-amber-500",
    },
  ];
}

/**
 * Get all financial metrics for the current month
 * Returns null if no data is available
 */
export function getFinancialMetrics(): FinancialMetrics | null {
  const review = loadMonthlyReview();

  if (!review) {
    return null;
  }

  // Check if review has meaningful data
  const hasData =
    safeParseAmount(review.netSalary) > 0 ||
    safeParseAmount(review.mutualFundValue) > 0 ||
    safeParseAmount(review.ppfValue) > 0 ||
    safeParseAmount(review.bankBalance) > 0;

  if (!hasData) {
    return null;
  }

  return {
    netWorth: calculateNetWorth(review),
    financialAssets: calculateFinancialAssets(review),
    savingsRate: calculateSavingsRate(review),
    investmentRate: calculateInvestmentRate(review),
    emergencyFundProgress: calculateEmergencyFundProgress(review),
    loanProgress: calculateLoanProgress(review),
    fire54Score: calculateFIRE54Score(review),
    retirementScore: calculateRetirementScore(review),
  };
}

/**
 * Format number to INR string
 */
export function formatINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(0)}k`;
  return `₹${amount.toLocaleString("en-IN")}`;
}