import { describe, expect, it } from "vitest";
import {
  calculateMonthlyIncome,
  calculateTotalExpenses,
  formatINR,
} from "../lib/financial-engine";
import { INITIAL_MONTHLY_FINANCIAL_STATEMENT } from "../lib/monthly-review";

describe("monthly financial statement amounts", () => {
  it("leaves salary blank until the user enters it", () => {
    const statement = structuredClone(INITIAL_MONTHLY_FINANCIAL_STATEMENT);

    expect(statement.income.salaryInHand).toBe("");
  });

  it("preserves and displays salary amounts without rounding lakh values", () => {
    const statement = structuredClone(INITIAL_MONTHLY_FINANCIAL_STATEMENT);
    statement.income.salaryInHand = "168000";

    const monthlyIncome = calculateMonthlyIncome(statement);

    expect(monthlyIncome).toBe(168000);
    expect(formatINR(monthlyIncome)).toBe("₹1.68L");
  });

  it("includes the mess bill in monthly expenditure totals", () => {
    const statement = structuredClone(INITIAL_MONTHLY_FINANCIAL_STATEMENT);
    statement.expenses.household.messBill = "4500";

    expect(calculateTotalExpenses(statement)).toBe(4500);
  });
});
