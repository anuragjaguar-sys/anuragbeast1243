/**
 * ATHENA Wealth Allocation Engine
 * 
 * This engine manages wealth allocation analysis independently from the Financial Engine.
 * It answers "Where did every rupee of my salary go?" using a 5-bucket wealth framework.
 */

import { parseAmount } from "./spending-analytics";
import type { MonthlyFinancialStatement } from "./monthly-review";
import { getAllMonthlyReviews } from "./storage";

// =========================================
// DATA MODEL
// =========================================

export type WealthBucket = {
  name: "Wealth Creation" | "Essential Living" | "Lifestyle" | "Safety" | "Unallocated";
  amount: number;
  percentage: number;
  targetPercentage: number;
  color: string;
};

export type WealthAllocationTargets = {
  wealthCreation: number;
  essentialLiving: number;
  lifestyle: number;
  safety: number;
  unallocated: number;
};

export type WealthAllocation = {
  salaryReceived: number;
  wealthCreation: number;
  essentialLiving: number;
  lifestyle: number;
  safety: number;
  unallocated: number;
  allocationPercentage: number;
  isComplete: boolean;
  buckets: WealthBucket[];
};

export type AllocationValidation = {
  isValid: boolean;
  deviations: {
    bucket: string;
    actual: number;
    target: number;
    deviation: number;
  }[];
  warnings: string[];
  recommendations: string[];
};

export type LiquidityPosition = {
  emergencyFund: number;
  savingsAccount: number;
  cash: number;
  totalLiquidAssets: number;
  monthlyExpenses: number;
  monthsOfExpensesCovered: number;
};

export type WealthAllocationBreakdown = {
  mutualFunds: number;
  ppf: number;
  nps: number;
  fd: number;
  gold: number;
  otherInvestments: number;
  totalWealthCreation: number;
};

export type MonthlyWealthSummary = {
  salaryReceived: number;
  wealthCreated: number;
  essentialSpent: number;
  lifestyleSpent: number;
  safetyAllocated: number;
  unallocated: number;
};

export type LifetimeWealthSummary = {
  totalSalaryReceived: number;
  totalWealthCreated: number;
  totalEssentialSpent: number;
  totalLifestyleSpent: number;
  totalSafetyAllocated: number;
  totalUnallocated: number;
  averageWealthScore: number;
  monthsTracked: number;
};

export type WealthTrendData = {
  monthKey: string;
  monthLabel: string;
  wealthScore: number;
  wealthCreationPercentage: number;
  essentialLivingPercentage: number;
  lifestylePercentage: number;
  safetyPercentage: number;
  unallocatedPercentage: number;
};

export type CFONotes = {
  allocationHealth: "Excellent" | "Good" | "Fair" | "Poor";
  primaryRecommendation: string;
  secondaryRecommendation: string;
  warning?: string;
};

export type WealthAllocationData = {
  wealthAllocation: WealthAllocation;
  allocationTargets: WealthAllocationTargets;
  allocationValidation: AllocationValidation;
  liquidityPosition: LiquidityPosition;
  wealthAllocationBreakdown: WealthAllocationBreakdown;
  monthlyWealthSummary: MonthlyWealthSummary;
  lifetimeWealthSummary: LifetimeWealthSummary;
  wealthTrendData: WealthTrendData[];
  monthlyWealthScore: number;
  cfoNotes: CFONotes;
};

// =========================================
// DEFAULT TARGETS
// =========================================

export function getDefaultAllocationTargets(): WealthAllocationTargets {
  return {
    wealthCreation: 30,
    essentialLiving: 40,
    lifestyle: 15,
    safety: 10,
    unallocated: 5,
  };
}

// =========================================
// HELPER FUNCTIONS
// =========================================

function safeParseAmount(value: string): number {
  if (!value || !value.trim()) return 0;
  return parseAmount(value);
}

// =========================================
// CALCULATION FUNCTIONS
// =========================================

/**
 * Calculate wealth allocation from monthly financial statement
 */
