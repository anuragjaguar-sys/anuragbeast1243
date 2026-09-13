import { describe, it, expect } from "vitest";
import { calculateWealthAllocation, validateAllocation } from "@/lib/wealth-allocation-engine";
import type { MonthlyFinancialStatement } from "@/lib/monthly-review";
import type { WealthAllocationTargets } from "@/lib/wealth-allocation-engine";

describe("Wealth Allocation Engine", () => {
  const sampleTargets: WealthAllocationTargets = {
    wealthCreation: 50,
    essentialLiving: 30,
    lifestyle: 10,
    safety: 10,
    unallocated: 0,
  };

  const sampleStatement: MonthlyFinancialStatement = {
    id: "stmt-2026-09",
    month: "2026-09",
    income: {
      salaryInHand: "150000",
      daAllowances: "0",
      bonus: "0",
      arrears: "0",
      interestIncome: "0",
      dividend: "0",
      rentalIncome: "0",
      otherIncome: "0",
    },
    cashAllocation: {
      investments: "75000",
      emergencyFund: "10000",
      homeLoanPrepayment: "5000",
      cashRemaining: "0",
    },
    expenses: {
      household: {
        groceries: "20000",
        electricity: "3000",
        gas: "1000",
        internet: "1000",
        maintenance: "2000",
        houseHelp: "3000",
        fuel: "5000",
      },
      family: {
        parents: "5000",
        medical: "2000",
        children: "0",
        gifts: "0",
      },
      lifestyle: {
        restaurants: "5000",
        shopping: "4000",
        clothes: "2000",
      },
      travel: {
        hotels: "0",
        taxi: "1000",
        holiday: "0",
      },
      misc: {
        unexpected: "2000",
        repairs: "0",
        other: "1000",
      },
    },
  } as unknown as MonthlyFinancialStatement;

  it("calculates total income, bucket sums, and completion status", () => {
    const result = calculateWealthAllocation(sampleStatement, sampleTargets);

    // Income = 150,000
    expect(result.salaryReceived).toBe(150000);

    // Wealth Creation = 75,000 (50%)
    expect(result.wealthCreation).toBe(75000);

    // Essential Living: Groceries(20k) + Utilities(7k) + Help(3k) + Fuel(5k) + Parents(5k) + Medical(2k) = 42,000
    expect(result.essentialLiving).toBe(42000);

    // Safety: Emergency(10k) + Prepayment(5k) = 15,000 (10%)
    expect(result.safety).toBe(15000);

    // Lifestyle: Restaurants(5k) + Shop(4k) + Clothes(2k) + Taxi(1k) + Unexpected(2k) + Other(1k) = 15,000 (10%)
    expect(result.lifestyle).toBe(15000);

    // Verify all 5 buckets exist
    expect(result.buckets.length).toBe(5);
  });

  it("calculates 100% allocation when all salary is distributed", () => {
    const fullStatement = {
      ...sampleStatement,
      cashAllocation: {
        ...sampleStatement.cashAllocation,
        cashRemaining: "3000",
      },
    };

    const result = calculateWealthAllocation(fullStatement, sampleTargets);
    expect(result.allocationPercentage).toBeCloseTo(100, 1);
    expect(result.isComplete).toBe(true);
  });

  it("validates allocation results against target thresholds", () => {
    const allocation = calculateWealthAllocation(sampleStatement, sampleTargets);
    const validation = validateAllocation(allocation, sampleTargets);

    expect(validation).toBeDefined();
    expect(validation).toHaveProperty("isValid");
  });
});
