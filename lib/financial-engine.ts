import { loadMonthlyReview, getAllMonthlyReviews } from "./storage";
import { parseAmount } from "./spending-analytics";
import type { MonthlyFinancialStatement } from "./monthly-review";
import {
  getPortfolioSummary,
  getPortfolio,
  getAssets,
  getLiabilities,
} from "./investments";

export type FinancialMetrics = {
  netWorth: number;
  financialAssets: number;
  savingsRate: number;
  investmentRate: number;
  emergencyFundProgress: number;
  loanProgress: number;
  fire54Score: number;
  retirementScore: number;
  expenseRatio?: number;
  debtRatio?: number;
  financialIndependenceProgress?: number;
};

export type AICFOInsights = {
  overallHealth: "Excellent" | "Good" | "Fair" | "Poor";
  biggestStrength: string;
  biggestRisk: string;
  recommendation: string;
};

/**
 * Parse currency string to number with fallback to 0.
 */
function safeParseAmount(value: string): number {
  if (!value || !value.trim()) return 0;
  return parseAmount(value);
}

/**
 * Get AI CFO insights from MonthlyFinancialStatement.
 *
 * This function currently operates on the monthly statement because
 * it evaluates monthly financial behaviour.
 *
 * Current balance-sheet values are handled separately by Portfolio.
 */
export function getAICFOInsights(
  statement: MonthlyFinancialStatement
): AICFOInsights {
  const savingsRate = calculateSavingsRateFromStatement(statement);
  const investmentRate = calculateInvestmentRateFromStatement(statement);
  const emergencyFundProgress =
    calculateEmergencyFundProgressFromStatement(statement);
  const debtRatio = calculateDebtRatio(statement);
  const financialHealthScore = calculateFinancialHealthScore(statement);

  let overallHealth: AICFOInsights["overallHealth"];

  if (financialHealthScore >= 80) {
    overallHealth = "Excellent";
  } else if (financialHealthScore >= 60) {
    overallHealth = "Good";
  } else if (financialHealthScore >= 40) {
    overallHealth = "Fair";
  } else {
    overallHealth = "Poor";
  }

  let biggestStrength = "";

  if (savingsRate >= 40) {
    biggestStrength = "Excellent Savings Discipline";
  } else if (investmentRate >= 30) {
    biggestStrength = "Strong Investment Portfolio";
  } else if (emergencyFundProgress >= 80) {
    biggestStrength = "Well-Funded Emergency Reserve";
  } else if (debtRatio < 20) {
    biggestStrength = "Low Debt Burden";
  } else {
    biggestStrength = "Consistent Financial Tracking";
  }

  let biggestRisk = "";

  if (debtRatio > 50) {
    biggestRisk = "High Debt-to-Asset Ratio";
  } else if (emergencyFundProgress < 30) {
    biggestRisk = "Insufficient Emergency Fund";
  } else if (savingsRate < 10) {
    biggestRisk = "Low Savings Rate";
  } else if (investmentRate < 15) {
    biggestRisk = "Underinvestment in Growth Assets";
  } else {
    biggestRisk = "Expense Inflation";
  }

  let recommendation = "";

  const homeLoanOutstanding = safeParseAmount(
    statement.liabilities.homeLoanOutstanding
  );

  if (homeLoanOutstanding > 0) {
    recommendation =
      `Continue home loan prepayment. Current outstanding: ${formatINR(
        homeLoanOutstanding
      )}. After loan closure, redirect entire amount into equity mutual funds for long-term growth.`;
  } else if (emergencyFundProgress < 100) {
    recommendation =
      `Build emergency fund to ₹6L target. Current progress: ${emergencyFundProgress}%. This provides 6 months of expenses as safety net.`;
  } else if (investmentRate < 30) {
    recommendation =
      `Increase investment rate to 30% for optimal wealth creation. Current rate: ${investmentRate}%. Focus on equity mutual funds for long-term growth.`;
  } else {
    recommendation =
      "Maintain current financial discipline. Consider diversifying into international funds and rebalancing portfolio annually.";
  }

  return {
    overallHealth,
    biggestStrength,
    biggestRisk,
    recommendation,
  };
}

