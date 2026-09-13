/**
 * FIRE54 Centralized Retirement Engine (Single Source of Truth)
 * Consolidates baseline projections, Monte Carlo simulations, dynamic loan payoffs,
 * and gap intelligence into a unified domain API.
 */

// 1. Core types and assumptions
export type * from "./types";
export { DEFAULT_RETIREMENT_ASSUMPTIONS } from "./assumptions";
export type { RetirementAssumptions } from "./assumptions";

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

/**
 * Standard accessor for deterministic & Monte Carlo retirement projections.
 */
export const getRetirementProjection = (inputs: any, overrides?: any) => {
  const merged = overrides ? { ...(inputs || {}), ...overrides } : inputs;
  return generateRetirementProjection(merged);
};

/**
 * Generates triple-scenario sensitivity projections (Conservative, Base, Aggressive).
 */
export function generateRetirementScenarios(inputs: any) {
  const baseAssumptions = {
    ...DEFAULT_RETIREMENT_ASSUMPTIONS,
    ...(inputs || {}),
  };

  const conservative = generateRetirementProjection({
    ...baseAssumptions,
    preRetirementReturn: Math.max(0.01, (baseAssumptions.preRetirementReturn || 0.12) - 0.02),
    postRetirementReturn: Math.max(0.01, (baseAssumptions.postRetirementReturn || 0.07) - 0.02),
    inflationRate: (baseAssumptions.inflationRate || 0.06) + 0.01,
  });

  const base = generateRetirementProjection(baseAssumptions);

  const aggressive = generateRetirementProjection({
    ...baseAssumptions,
    preRetirementReturn: (baseAssumptions.preRetirementReturn || 0.12) + 0.02,
    postRetirementReturn: (baseAssumptions.postRetirementReturn || 0.07) + 0.01,
    inflationRate: Math.max(0.01, (baseAssumptions.inflationRate || 0.06) - 0.01),
  });

  return { conservative, base, aggressive };
}
