/**
 * FIRE54 Centralized Retirement Engine (Single Source of Truth)
 * Consolidates baseline projections, Monte Carlo simulations, dynamic loan payoffs,
 * and gap intelligence into a unified domain API.
 */

// 1. Core types and assumptions
export type * from "./types";
export { DEFAULT_RETIREMENT_ASSUMPTIONS } from "./assumptions";

// 2. Calculations & Primitives
export * from "./calculations";

// 3. Projections & Scenarios
export * from "./projection";

// 4. Dynamic Cashflow & Prepayment Engine
export * from "./dynamic-retirement-engine";

// 5. Gap Intelligence & Athena Analytics
export * from "./gap-intelligence-engine";

// 6. Portfolio Asset Adapter
export * from "./portfolio-asset-adapter";

import { generateRetirementProjection } from "./projection";
import { DEFAULT_RETIREMENT_ASSUMPTIONS } from "./assumptions";
import type { RetirementAssumptions, RetirementProjection } from "./types";

/**
 * Standard accessor for deterministic & Monte Carlo retirement projections.
 */
export const getRetirementProjection = (
  inputs?: any,
  overrides?: Partial<RetirementAssumptions>
): RetirementProjection => {
  // If a full financial profile is passed directly, fall back or merge
  let base = inputs || {};
  if (base.personal && base.assumptions) {
    // Looks like FinancialProfile; extract essentials if not adapted
    base = {
      ...DEFAULT_RETIREMENT_ASSUMPTIONS,
      currentAge: Number(base.personal?.currentAge || 32),
      retirementAge: Number(base.personal?.retirementAge || 54),
      desiredMonthlyIncome: Number(base.goals?.desiredMonthlyRetirementIncome || 100000),
      monthlyInvestment: Number(base.income?.monthlyInvestment || 0),
      annualSipIncrease: Number(base.assumptions?.sipIncrease || 0.10),
      equityReturn: Number(base.assumptions?.equityReturn || 0.12),
      debtReturn: Number(base.assumptions?.debtReturn || 0.07),
      inflationRate: Number(base.assumptions?.inflationRate || 0.06),
      withdrawalRate: Number(base.assumptions?.withdrawalRate || 0.04),
    };
  }
  const merged = overrides ? { ...base, ...overrides } : base;
  return generateRetirementProjection(merged as any);
};

/**
 * Generates triple-scenario sensitivity projections (Conservative, Base, Aggressive).
 */
export function generateRetirementScenarios(
  inputs?: Partial<RetirementAssumptions>
): { conservative: RetirementProjection; base: RetirementProjection; aggressive: RetirementProjection } {
  const baseAssumptions: RetirementAssumptions = {
    ...DEFAULT_RETIREMENT_ASSUMPTIONS,
    ...(inputs || {}),
  };

  const conservative = generateRetirementProjection({
    ...baseAssumptions,
    equityReturn: Math.max(0.01, (baseAssumptions.equityReturn || 0.12) - 0.02),
    debtReturn: Math.max(0.01, (baseAssumptions.debtReturn || 0.07) - 0.02),
    inflationRate: (baseAssumptions.inflationRate || 0.06) + 0.01,
  });

  const base = generateRetirementProjection(baseAssumptions);

  const aggressive = generateRetirementProjection({
    ...baseAssumptions,
    equityReturn: (baseAssumptions.equityReturn || 0.12) + 0.02,
    debtReturn: (baseAssumptions.debtReturn || 0.07) + 0.01,
    inflationRate: Math.max(0.01, (baseAssumptions.inflationRate || 0.06) - 0.01),
  });

  return { conservative, base, aggressive };
}
