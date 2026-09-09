import { generateRetirementProjection } from "./projection";
import { DEFAULT_RETIREMENT_ASSUMPTIONS } from "./assumptions";
import type { RetirementAssumptions } from "./assumptions";

export { DEFAULT_RETIREMENT_ASSUMPTIONS };
export type { RetirementAssumptions };

export type * from "./types";
export * from "./projection";
export * from "./calculations";

export const getRetirementProjection = (inputs: any, overrides?: any) => {
  const merged = overrides ? { ...(inputs || {}), ...overrides } : inputs;
  return generateRetirementProjection(merged);
};

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