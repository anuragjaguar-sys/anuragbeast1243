import { DEFAULT_RETIREMENT_ASSUMPTIONS } from "./assumptions";
import { generateRetirementProjection } from "./projection";
import { RetirementAssumptions } from "./types";

export function getRetirementProjection(
  overrides?: Partial<RetirementAssumptions>
) {
  const assumptions: RetirementAssumptions = {
    ...DEFAULT_RETIREMENT_ASSUMPTIONS,
    ...overrides,
  };

  return generateRetirementProjection(assumptions);
}

export * from "./types";
export * from "./calculations";
export * from "./projection";
export * from "./assumptions";