/**
 * Current Financial Position
 *
 * Portfolio is the canonical source of truth for:
 * - current assets
 * - current liabilities
 * - current net worth
 * - current emergency fund
 * - current loan balances
 *
 * Monthly statements are historical records and are not used here.
 */
export function getCurrentFinancialPosition() {
  const portfolio = getPortfolio();

  const assets = getAssets(portfolio);
  const liabilities = getLiabilities(portfolio);

  const valueForCategory = (category: string): number =>
    assets
      .filter((asset) => asset.category === category)
      .reduce((sum, asset) => sum + asset.currentValue, 0);

  const liabilityForCategory = (category: string): number =>
    liabilities
      .filter((liability) => liability.category === category)
      .reduce(
        (sum, liability) => sum + liability.outstandingAmount,
        0
      );

  const mutualFunds = valueForCategory("Mutual Fund");
  const ppf = valueForCategory("PPF");
  const epf = valueForCategory("EPF");
  const nps = valueForCategory("NPS");
  const emergencyFund = valueForCategory("Emergency Fund");

  const cash =
    valueForCategory("Savings Account") +
    valueForCategory("Cash");

  const homeLoan = liabilityForCategory("Home Loan");
  const otherLoans = liabilityForCategory("Other");

  const financialAssets = assets.reduce(
    (sum, asset) => sum + asset.currentValue,
    0
  );

  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + liability.outstandingAmount,
    0
  );

  const netWorth = financialAssets - totalLiabilities;

  return {
    mutualFunds,
    ppf,
    epf,
    nps,
    emergencyFund,
    cash,
    homeLoan,
    otherLoans,
    financialAssets,
    totalLiabilities,
    netWorth,
  };
}

/**
 * Get all financial metrics for the current month.
 *
 * Responsibility split:
 *
 * Portfolio:
 * - net worth
 * - financial assets
 * - debt ratio
 * - current emergency fund
 * - current home loan
 *
 * Monthly Financial Statement:
 * - savings rate
 * - investment rate
 * - expense ratio
 * - monthly financial health score
 *
 * Goal / Retirement engines will eventually own the
 * target-based progress calculations.
 */
export function getFinancialMetrics(): FinancialMetrics | null {
  const review = loadMonthlyReview();
  const position = getCurrentFinancialPosition();
  const portfolio = getPortfolioSummary(getPortfolio());

  const hasPortfolioData =
    position.financialAssets > 0 ||
    position.totalLiabilities > 0;

  const hasMonthlyData = review !== null;

  if (!hasPortfolioData && !hasMonthlyData) {
    return null;
  }

  const statementMetrics = review
    ? getFinancialMetricsFromStatement(review)
    : null;

  const emergencyFund = position.emergencyFund;
  const homeLoan = position.homeLoan;

  /*
   * Temporary compatibility targets.
   *
   * These are intentionally isolated here.
   * They will be replaced by Profile / Goal / Retirement
   * engine values in the next structural migration.
   */
  const emergencyFundTarget = 600_000;
  const homeLoanOriginal = 1_550_000;
  const netWorthTarget = 50_000_000;

  const emergencyFundProgress =
    emergencyFundTarget > 0
      ? Math.min(
          Math.round(
            (emergencyFund / emergencyFundTarget) * 100
          ),
          100
        )
      : 0;

  const loanProgress =
    homeLoanOriginal > 0
      ? Math.min(
          Math.round(
            ((homeLoanOriginal - homeLoan) /
              homeLoanOriginal) *
              100
          ),
          100
        )
      : 100;

  const debtRatio =
    position.financialAssets > 0
      ? Math.round(
          (position.totalLiabilities /
            position.financialAssets) *
            1000
        ) / 10
      : 0;

  const financialIndependenceProgress =
    netWorthTarget > 0
      ? Math.min(
          Math.round(
            (portfolio.netWorth / netWorthTarget) * 100
          ),
          100
        )
      : 0;

  return {
    /*
     * Canonical current financial position.
     */
    netWorth: portfolio.netWorth,
    financialAssets: portfolio.totalAssets,

    /*
     * Monthly behavioural metrics.
     */
    savingsRate: statementMetrics?.savingsRate ?? 0,
    investmentRate: statementMetrics?.investmentRate ?? 0,
    fire54Score: statementMetrics?.fire54Score ?? 0,
    retirementScore: statementMetrics?.retirementScore ?? 0,
    expenseRatio: statementMetrics?.expenseRatio ?? 0,

    /*
     * Current portfolio progress.
     *
     * Target sources are temporarily retained for compatibility.
     */
    emergencyFundProgress,
    loanProgress,

    /*
     * Current debt ratio comes exclusively from Portfolio.
     */
    debtRatio,

    /*
     * Temporary compatibility metric.
     *
     * The retirement / FIRE target will eventually come from
     * the Retirement Engine rather than this hardcoded value.
     */
    financialIndependenceProgress,
  };
}