export function calculateWealthAllocation(
  statement: MonthlyFinancialStatement,
  targets: WealthAllocationTargets
): WealthAllocation {
  const income = statement.income;
  const cashAllocation = statement.cashAllocation;
  const expenses = statement.expenses;

  // Calculate total salary
  const salaryReceived =
    safeParseAmount(income.salaryInHand) +
    safeParseAmount(income.daAllowances) +
    safeParseAmount(income.bonus) +
    safeParseAmount(income.arrears) +
    safeParseAmount(income.interestIncome) +
    safeParseAmount(income.dividend) +
    safeParseAmount(income.rentalIncome) +
    safeParseAmount(income.otherIncome);

  // Calculate Wealth Creation (investments)
  const wealthCreation = safeParseAmount(cashAllocation.investments);

  // Calculate Essential Living (household + family)
  const household = expenses.household;
  const family = expenses.family;
  const essentialLiving =
    safeParseAmount(household.groceries) +
    safeParseAmount(household.electricity) +
    safeParseAmount(household.gas) +
    safeParseAmount(household.internet) +
    safeParseAmount(household.maintenance) +
    safeParseAmount(household.houseHelp) +
    safeParseAmount(household.fuel) +
    safeParseAmount(family.parents) +
    safeParseAmount(family.medical) +
    safeParseAmount(family.children) +
    safeParseAmount(family.gifts);

  // Calculate Lifestyle (lifestyle + travel + misc)
  const lifestyleExp = expenses.lifestyle;
  const travel = expenses.travel;
  const misc = expenses.misc;
  const lifestyle =
    safeParseAmount(lifestyleExp.restaurants) +
    safeParseAmount(lifestyleExp.shopping) +
    safeParseAmount(lifestyleExp.clothes) +
    safeParseAmount(lifestyleExp.entertainment) +
    safeParseAmount(lifestyleExp.gym) +
    safeParseAmount(lifestyleExp.subscriptions) +
    safeParseAmount(travel.flights) +
    safeParseAmount(travel.hotels) +
    safeParseAmount(travel.taxi) +
    safeParseAmount(travel.holiday) +
    safeParseAmount(misc.unexpected) +
    safeParseAmount(misc.repairs) +
    safeParseAmount(misc.other);

  // Calculate Safety (emergency fund + loan payments)
  const safety =
    safeParseAmount(cashAllocation.emergencyFund) +
    safeParseAmount(cashAllocation.homeLoanPrepayment);

  // Calculate Unallocated (cash remaining)
  const unallocated = safeParseAmount(cashAllocation.cashRemaining);

  // Calculate allocation percentage
  const totalAllocated = wealthCreation + essentialLiving + lifestyle + safety + unallocated;
  const allocationPercentage = salaryReceived > 0 ? (totalAllocated / salaryReceived) * 100 : 0;
  const isComplete = Math.abs(allocationPercentage - 100) < 1; // Allow 1% tolerance

  // Calculate percentages for each bucket
  const wealthCreationPercentage = salaryReceived > 0 ? (wealthCreation / salaryReceived) * 100 : 0;
  const essentialLivingPercentage = salaryReceived > 0 ? (essentialLiving / salaryReceived) * 100 : 0;
  const lifestylePercentage = salaryReceived > 0 ? (lifestyle / salaryReceived) * 100 : 0;
  const safetyPercentage = salaryReceived > 0 ? (safety / salaryReceived) * 100 : 0;
  const unallocatedPercentage = salaryReceived > 0 ? (unallocated / salaryReceived) * 100 : 0;

  // Create buckets with targets
  const buckets: WealthBucket[] = [
    {
      name: "Wealth Creation",
      amount: wealthCreation,
      percentage: wealthCreationPercentage,
      targetPercentage: targets.wealthCreation,
      color: "bg-emerald-500",
    },
    {
      name: "Essential Living",
      amount: essentialLiving,
      percentage: essentialLivingPercentage,
      targetPercentage: targets.essentialLiving,
      color: "bg-blue-500",
    },
    {
      name: "Lifestyle",
      amount: lifestyle,
      percentage: lifestylePercentage,
      targetPercentage: targets.lifestyle,
      color: "bg-violet-500",
    },
    {
      name: "Safety",
      amount: safety,
      percentage: safetyPercentage,
      targetPercentage: targets.safety,
      color: "bg-amber-500",
    },
    {
      name: "Unallocated",
      amount: unallocated,
      percentage: unallocatedPercentage,
      targetPercentage: targets.unallocated,
      color: "bg-zinc-500",
    },
  ];

  return {
    salaryReceived,
    wealthCreation,
    essentialLiving,
    lifestyle,
    safety,
    unallocated,
    allocationPercentage,
    isComplete,
    buckets,
  };
}

