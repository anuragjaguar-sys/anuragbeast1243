import { describe, it, expect } from "vitest";
import { calculateEMI, simulateLoanSchedule } from "@/lib/loans/loan-engine";

describe("Loan Engine", () => {
  it("calculates correct EMI for standard Indian home loan amounts", () => {
    const emi = calculateEMI(2500000, 8.5, 240);
    expect(Math.round(emi)).toBe(21696);
  });

  it("handles zero loan gracefully without dividing by zero", () => {
    const emi = calculateEMI(0, 8.5, 240);
    expect(emi).toBe(0);
  });

  it("generates amortization schedule that completes loan balance to zero", () => {
    const simulation = simulateLoanSchedule(100000, 10, 12, 0);
    expect(simulation.schedule.length).toBeLessThanOrEqual(12);
    const finalMonth = simulation.schedule[simulation.schedule.length - 1];
    expect(Math.round(finalMonth.closingBalance)).toBe(0);
  });
});