/**
 * Calculate total monthly income from all income sources.
 *
 * This is a Monthly Financial Statement calculation.
 */
export function calculateMonthlyIncome(
  statement: MonthlyFinancialStatement
): number {
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
 * Calculate total monthly expenses from all expense categories.
 *
 * This is a Monthly Financial Statement calculation.
 */
export function calculateTotalExpenses(
  statement: MonthlyFinancialStatement
): number {
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
 * Calculate investment rate from Monthly Financial Statement.
 *
 * Investment Rate = (Total Investments / Total Income) * 100
 */
export function calculateInvestmentRateFromStatement(
  statement: MonthlyFinancialStatement
): number {
  const totalIncome = calculateMonthlyIncome(statement);
  const totalInvestments = safeParseAmount(
    statement.cashAllocation.investments
  );

  if (totalIncome <= 0) return 0;

  return Math.round(
    (totalInvestments / totalIncome) * 1000
  ) / 10;
}

/**
 * Calculate savings rate from Monthly Financial Statement.
 *
 * Savings Rate = ((Total Income - Total Expenses) / Total Income) * 100
 */
export function calculateSavingsRateFromStatement(
  statement: MonthlyFinancialStatement
): number {
  const totalIncome = calculateMonthlyIncome(statement);
  const totalExpenses = calculateTotalExpenses(statement);

  if (totalIncome <= 0) return 0;

  const savings = totalIncome - totalExpenses;

  return Math.round(
    (savings / totalIncome) * 1000
  ) / 10;
}

/**
 * Legacy monthly-statement net worth calculation.
 *
 * IMPORTANT:
 * This is retained temporarily because existing monthly
 * health / historical calculations still reference it.
 *
 * It must NOT be used as the current net-worth source.
 */
export function calculateNetWorthFromStatement(
  statement: MonthlyFinancialStatement
): number {
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

  return (
    financialAssets +
    propertyValue -
    totalLiabilities
  );
}

/**
 * Calculate debt ratio from Monthly Financial Statement.
 *
 * This remains a historical/monthly calculation for the
 * monthly health scoring path.
 *
 * Current debt ratio is calculated from Portfolio inside
 * getFinancialMetrics().
 */
export function calculateDebtRatio(
  statement: MonthlyFinancialStatement
): number {
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

  return Math.round(
    (totalLiabilities / totalAssets) * 1000
  ) / 10;
}

/**
 * Calculate emergency fund progress from Monthly Financial Statement.
 *
 * LEGACY / HISTORICAL ONLY.
 *
 * Current emergency-fund progress is calculated from Portfolio
 * inside getFinancialMetrics().
 */
export function calculateEmergencyFundProgressFromStatement(
  statement: MonthlyFinancialStatement
): number {
  const current = safeParseAmount(
    statement.assets.emergencyFund
  );

  const target = 600_000;

  if (target <= 0) return 0;

  return Math.min(
    Math.round((current / target) * 100),
    100
  );
}

/**
 * Verify cash allocation balance.
 *
 * Returns true if income = allocation.
 */
export function calculateCashAllocation(
  statement: MonthlyFinancialStatement
): {
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
  const isBalanced = Math.abs(difference) < 1;

  return {
    isBalanced,
    income,
    allocation: totalAllocation,
    difference,
  };
}

/**
 * Calculate financial health score from Monthly Financial Statement.
 *
 * This is intentionally a monthly-behaviour score.
 */
export function calculateFinancialHealthScore(
  statement: MonthlyFinancialStatement
): number {
  const savingsRate =
    calculateSavingsRateFromStatement(statement);

  const investmentRate =
    calculateInvestmentRateFromStatement(statement);

  const emergencyFundProgress =
    calculateEmergencyFundProgressFromStatement(statement);

  const debtRatio =
    calculateDebtRatio(statement);

  const savingsScore = Math.min(
    savingsRate * 2,
    100
  );

  const investmentScore = Math.min(
    investmentRate * 3.33,
    100
  );

  const emergencyScore =
    emergencyFundProgress;

  const debtScore = Math.max(
    100 - debtRatio * 2,
    0
  );

  const weightedScore =
    savingsScore * 0.3 +
    investmentScore * 0.25 +
    emergencyScore * 0.25 +
    debtScore * 0.2;

  return Math.round(weightedScore);
}

/**
 * Extract monthly behavioural metrics from a Monthly Financial Statement.
 *
 * This function no longer calculates current:
 * - net worth
 * - financial assets
 * - debt ratio
 * - emergency-fund position
 * - loan position
 * - financial-independence progress
 *
 * Those belong to Portfolio / Goal / Retirement engines.
 */
function getFinancialMetricsFromStatement(
  statement: MonthlyFinancialStatement
): FinancialMetrics | null {
  const totalIncome =
    calculateMonthlyIncome(statement);

  const totalExpenses =
    calculateTotalExpenses(statement);

  const hasData =
    totalIncome > 0 ||
    totalExpenses > 0 ||
    safeParseAmount(
      statement.cashAllocation.investments
    ) > 0;

  if (!hasData) {
    return null;
  }

  const expenseRatio =
    totalIncome > 0
      ? Math.round(
          (totalExpenses / totalIncome) * 1000
        ) / 10
      : 0;

  const savingsRate =
    calculateSavingsRateFromStatement(statement);

  const investmentRate =
    calculateInvestmentRateFromStatement(statement);

  const fire54Score =
    calculateFinancialHealthScore(statement);

  /*
   * Temporary compatibility value.
   *
   * The old retirement score mixed monthly health with
   * a hardcoded net-worth target. We intentionally remove
   * that cross-domain calculation.
   */
  const retirementScore = Math.min(
    Math.round(fire54Score),
    100
  );

  return {
    /*
     * These values are intentionally not sourced from
     * the monthly statement anymore.
     *
     * getFinancialMetrics() supplies current Portfolio values.
     */
    netWorth: 0,
    financialAssets: 0,

    /*
     * Monthly behaviour metrics.
     */
    savingsRate,
    investmentRate,
    fire54Score,
    retirementScore,
    expenseRatio,

    /*
     * Current-state progress metrics are supplied by
     * getFinancialMetrics().
     */
    emergencyFundProgress: 0,
    loanProgress: 0,
    debtRatio: 0,
    financialIndependenceProgress: 0,
  };
}

/**
 * Format number to INR string.
 */
export function formatINR(amount: number): string {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  }

  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1)}L`;
  }

  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(0)}k`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}