import type { FinancialProfile } from "./profile.types";
import type { RetirementAssumptions } from "@/lib/retirement/types";
import { getAssets, getPortfolio } from "@/lib/investments";
import { getGoals } from "@/lib/goals";
import { DEFAULT_FINANCIAL_PROFILE } from "./profile";

/**
 * Convert the Financial Profile + canonical Portfolio + Goals
 * into the assumptions required by the Retirement Engine.
 *
 * Important architecture rule:
 * - Profile owns assumptions and income inputs.
 * - Portfolio owns current asset values.
 * - Goals own retirement targets when explicitly configured.
 * - Monthly reviews record historical behaviour.
 *
 * Historical SIP changes are NOT automatically treated as a
 * permanent future annual SIP step-up.
 */
export function getRetirementAssumptionsFromProfile(
  profile: FinancialProfile | Partial<FinancialProfile> | null | undefined
): RetirementAssumptions {
  /**
   * Normalize legacy / partial profiles so the retirement engine
   * never receives undefined nested objects.
   */
  const safeProfile = {
    ...DEFAULT_FINANCIAL_PROFILE,
    ...(profile ?? {}),

    personal: {
      ...DEFAULT_FINANCIAL_PROFILE.personal,
      ...profile?.personal,
    },

    income: {
      ...DEFAULT_FINANCIAL_PROFILE.income,
      ...profile?.income,
    },

    assets: {
      ...DEFAULT_FINANCIAL_PROFILE.assets,
      ...profile?.assets,
    },

    liabilities: {
      ...DEFAULT_FINANCIAL_PROFILE.liabilities,
      ...profile?.liabilities,
    },

    assumptions: {
      ...DEFAULT_FINANCIAL_PROFILE.assumptions,
      ...profile?.assumptions,
    },

    goals: {
      ...DEFAULT_FINANCIAL_PROFILE.goals,
      ...profile?.goals,
    },
  };

  /**
   * Retirement target:
   *
   * Prefer an explicitly configured long-term Retirement Goal.
   * Otherwise use the Financial Profile retirement income target.
   */
  const retirementGoal = getGoals().find(
    (goal) =>
      goal.category === "Retirement" &&
      goal.timeframe === "Long Term"
  );

  const assets = getAssets(getPortfolio());

  /**
   * Portfolio is the canonical source for current asset values.
   *
   * We deliberately use currentValue rather than investedAmount:
   * currentValue represents today's actual corpus/market value.
   */
  const valueForCategory = (category: string): number =>
    assets
      .filter((asset) => asset.category === category)
      .reduce(
        (sum, asset) => sum + Number(asset.currentValue || 0),
        0
      );

  // Read from canonical portfolio items, with fallback to safeProfile.assets
  const mutualFunds = valueForCategory("Mutual Fund") || Number(safeProfile.assets?.mutualFunds || 0);
  const ppf = valueForCategory("PPF") || Number(safeProfile.assets?.ppf || 0);
  const epf = valueForCategory("EPF") || Number(safeProfile.assets?.epf || 0);
  const nps = valueForCategory("NPS") || Number(safeProfile.assets?.nps || 0);

  /**
   * Retirement corpus currently consists of:
   * Mutual Funds + PPF + EPF + NPS
   */
  const currentCorpus = mutualFunds + ppf + epf + nps;

  /**
   * Retirement income target precedence:
   *
   * 1. Explicit Retirement Goal target
   * 2. Financial Profile target
   *
   * Do not confuse monthly pension with desired retirement
   * spending/income target.
   */
  const goalDesired = retirementGoal?.desiredMonthlyIncome ?? null;
  const profileDesired =
    safeProfile.goals.desiredMonthlyRetirementIncome;

  const monthlyPension = Number(
    safeProfile.income.monthlyPension || 0
  );

  let desiredMonthlyIncome = Number(profileDesired || 0);

  if (typeof goalDesired === "number" && goalDesired > 0) {
    /**
     * Protect against legacy data where the retirement goal may
     * have accidentally stored monthly pension as the desired
     * retirement income.
     */
    if (goalDesired !== monthlyPension) {
      desiredMonthlyIncome = goalDesired;
    }
  }

  /**
   * IMPORTANT:
   *
   * monthlyInvestment is the CURRENT monthly investment amount.
   *
   * annualSipIncrease is intentionally taken only from the
   * canonical profile assumption for now.
   *
   * A historical SIP increase from Monthly Financial Reviews
   * must NOT automatically become a future recurring step-up.
   *
   * Later, Sprint 3B / SIP Step-Up Engine can provide an explicit
   * confirmed future step-up override.
   */
  const annualSipIncrease = Number(
    safeProfile.assumptions.sipIncrease || 0
  );

  // Cash liberated after debt payoff (EMI + Prepayment redirected to Equity)
  const homeLoanEmi = Number(
    (safeProfile.income as any)?.homeLoanEmi || 
    (safeProfile.liabilities as any)?.homeLoanEmi || 
    18250
  );
  const prepayMonthly = Number(safeProfile.income?.monthlyLoanPrepayment || 50000);
  const postDebtMonthlySurge = homeLoanEmi + prepayMonthly;
  const debtPayoffYears = 1.9; // Age 38.9

  return {
    currentAge: Number(safeProfile.personal.currentAge || 0),

    retirementAge: Number(
      safeProfile.personal.retirementAge || 0
    ),

    // Current retirement assets from canonical Portfolio
    mutualFunds,
    ppf,
    epf,
    nps,

    // Other assets retained for compatibility
    emergencyFund: valueForCategory("Emergency Fund"),

    cash:
      valueForCategory("Savings Account") +
      valueForCategory("Cash"),

    // Legacy compatibility
    currentCorpus,

    // Income
    monthlySalary: Number(
      safeProfile.income.monthlySalary || 0
    ),

    /**
     * Current monthly investment.
     *
     * This is the base SIP used by the retirement engine.
     */
    monthlyInvestment: Number(
      safeProfile.income.monthlyInvestment || 0
    ),
    postDebtMonthlySurge,
    debtPayoffYears,

    /**
     * Future annual SIP increase.
     *
     * This is NOT inferred from historical monthly reviews.
     */
    annualSipIncrease,

    expectedAnnualIncrement: Number(
      safeProfile.assumptions.salaryIncrement || 0
    ),

    // Return assumptions
    equityReturn: Number(
      safeProfile.assumptions.equityReturn || 0
    ),

    equityVolatility: 0.15,

    debtReturn: Number(
      safeProfile.assumptions.debtReturn || 0
    ),

    debtVolatility: 0.03,

    inflationRate: Number(
      safeProfile.assumptions.inflationRate || 0
    ),

    withdrawalRate: Number(
      safeProfile.assumptions.withdrawalRate || 0
    ),

    // Retirement target
    desiredMonthlyIncome,

    monthlyPension,
  };
}