import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";
import { generateRetirementProjection } from "./projection";
import { RetirementAssumptions } from "./types";

export function getRetirementProjection(
  overrides?: Partial<RetirementAssumptions>
) {
  const assumptions: RetirementAssumptions = {
  ...getRetirementAssumptionsFromProfile(),
  ...overrides,
};

  return generateRetirementProjection(assumptions);
}

export * from "./types";
export * from "./calculations";
export * from "./projection";
export * from "./assumptions";