/**
 * Validate allocation against targets
 */
export function validateAllocation(
  allocation: WealthAllocation,
  targets: WealthAllocationTargets
): AllocationValidation {
  const deviations: AllocationValidation["deviations"] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check each bucket
  for (const bucket of allocation.buckets) {
    const target = targets[bucket.name.toLowerCase().replace(" ", "") as keyof WealthAllocationTargets];
    const deviation = bucket.percentage - target;

    deviations.push({
      bucket: bucket.name,
      actual: bucket.percentage,
      target,
      deviation,
    });

    // Generate warnings for significant deviations
    if (Math.abs(deviation) > 10) {
      warnings.push(`${bucket.name} is ${deviation > 0 ? "above" : "below"} target by ${Math.abs(deviation).toFixed(1)}%`);
    }

    // Generate recommendations
    if (bucket.name === "Wealth Creation" && deviation < -10) {
      recommendations.push("Consider increasing wealth creation to meet long-term goals");
    }
    if (bucket.name === "Lifestyle" && deviation > 10) {
      recommendations.push("Lifestyle spending is above target. Review discretionary expenses");
    }
    if (bucket.name === "Unallocated" && deviation > 5) {
      recommendations.push("Unallocated cash should be invested or allocated to specific goals");
    }
  }

  // Overall validation
  const isValid = warnings.length === 0 && allocation.isComplete;

  return {
    isValid,
    deviations,
    warnings,
    recommendations,
  };
}

/**
 * Calculate liquidity position
 */
export function calculateLiquidityPosition(statement: MonthlyFinancialStatement): LiquidityPosition {
  const assets = statement.assets;
  const expenses = statement.expenses;

  const emergencyFund = safeParseAmount(assets.emergencyFund);
  const savingsAccount = safeParseAmount(assets.savingsAccount);
  const cash = safeParseAmount(assets.cash);

  const totalLiquidAssets = emergencyFund + savingsAccount + cash;

  // Calculate monthly essential expenses
  const household = expenses.household;
  const family = expenses.family;
  const monthlyExpenses =
    safeParseAmount(household.groceries) +
    safeParseAmount(household.electricity) +
    safeParseAmount(household.gas) +
    safeParseAmount(household.internet) +
    safeParseAmount(household.maintenance) +
    safeParseAmount(household.houseHelp) +
    safeParseAmount(household.fuel) +
    safeParseAmount(family.parents) +
    safeParseAmount(family.medical) +
    safeParseAmount(family.children) +
    safeParseAmount(family.gifts);

  const monthsOfExpensesCovered = monthlyExpenses > 0 ? totalLiquidAssets / monthlyExpenses : 0;

  return {
    emergencyFund,
    savingsAccount,
    cash,
    totalLiquidAssets,
    monthlyExpenses,
    monthsOfExpensesCovered,
  };
}

/**
 * Calculate wealth allocation breakdown
 */
export function calculateWealthAllocationBreakdown(statement: MonthlyFinancialStatement): WealthAllocationBreakdown {
  const assets = statement.assets;
  const investments = statement.investments;

  const mutualFunds = safeParseAmount(assets.mutualFunds);
  const ppf = safeParseAmount(assets.ppf);
  const nps = safeParseAmount(assets.nps);
  const fd = safeParseAmount(assets.fd);
  const gold = safeParseAmount(assets.gold);

  const otherInvestments = investments.reduce(
    (sum, inv) => sum + safeParseAmount(inv.currentValue),
    0
  );

  const totalWealthCreation = mutualFunds + ppf + nps + fd + gold + otherInvestments;

  return {
    mutualFunds,
    ppf,
    nps,
    fd,
    gold,
    otherInvestments,
    totalWealthCreation,
  };
}

/**
 * Calculate monthly wealth summary
 */
