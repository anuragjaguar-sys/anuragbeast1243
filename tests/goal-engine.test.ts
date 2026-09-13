import { describe, it, expect } from "vitest";
import { calculateProgress } from "@/lib/goals/calculations";

describe("Goal Calculations Engine", () => {
  it("calculates zero progress when current amount is 0", () => {
    const progress = calculateProgress(0, 1000000);
    expect(progress).toBe(0);
  });

  it("calculates accurate percentage when halfway to target", () => {
    const progress = calculateProgress(500000, 1000000);
    expect(progress).toBe(50);
  });

  it("caps goal progress accurately at 100% when target is exceeded", () => {
    const progress = calculateProgress(1200000, 1000000);
    expect(progress).toBe(100);
  });
});
