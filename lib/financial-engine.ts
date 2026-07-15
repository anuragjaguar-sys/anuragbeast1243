import { loadMonthlyReview, getAllMonthlyReviews } from "./storage";
import { parseAmount } from "./spending-analytics";
import type { MonthlyFinancialStatement } from "./monthly-review";

export type FinancialMetrics = {
  netWorth: number;
  financialAssets: number;
  savingsRate: number;
  investmentRate: number;
  emergencyFundProgress: number;
  loanProgress: number;
  fire54Score: number;
  retirementScore: number;
  expenseRatio?: number; // New: For MonthlyFinancialStatement
  debtRatio?: number; // New: For MonthlyFinancialStatement
  financialIndependenceProgress?: number; // New: For MonthlyFinancialStatement
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

export type AICFOInsights = {
  overallHealth: "Excellent" | "Good" | "Fair" | "Poor";
  biggestStrength: string;
  biggestRisk: string;
  recommendation: string;
};

/**
 * Get AI CFO insights from MonthlyFinancialStatement
 */
export function getAICFOInsights(statement: MonthlyFinancialStatement): AICFOInsights {
  const savingsRate = calculateSavingsRateFromStatement(statement);
  const investmentRate = calculateInvestmentRateFromStatement(statement);
  const emergencyFundProgress = calculateEmergencyFundProgressFromStatement(statement);
  const debtRatio = calculateDebtRatio(statement);
  const financialHealthScore = calculateFinancialHealthScore(statement);

  // Determine overall health
  let overallHealth: AICFOInsights["overallHealth"];
  if (financialHealthScore >= 80) overallHealth = "Excellent";
  else if (financialHealthScore >= 60) overallHealth = "Good";
  else if (financialHealthScore >= 40) overallHealth = "Fair";
  else overallHealth = "Poor";

  // Determine biggest strength
  let biggestStrength = "";
  if (savingsRate >= 40) biggestStrength = "Excellent Savings Discipline";
  else if (investmentRate >= 30) biggestStrength = "Strong Investment Portfolio";
  else if (emergencyFundProgress >= 80) biggestStrength = "Well-Funded Emergency Reserve";
  else if (debtRatio < 20) biggestStrength = "Low Debt Burden";
  else biggestStrength = "Consistent Financial Tracking";

  // Determine biggest risk
  let biggestRisk = "";
  if (debtRatio > 50) biggestRisk = "High Debt-to-Asset Ratio";
  else if (emergencyFundProgress < 30) biggestRisk = "Insufficient Emergency Fund";
  else if (savingsRate < 10) biggestRisk = "Low Savings Rate";
  else if (investmentRate < 15) biggestRisk = "Underinvestment in Growth Assets";
  else biggestRisk = "Expense Inflation";

  // Generate recommendation
  let recommendation = "";
  const homeLoanOutstanding = safeParseAmount(statement.liabilities.homeLoanOutstanding);
  
  if (homeLoanOutstanding > 0) {
    recommendation = `Continue home loan prepayment. Current outstanding: ${formatINR(homeLoanOutstanding)}. After loan closure, redirect entire amount into equity mutual funds for long-term growth.`;
  } else if (emergencyFundProgress < 100) {
    recommendation = `Build emergency fund to ₹6L target. Current progress: ${emergencyFundProgress}%. This provides 6 months of expenses as safety net.`;
  } else if (investmentRate < 30) {
    recommendation = `Increase investment rate to 30% for optimal wealth creation. Current rate: ${investmentRate}%. Focus on equity mutual funds for long-term growth.`;
  } else {
    recommendation = `Maintain current financial discipline. Consider diversifying into international funds and rebalancing portfolio annually.`;
  }

  return {
    overallHealth,
    biggestStrength,
    biggestRisk,
    recommendation,
  };
}

/**
 * Parse currency string to number with fallback to 0
 */
function safeParseAmount(value: string): number {
  if (!value || !value.trim()) return 0;
  return parseAmount(value);
}

/**
 * Get portfolio allocation breakdown from MonthlyFinancialStatement
 */
export function getPortfolioAllocation(statement: MonthlyFinancialStatement): PortfolioAllocation[] {
  const allocation: PortfolioAllocation[] = [
    {
      name: "Mutual Funds",
      amount: 0,
      value: safeParseAmount(statement.assets.mutualFunds) / 100000,
      color: "bg-blue-500",
    },
    {
      name: "PPF",
      amount: 0,
      value: safeParseAmount(statement.assets.ppf) / 100000,
      color: "bg-emerald-500",
    },
    {
      name: "NPS",
      amount: 0,
      value: safeParseAmount(statement.assets.nps) / 100000,
      color: "bg-violet-500",
    },
    {
      name: "Emergency Fund",
      amount: 0,
      value: safeParseAmount(statement.assets.emergencyFund) / 100000,
      color: "bg-amber-500",
    },
    {
      name: "Savings Account",
      amount: 0,
      value: safeParseAmount(statement.assets.savingsAccount) / 100000,
      color: "bg-rose-500",
    },
    {
      name: "FD",
      amount: 0,
      value: safeParseAmount(statement.assets.fd) / 100000,
      color: "bg-cyan-500",
    },
    {
      name: "Gold",
      amount: 0,
      value: safeParseAmount(statement.assets.gold) / 100000,
      color: "bg-yellow-500",
    },
    {
      name: "Cash",
      amount: 0,
      value: safeParseAmount(statement.assets.cash) / 100000,
      color: "bg-zinc-500",
    },
    {
      name: "Property",
      amount: 0,
      value: safeParseAmount(statement.assets.property) / 100000,
      color: "bg-indigo-500",
    },
  ];

  // Add investments from the investments array
  statement.investments.forEach((inv) => {
    allocation.push({
      name: inv.name || "Investment",
      amount: safeParseAmount(inv.monthlyContribution),
      value: safeParseAmount(inv.currentValue) / 100000,
      color: "bg-blue-400",
    });
  });

  // Add liabilities
  if (safeParseAmount(statement.liabilities.homeLoanOutstanding) > 0) {
    allocation.push({
      name: "Home Loan",
      amount: 0,
      value: safeParseAmount(statement.liabilities.homeLoanOutstanding) / 100000,
      color: "bg-red-500",
      liability: true,
    });
  }
  if (safeParseAmount(statement.liabilities.vehicleLoan) > 0) {
    allocation.push({
      name: "Vehicle Loan",
      amount: 0,
      value: safeParseAmount(statement.liabilities.vehicleLoan) / 100000,
      color: "bg-red-400",
      liability: true,
    });
  }
  if (safeParseAmount(statement.liabilities.personalLoan) > 0) {
    allocation.push({
      name: "Personal Loan",
      amount: 0,
      value: safeParseAmount(statement.liabilities.personalLoan) / 100000,
      color: "bg-red-300",
      liability: true,
    });
  }
  if (safeParseAmount(statement.liabilities.otherLoan) > 0) {
    allocation.push({
      name: "Other Loan",
      amount: 0,
      value: safeParseAmount(statement.liabilities.otherLoan) / 100000,
      color: "bg-red-200",
      liability: true,
    });
  }

  return allocation.filter((item) => item.value > 0);
}

/**
 * Get goals progress from MonthlyFinancialStatement
 */
export function getGoalsProgress(statement: MonthlyFinancialStatement): GoalProgress[] {
  const netWorth = calculateNetWorthFromStatement(statement);
  const emergencyFund = safeParseAmount(statement.assets.emergencyFund);
  const homeLoanOutstanding = safeParseAmount(statement.liabilities.homeLoanOutstanding);
  const loanOriginal = 1550000;
  const loanPaid = loanOriginal - homeLoanOutstanding;
  const loanProgress = loanOriginal > 0 ? Math.min(Math.round((loanPaid / loanOriginal) * 100), 100) : 100;

  const travelTotal = safeParseAmount(statement.expenses.travel.flights) + 
                      safeParseAmount(statement.expenses.travel.hotels) + 
                      safeParseAmount(statement.expenses.travel.taxi) + 
                      safeParseAmount(statement.expenses.travel.holiday);

  return [
    {
      name: "Emergency Fund",
      progress: calculateEmergencyFundProgressFromStatement(statement),
      target: "₹6L",
      current: `₹${(emergencyFund / 100000).toFixed(1)}L`,
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
      progress: Math.min(Math.round((netWorth / 50000000) * 100), 100),
      target: "₹5 Cr",
      current: `₹${(netWorth / 10000000).toFixed(2)} Cr`,
      color: "bg-violet-500",
    },
    {
      name: "Travel",
      progress: Math.min(Math.round((travelTotal / 800000) * 100), 100),
      target: "₹8L",
      current: `₹${(travelTotal / 100000).toFixed(1)}L`,
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

  // Handle new format (MonthlyFinancialStatement)
  return getFinancialMetricsFromStatement(review);
}

// =========================================
// NEW: Calculation Functions for MonthlyFinancialStatement
// =========================================

/**
 * Calculate total monthly income from all income sources
 */
export function calculateMonthlyIncome(statement: MonthlyFinancialStatement): number {
  const income = statement.income;
  return (
    safeParseAmount(income.salaryInHand) +
    safeParseAmount(income.daAllowances) +
    safeParseAmount(income.bonus) +
    safeParseAmount(income.arrears) +
    safeParseAmount(income.interestIncome) +
    safeParseAmount(income.dividend) +
    safeParseAmount(income.rentalIncome) +
    safeParseAmount(income.otherIncome)
  );
}

/**
 * Calculate total expenses from all expense categories
 */
export function calculateTotalExpenses(statement: MonthlyFinancialStatement): number {
  const expenses = statement.expenses;
  const household = expenses.household;
  const lifestyle = expenses.lifestyle;
  const travel = expenses.travel;
  const family = expenses.family;
  const misc = expenses.misc;

  return (
    safeParseAmount(household.groceries) +
    safeParseAmount(household.electricity) +
    safeParseAmount(household.gas) +
    safeParseAmount(household.internet) +
    safeParseAmount(household.maintenance) +
    safeParseAmount(household.houseHelp) +
    safeParseAmount(household.fuel) +
    safeParseAmount(lifestyle.restaurants) +
    safeParseAmount(lifestyle.shopping) +
    safeParseAmount(lifestyle.clothes) +
    safeParseAmount(lifestyle.entertainment) +
    safeParseAmount(lifestyle.gym) +
    safeParseAmount(lifestyle.subscriptions) +
    safeParseAmount(travel.flights) +
    safeParseAmount(travel.hotels) +
    safeParseAmount(travel.taxi) +
    safeParseAmount(travel.holiday) +
    safeParseAmount(family.parents) +
    safeParseAmount(family.medical) +
    safeParseAmount(family.children) +
    safeParseAmount(family.gifts) +
    safeParseAmount(misc.unexpected) +
    safeParseAmount(misc.repairs) +
    safeParseAmount(misc.other)
  );
}

/**
 * Calculate investment rate from MonthlyFinancialStatement
 * Investment Rate = (Total Investments / Total Income) * 100
 */
export function calculateInvestmentRateFromStatement(statement: MonthlyFinancialStatement): number {
  const totalIncome = calculateMonthlyIncome(statement);
  const totalInvestments = safeParseAmount(statement.cashAllocation.investments);

  if (totalIncome <= 0) return 0;

  return Math.round((totalInvestments / totalIncome) * 1000) / 10;
}

/**
 * Calculate savings rate from MonthlyFinancialStatement
 * Savings Rate = ((Total Income - Total Expenses) / Total Income) * 100
 */
export function calculateSavingsRateFromStatement(statement: MonthlyFinancialStatement): number {
  const totalIncome = calculateMonthlyIncome(statement);
  const totalExpenses = calculateTotalExpenses(statement);

  if (totalIncome <= 0) return 0;

  const savings = totalIncome - totalExpenses;
  return Math.round((savings / totalIncome) * 1000) / 10;
}

/**
 * Calculate net worth from MonthlyFinancialStatement
 * Net Worth = (Financial Assets + Property) - Liabilities
 */
export function calculateNetWorthFromStatement(statement: MonthlyFinancialStatement): number {
  const assets = statement.assets;
  const liabilities = statement.liabilities;

  const financialAssets =
    safeParseAmount(assets.savingsAccount) +
    safeParseAmount(assets.emergencyFund) +
    safeParseAmount(assets.mutualFunds) +
    safeParseAmount(assets.ppf) +
    safeParseAmount(assets.nps) +
    safeParseAmount(assets.fd) +
    safeParseAmount(assets.gold) +
    safeParseAmount(assets.cash);

  const propertyValue = safeParseAmount(assets.property);

  const totalLiabilities =
    safeParseAmount(liabilities.homeLoanOutstanding) +
    safeParseAmount(liabilities.vehicleLoan) +
    safeParseAmount(liabilities.personalLoan) +
    safeParseAmount(liabilities.otherLoan);

  return financialAssets + propertyValue - totalLiabilities;
}

/**
 * Calculate debt ratio from MonthlyFinancialStatement
 * Debt Ratio = (Total Liabilities / Total Assets) * 100
 */
export function calculateDebtRatio(statement: MonthlyFinancialStatement): number {
  const assets = statement.assets;
  const liabilities = statement.liabilities;

  const totalAssets =
    safeParseAmount(assets.savingsAccount) +
    safeParseAmount(assets.emergencyFund) +
    safeParseAmount(assets.mutualFunds) +
    safeParseAmount(assets.ppf) +
    safeParseAmount(assets.nps) +
    safeParseAmount(assets.fd) +
    safeParseAmount(assets.gold) +
    safeParseAmount(assets.property) +
    safeParseAmount(assets.cash);

  const totalLiabilities =
    safeParseAmount(liabilities.homeLoanOutstanding) +
    safeParseAmount(liabilities.vehicleLoan) +
    safeParseAmount(liabilities.personalLoan) +
    safeParseAmount(liabilities.otherLoan);

  if (totalAssets <= 0) return 0;

  return Math.round((totalLiabilities / totalAssets) * 1000) / 10;
}

/**
 * Calculate emergency fund progress from MonthlyFinancialStatement
 * Assumes target is ₹6L (₹600,000)
 */
export function calculateEmergencyFundProgressFromStatement(statement: MonthlyFinancialStatement): number {
  const current = safeParseAmount(statement.assets.emergencyFund);
  const target = 600000; // ₹6L target

  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Verify cash allocation balance
 * Returns true if income = allocation, false otherwise
 */
export function calculateCashAllocation(statement: MonthlyFinancialStatement): {
  isBalanced: boolean;
  income: number;
  allocation: number;
  difference: number;
} {
  const income = calculateMonthlyIncome(statement);
  const allocation = statement.cashAllocation;

  const totalAllocation =
    safeParseAmount(allocation.investments) +
    safeParseAmount(allocation.emergencyFund) +
    safeParseAmount(allocation.savingsAccount) +
    safeParseAmount(allocation.homeLoanPrepayment) +
    safeParseAmount(allocation.monthlyExpenses) +
    safeParseAmount(allocation.cashRemaining);

  const difference = income - totalAllocation;
  const isBalanced = Math.abs(difference) < 1; // Allow for rounding errors

  return {
    isBalanced,
    income,
    allocation: totalAllocation,
    difference,
  };
}

/**
 * Calculate financial health score from MonthlyFinancialStatement
 * Composite score based on multiple factors
 */
export function calculateFinancialHealthScore(statement: MonthlyFinancialStatement): number {
  const savingsRate = calculateSavingsRateFromStatement(statement);
  const investmentRate = calculateInvestmentRateFromStatement(statement);
  const emergencyFundProgress = calculateEmergencyFundProgressFromStatement(statement);
  const debtRatio = calculateDebtRatio(statement);

  // Normalize each component to 0-100 scale
  const savingsScore = Math.min(savingsRate * 2, 100); // 50% savings = 100 points
  const investmentScore = Math.min(investmentRate * 3.33, 100); // 30% investment = 100 points
  const emergencyScore = emergencyFundProgress;
  const debtScore = Math.max(100 - debtRatio * 2, 0); // Lower debt is better

  // Weighted average
  const weightedScore =
    savingsScore * 0.3 +
    investmentScore * 0.25 +
    emergencyScore * 0.25 +
    debtScore * 0.2;

  return Math.round(weightedScore);
}

/**
 * Get financial metrics from MonthlyFinancialStatement
 */
function getFinancialMetricsFromStatement(statement: MonthlyFinancialStatement): FinancialMetrics | null {
  const totalIncome = calculateMonthlyIncome(statement);
  const totalExpenses = calculateTotalExpenses(statement);

  // Check if statement has meaningful data
  const hasData = totalIncome > 0 || calculateNetWorthFromStatement(statement) > 0;

  if (!hasData) {
    return null;
  }

  const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 1000) / 10 : 0;
  const debtRatio = calculateDebtRatio(statement);
  const netWorth = calculateNetWorthFromStatement(statement);
  const financialIndependenceProgress = Math.min(Math.round((netWorth / 50000000) * 100), 100); // Assuming ₹5Cr as FIRE target

  return {
    netWorth,
    financialAssets:
      safeParseAmount(statement.assets.savingsAccount) +
      safeParseAmount(statement.assets.emergencyFund) +
      safeParseAmount(statement.assets.mutualFunds) +
      safeParseAmount(statement.assets.ppf) +
      safeParseAmount(statement.assets.nps) +
      safeParseAmount(statement.assets.fd) +
      safeParseAmount(statement.assets.gold) +
      safeParseAmount(statement.assets.cash),
    savingsRate: calculateSavingsRateFromStatement(statement),
    investmentRate: calculateInvestmentRateFromStatement(statement),
    emergencyFundProgress: calculateEmergencyFundProgressFromStatement(statement),
    loanProgress: Math.min(
      Math.round(
        ((safeParseAmount(statement.liabilities.homeLoanOutstanding) / 1550000) * 100) * -1 + 100
      ),
      100
    ),
    fire54Score: calculateFinancialHealthScore(statement),
    retirementScore: Math.min(
      Math.round(calculateFinancialHealthScore(statement) + (netWorth / 50000000) * 10),
      100
    ),
    expenseRatio,
    debtRatio,
    financialIndependenceProgress,
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