export function calculateMonthlyWealthSummary(allocation: WealthAllocation): MonthlyWealthSummary {
  return {
    salaryReceived: allocation.salaryReceived,
    wealthCreated: allocation.wealthCreation,
    essentialSpent: allocation.essentialLiving,
    lifestyleSpent: allocation.lifestyle,
    safetyAllocated: allocation.safety,
    unallocated: allocation.unallocated,
  };
}

/**
 * Calculate lifetime wealth summary
 */
export function calculateLifetimeWealthSummary(allStatements: MonthlyFinancialStatement[]): LifetimeWealthSummary {
  const defaultTargets = getDefaultAllocationTargets();

  let totalSalaryReceived = 0;
  let totalWealthCreated = 0;
  let totalEssentialSpent = 0;
  let totalLifestyleSpent = 0;
  let totalSafetyAllocated = 0;
  let totalUnallocated = 0;
  let totalScore = 0;

  for (const statement of allStatements) {
    const allocation = calculateWealthAllocation(statement, defaultTargets);
    const validation = validateAllocation(allocation, defaultTargets);
    const liquidity = calculateLiquidityPosition(statement);
    const score = calculateMonthlyWealthScore(allocation, validation, liquidity);

    totalSalaryReceived += allocation.salaryReceived;
    totalWealthCreated += allocation.wealthCreation;
    totalEssentialSpent += allocation.essentialLiving;
    totalLifestyleSpent += allocation.lifestyle;
    totalSafetyAllocated += allocation.safety;
    totalUnallocated += allocation.unallocated;
    totalScore += score;
  }

  const monthsTracked = allStatements.length;
  const averageWealthScore = monthsTracked > 0 ? totalScore / monthsTracked : 0;

  return {
    totalSalaryReceived,
    totalWealthCreated,
    totalEssentialSpent,
    totalLifestyleSpent,
    totalSafetyAllocated,
    totalUnallocated,
    averageWealthScore,
    monthsTracked,
  };
}

/**
 * Calculate wealth trend data (for charts later)
 */
export function calculateWealthTrendData(allStatements: MonthlyFinancialStatement[]): WealthTrendData[] {
  const defaultTargets = getDefaultAllocationTargets();

  return allStatements.map((statement) => {
    const allocation = calculateWealthAllocation(statement, defaultTargets);
    const validation = validateAllocation(allocation, defaultTargets);
    const liquidity = calculateLiquidityPosition(statement);
    const score = calculateMonthlyWealthScore(allocation, validation, liquidity);

    return {
      monthKey: `${statement.year}-${statement.month.toString().padStart(2, "0")}`,
      monthLabel: new Date(statement.year, statement.month - 1).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
      wealthScore: score,
      wealthCreationPercentage: allocation.buckets[0].percentage,
      essentialLivingPercentage: allocation.buckets[1].percentage,
      lifestylePercentage: allocation.buckets[2].percentage,
      safetyPercentage: allocation.buckets[3].percentage,
      unallocatedPercentage: allocation.buckets[4].percentage,
    };
  });
}

/**
 * Calculate monthly wealth score (0-100)
 */
export function calculateMonthlyWealthScore(
  allocation: WealthAllocation,
  validation: AllocationValidation,
  liquidity: LiquidityPosition
): number {
  let score = 0;

  // Wealth Creation vs target (weight: 25)
  const wealthCreationDeviation = Math.abs(allocation.buckets[0].percentage - allocation.buckets[0].targetPercentage);
  const wealthCreationScore = Math.max(0, 25 - (wealthCreationDeviation / 2));
  score += wealthCreationScore;

  // Essential Living vs target (weight: 20)
  const essentialLivingDeviation = Math.abs(allocation.buckets[1].percentage - allocation.buckets[1].targetPercentage);
  const essentialLivingScore = Math.max(0, 20 - (essentialLivingDeviation / 2));
  score += essentialLivingScore;

  // Lifestyle vs target (weight: 15)
  const lifestyleDeviation = Math.abs(allocation.buckets[2].percentage - allocation.buckets[2].targetPercentage);
  const lifestyleScore = Math.max(0, 15 - (lifestyleDeviation / 2));
  score += lifestyleScore;

  // Safety vs target (weight: 20)
  const safetyDeviation = Math.abs(allocation.buckets[3].percentage - allocation.buckets[3].targetPercentage);
  const safetyScore = Math.max(0, 20 - (safetyDeviation / 2));
  score += safetyScore;

  // Unallocated vs target (weight: 15)
  const unallocatedDeviation = Math.abs(allocation.buckets[4].percentage - allocation.buckets[4].targetPercentage);
  const unallocatedScore = Math.max(0, 15 - (unallocatedDeviation / 2));
  score += unallocatedScore;

  // Liquidity bonus (up to 5 points)
  const liquidityBonus = Math.min(5, liquidity.monthsOfExpensesCovered);
  score += liquidityBonus;

  // Validation bonus (up to 5 points)
  const validationBonus = validation.isValid ? 5 : 0;
  score += validationBonus;

  return Math.min(Math.round(score), 100);
}

