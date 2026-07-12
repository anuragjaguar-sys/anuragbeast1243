import { getMonthKey, getMonthLabel, type MonthlyReviewFormData } from "./monthly-review";
import { loadMonthlyReview } from "./storage";

export type ExpenseCategory = {
  id: string;
  category: string;
  amount: number;
  color: string;
};

export type SpendingAnalyticsData = {
  monthKey: string;
  monthLabel: string;
  totalIncome: number;
  totalMonthlySpending: number;
  totalInvestments: number;
  savingsRate: number;
  investmentRate: number;
  expenseCategories: ExpenseCategory[];
};

export type SpendingAnalyticsSource = "monthly-review" | "sample";

export type SpendingAnalyticsResult = {
  data: SpendingAnalyticsData;
  source: SpendingAnalyticsSource;
};

const EXPENSE_COLORS = {
  living: "#10b981",
  travel: "#3b82f6",
  medical: "#8b5cf6",
  other: "#f59e0b",
} as const;

/** Parse a currency string from Monthly Review into a number. */
export function parseAmount(value: string): number {
  if (!value.trim()) return 0;
  const cleaned = value.replace(/[,₹\s]/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

/** Format a number as compact INR for display. */
export function formatINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(0)}k`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function buildExpenseCategories(review: MonthlyReviewFormData): ExpenseCategory[] {
  return [
    {
      id: "living",
      category: "Living Expenses",
      amount: parseAmount(review.livingExpenses),
      color: EXPENSE_COLORS.living,
    },
    {
      id: "travel",
      category: "Travel",
      amount: parseAmount(review.travel),
      color: EXPENSE_COLORS.travel,
    },
    {
      id: "medical",
      category: "Medical",
      amount: parseAmount(review.medical),
      color: EXPENSE_COLORS.medical,
    },
    {
      id: "other",
      category: "Other Expenses",
      amount: parseAmount(review.otherExpenses),
      color: EXPENSE_COLORS.other,
    },
  ];
}

function calcRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/**
 * Transform a Monthly Review record into spending analytics.
 * Returns null when the review has no usable financial data.
 */
export function computeSpendingAnalyticsFromReview(
  review: MonthlyReviewFormData,
  monthKey: string = getMonthKey(),
  monthLabel: string = getMonthLabel()
): SpendingAnalyticsData | null {
  const totalIncome =
    parseAmount(review.netSalary) + parseAmount(review.otherIncome);
  const expenseCategories = buildExpenseCategories(review);
  const totalMonthlySpending = expenseCategories.reduce((sum, c) => sum + c.amount, 0);
  const totalInvestments =
    parseAmount(review.ppf) +
    parseAmount(review.mutualFundSip) +
    parseAmount(review.additionalMutualFund) +
    parseAmount(review.nps);

  if (totalIncome === 0 && totalMonthlySpending === 0 && totalInvestments === 0) {
    return null;
  }

  return {
    monthKey,
    monthLabel,
    totalIncome,
    totalMonthlySpending,
    totalInvestments,
    savingsRate: calcRate(totalIncome - totalMonthlySpending, totalIncome),
    investmentRate: calcRate(totalInvestments, totalIncome),
    expenseCategories: expenseCategories.filter((c) => c.amount > 0),
  };
}

/** Sample data used until Monthly Review data is available. */
export const SAMPLE_SPENDING_ANALYTICS: SpendingAnalyticsData = {
  monthKey: "2026-07",
  monthLabel: "July 2026",
  totalIncome: 265_000,
  totalMonthlySpending: 110_000,
  totalInvestments: 80_000,
  savingsRate: 58.5,
  investmentRate: 30.2,
  expenseCategories: [
    { id: "living", category: "Living Expenses", amount: 85_000, color: EXPENSE_COLORS.living },
    { id: "travel", category: "Travel", amount: 12_000, color: EXPENSE_COLORS.travel },
    { id: "medical", category: "Medical", amount: 5_000, color: EXPENSE_COLORS.medical },
    { id: "other", category: "Other Expenses", amount: 8_000, color: EXPENSE_COLORS.other },
  ],
};

/**
 * Resolve spending analytics for a given month.
 * Prefers Monthly Review data from localStorage; falls back to sample data.
 */
export function getSpendingAnalytics(
  monthKey: string = getMonthKey()
): SpendingAnalyticsResult {
  const review = loadMonthlyReview(monthKey);

  if (review) {
    const computed = computeSpendingAnalyticsFromReview(
      review,
      monthKey,
      getMonthLabel(new Date(`${monthKey}-01`))
    );
    if (computed && computed.expenseCategories.length > 0) {
      return { data: computed, source: "monthly-review" };
    }
  }

  return { data: SAMPLE_SPENDING_ANALYTICS, source: "sample" };
}

/** Percentage of total spending for a single category. */
export function categorySpendingPercent(amount: number, totalSpending: number): number {
  if (totalSpending <= 0) return 0;
  return Math.round((amount / totalSpending) * 1000) / 10;
}
