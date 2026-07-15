// =========================================
// Monthly Financial Statement Types
// =========================================

export type InvestmentCategory = "Mutual Fund" | "PPF" | "NPS" | "Gold" | "FD" | "Stocks";

export type Investment = {
  id: string;
  name: string;
  category: InvestmentCategory;
  monthlyContribution: string;
  currentValue: string;
  investedAmount: string;
};

export type ExpenseCategory = "Household" | "Lifestyle" | "Travel" | "Family" | "Medical" | "Misc";

export type ExpenseCategories = {
  household: {
    groceries: string;
    electricity: string;
    gas: string;
    internet: string;
    maintenance: string;
    houseHelp: string;
    fuel: string;
  };
  lifestyle: {
    restaurants: string;
    shopping: string;
    clothes: string;
    entertainment: string;
    gym: string;
    subscriptions: string;
  };
  travel: {
    flights: string;
    hotels: string;
    taxi: string;
    holiday: string;
  };
  family: {
    parents: string;
    medical: string;
    children: string;
    gifts: string;
  };
  misc: {
    unexpected: string;
    repairs: string;
    other: string;
  };
};

export type Decision = {
  id: string;
  decision: string;
  reason: string;
  expectedOutcome: string;
};

export type MonthlyFinancialStatement = {
  version: 2; // Data version for migration

  // Section 1: Month Information
  month: number;
  year: number;
  financialNotes: string;
  importantDecisions: string;

  // Section 2: Income
  income: {
    salaryInHand: string;
    daAllowances: string;
    bonus: string;
    arrears: string;
    interestIncome: string;
    dividend: string;
    rentalIncome: string;
    otherIncome: string;
  };

  // Section 3: Cash Allocation
  cashAllocation: {
    investments: string;
    emergencyFund: string;
    savingsAccount: string;
    homeLoanPrepayment: string;
    monthlyExpenses: string;
    cashRemaining: string;
  };

  // Section 4: Investments
  investments: Investment[];

  // Section 5: Expenses
  expenses: ExpenseCategories;

  // Section 6: Assets
  assets: {
    savingsAccount: string;
    emergencyFund: string;
    mutualFunds: string;
    ppf: string;
    nps: string;
    fd: string;
    gold: string;
    property: string;
    cash: string;
  };

  // Section 7: Liabilities
  liabilities: {
    homeLoanOutstanding: string;
    vehicleLoan: string;
    personalLoan: string;
    otherLoan: string;
  };

  // Section 10: Decision Journal
  decisionJournal: Decision[];
};

export const INITIAL_MONTHLY_FINANCIAL_STATEMENT: MonthlyFinancialStatement = {
  version: 2,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  financialNotes: "",
  importantDecisions: "",
  income: {
    salaryInHand: "",
    daAllowances: "",
    bonus: "",
    arrears: "",
    interestIncome: "",
    dividend: "",
    rentalIncome: "",
    otherIncome: "",
  },
  cashAllocation: {
    investments: "",
    emergencyFund: "",
    savingsAccount: "",
    homeLoanPrepayment: "",
    monthlyExpenses: "",
    cashRemaining: "",
  },
  investments: [],
  expenses: {
    household: {
      groceries: "",
      electricity: "",
      gas: "",
      internet: "",
      maintenance: "",
      houseHelp: "",
      fuel: "",
    },
    lifestyle: {
      restaurants: "",
      shopping: "",
      clothes: "",
      entertainment: "",
      gym: "",
      subscriptions: "",
    },
    travel: {
      flights: "",
      hotels: "",
      taxi: "",
      holiday: "",
    },
    family: {
      parents: "",
      medical: "",
      children: "",
      gifts: "",
    },
    misc: {
      unexpected: "",
      repairs: "",
      other: "",
    },
  },
  assets: {
    savingsAccount: "",
    emergencyFund: "",
    mutualFunds: "",
    ppf: "",
    nps: "",
    fd: "",
    gold: "",
    property: "",
    cash: "",
  },
  liabilities: {
    homeLoanOutstanding: "",
    vehicleLoan: "",
    personalLoan: "",
    otherLoan: "",
  },
  decisionJournal: [],
};

/** Stable key for storage, e.g. "2026-07" */
export function getMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Display label, e.g. "July 2026" */
export function getMonthLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