/**
 * Generate CFO notes
 */
export function generateCFONotes(
  allocation: WealthAllocation,
  validation: AllocationValidation,
  score: number
): CFONotes {
  // Determine allocation health
  let allocationHealth: CFONotes["allocationHealth"];
  if (score >= 80) allocationHealth = "Excellent";
  else if (score >= 60) allocationHealth = "Good";
  else if (score >= 40) allocationHealth = "Fair";
  else allocationHealth = "Poor";

  // Generate primary recommendation
  let primaryRecommendation = "";
  if (allocation.wealthCreation / allocation.salaryReceived < 0.25) {
    primaryRecommendation = "Increase wealth creation to at least 25% of salary for long-term growth";
  } else if (allocation.unallocated / allocation.salaryReceived > 0.1) {
    primaryRecommendation = "Allocate unallocated cash to investments or specific goals";
  } else if (allocation.lifestyle / allocation.salaryReceived > 0.2) {
    primaryRecommendation = "Review lifestyle spending to align with target allocation";
  } else {
    primaryRecommendation = "Maintain current allocation strategy";
  }

  // Generate secondary recommendation
  let secondaryRecommendation = "";
  if (validation.warnings.length > 0) {
    secondaryRecommendation = `Address ${validation.warnings.length} allocation deviation(s) to optimize wealth building`;
  } else {
    secondaryRecommendation = "Continue monitoring allocation ratios monthly";
  }

  // Add warning if needed
  let warning: string | undefined;
  if (!allocation.isComplete) {
    warning = `Cash allocation incomplete: ${allocation.allocationPercentage.toFixed(1)}% allocated`;
  }

  return {
    allocationHealth,
    primaryRecommendation,
    secondaryRecommendation,
    warning,
  };
}

/**
 * Get all wealth allocation data (single source of truth)
 */
export function getWealthAllocationData(
  statement: MonthlyFinancialStatement,
  allStatements?: MonthlyFinancialStatement[]
): WealthAllocationData {
  const targets = getDefaultAllocationTargets();
  const storedStatements = getAllMonthlyReviews();
  const statements = allStatements || storedStatements.map((s) => s.data);

  const wealthAllocation = calculateWealthAllocation(statement, targets);
  const allocationValidation = validateAllocation(wealthAllocation, targets);
  const liquidityPosition = calculateLiquidityPosition(statement);
  const wealthAllocationBreakdown = calculateWealthAllocationBreakdown(statement);
  const monthlyWealthSummary = calculateMonthlyWealthSummary(wealthAllocation);
  const lifetimeWealthSummary = calculateLifetimeWealthSummary(statements);
  const wealthTrendData = calculateWealthTrendData(statements);
  const monthlyWealthScore = calculateMonthlyWealthScore(
    wealthAllocation,
    allocationValidation,
    liquidityPosition
  );
  const cfoNotes = generateCFONotes(wealthAllocation, allocationValidation, monthlyWealthScore);

  return {
    wealthAllocation,
    allocationTargets: targets,
    allocationValidation,
    liquidityPosition,
    wealthAllocationBreakdown,
    monthlyWealthSummary,
    lifetimeWealthSummary,
    wealthTrendData,
    monthlyWealthScore,
    cfoNotes,
  };
}
