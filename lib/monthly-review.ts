// =========================================
// Monthly Financial Statement Types
// =========================================

export type InvestmentCategory =
  | "Mutual Fund"
  | "PPF"
  | "NPS"
  | "Gold"
  | "FD"
  | "Stocks";

export type Investment = {
  id: string;
  name: string;
  category: InvestmentCategory;
  monthlyContribution: string;
  currentValue: string;
  investedAmount: string;
};

export type ExpenseCategory =
  | "Household"
  | "Lifestyle"
  | "Travel"
  | "Family"
  | "Medical"
  | "Misc";

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

// =========================================
// SIP STEP-UP
// =========================================

export type SipStepUpStatus =
  | "Baseline"
  | "Applied"
  | "Not Applied"
  | "Not Applicable"
  | "Below Expected"
  | "Above Expected";

export type SipStepUp = {
  /**
   * Planned SIP increase for this financial year.
   *
   * Example:
   * "10" means a planned 10% annual SIP increase.
   */
  plannedPercent: string;

  /**
   * Whether the planned annual SIP increase
   * was actually implemented this month.
   */
  appliedThisMonth: "Yes" | "No" | "Not Applicable";
};

export type SipAnnualReview = {
  status:
    | "Baseline"
    | "Increased"
    | "Unchanged"
    | "Decreased";

  comparedWithYear: number | null;

  previousMonthlySip: number | null;

  currentMonthlySip: number;

  increasePercent: number | null;

  // New step-up intelligence
  plannedStepUpPercent: number | null;

  expectedMonthlySip: number | null;

  actualMonthlySip: number;

  stepUpApplied:
    | "Yes"
    | "No"
    | "Not Applicable";

  stepUpStatus: SipStepUpStatus;

  varianceFromExpected: number | null;
};

function parseAmount(value: string | number | null | undefined): number {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount)
    ? Math.max(0, amount)
    : 0;
}

function parsePercent(
  value: string | number | null | undefined
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const percent = Number(value);

  if (!Number.isFinite(percent)) {
    return null;
  }

  return Math.max(0, percent);
}

/**
 * Compares the current month's Mutual Fund SIP
 * with the same calendar month in the previous year.
 *
 * Also evaluates the user's planned annual SIP
 * step-up and whether it was actually applied.
 */
export function calculateSipAnnualReview(
  statement: Pick<
    MonthlyFinancialStatement,
    "year" | "cashAllocation" | "sipStepUp"
  >,
  previousYearStatement:
    | Pick<
        MonthlyFinancialStatement,
        "cashAllocation"
      >
    | null
): SipAnnualReview {
  const currentMonthlySip = parseAmount(
    statement.cashAllocation.investments
  );

  const previousMonthlySip =
    previousYearStatement
      ? parseAmount(
          previousYearStatement.cashAllocation
            .investments
        )
      : null;

  const plannedStepUpPercent =
    parsePercent(
      statement.sipStepUp?.plannedPercent
    );

  const stepUpApplied =
    statement.sipStepUp?.appliedThisMonth ??
    "Not Applicable";

  // -----------------------------------------
  // Baseline
  // -----------------------------------------

  if (
    previousMonthlySip === null ||
    previousMonthlySip <= 0
  ) {
    return {
      status: "Baseline",
      comparedWithYear: null,
      previousMonthlySip,
      currentMonthlySip,
      increasePercent: null,

      plannedStepUpPercent,
      expectedMonthlySip: null,
      actualMonthlySip: currentMonthlySip,

      stepUpApplied,

      stepUpStatus:
        stepUpApplied === "Yes"
          ? "Applied"
          : stepUpApplied === "No"
          ? "Not Applied"
          : "Not Applicable",

      varianceFromExpected: null,
    };
  }

  // -----------------------------------------
  // Actual annual change
  // -----------------------------------------

  const increasePercent =
    ((currentMonthlySip - previousMonthlySip) /
      previousMonthlySip) *
    100;

  // -----------------------------------------
  // Expected SIP after planned step-up
  // -----------------------------------------

  const expectedMonthlySip =
    plannedStepUpPercent === null
      ? null
      : previousMonthlySip *
        (1 + plannedStepUpPercent / 100);

  // -----------------------------------------
  // Variance from expected SIP
  // -----------------------------------------

  const varianceFromExpected =
    expectedMonthlySip === null
      ? null
      : currentMonthlySip -
        expectedMonthlySip;

  // -----------------------------------------
  // Step-up status
  // -----------------------------------------

  let stepUpStatus: SipStepUpStatus;

  if (stepUpApplied === "Not Applicable") {
    stepUpStatus = "Not Applicable";
  } else if (stepUpApplied === "No") {
    stepUpStatus = "Not Applied";
  } else if (expectedMonthlySip === null) {
    stepUpStatus = "Applied";
  } else if (
    currentMonthlySip >= expectedMonthlySip
  ) {
    stepUpStatus =
      currentMonthlySip > expectedMonthlySip
        ? "Above Expected"
        : "Applied";
  } else {
    stepUpStatus = "Below Expected";
  }

  return {
    status:
      increasePercent > 0
        ? "Increased"
        : increasePercent < 0
        ? "Decreased"
        : "Unchanged",

    comparedWithYear:
      statement.year - 1,

    previousMonthlySip,

    currentMonthlySip,

    increasePercent:
      Math.round(increasePercent * 100) / 100,

    plannedStepUpPercent,

    expectedMonthlySip:
      expectedMonthlySip === null
        ? null
        : Math.round(expectedMonthlySip),

    actualMonthlySip:
      currentMonthlySip,

    stepUpApplied,

    stepUpStatus,

    varianceFromExpected:
      varianceFromExpected === null
        ? null
        : Math.round(
            varianceFromExpected
          ),
  };
}

// =========================================
// Goal Contributions
// =========================================

export interface GoalContribution {
  id: string;
  goalId: string;
  goalTitle: string;
  amount: string;
}

// =========================================
// Monthly Financial Statement
// =========================================

export type MonthlyFinancialStatement = {
  version: 2;

  // Section 1: Month Information
  month: number;
  year: number;

  financialNotes: string;

  importantDecisions: string;

  // =========================================
  // SIP Step-Up
  // =========================================

  sipStepUp: SipStepUp;

  /**
   * Calculated review.
   *
   * Optional for backward compatibility with
   * older saved statements.
   */
  sipAnnualReview?: SipAnnualReview;

  // =========================================
  // Section 2: Income
  // =========================================

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

  // =========================================
  // Section 3: Cash Allocation
  // =========================================

  cashAllocation: {
    investments: string;
    emergencyFund: string;
    savingsAccount: string;
    homeLoanPrepayment: string;
    monthlyExpenses: string;
    cashRemaining: string;
  };

  // =========================================
  // Section 4: Investments
  // =========================================

  investments: Investment[];

  // =========================================
  // Section 4B: Goal Contributions
  // =========================================

  goalContributions: GoalContribution[];

  // =========================================
  // Section 5: Expenses
  // =========================================

  expenses: ExpenseCategories;

  // =========================================
  // Section 6: Assets
  // =========================================

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

  // =========================================
  // Section 7: Liabilities
  // =========================================

  liabilities: {
    homeLoanOutstanding: string;
    vehicleLoan: string;
    personalLoan: string;
    otherLoan: string;
  };

  // =========================================
  // Section 10: Decision Journal
  // =========================================

  decisionJournal: Decision[];
};

// =========================================
// Initial Statement
// =========================================

export const INITIAL_MONTHLY_FINANCIAL_STATEMENT: MonthlyFinancialStatement =
  {
    version: 2,

    month: new Date().getMonth() + 1,

    year: new Date().getFullYear(),

    financialNotes: "",

    importantDecisions: "",

    sipStepUp: {
      plannedPercent: "",
      appliedThisMonth: "Not Applicable",
    },

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

    goalContributions: [],

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

// =========================================
// Date Helpers
// =========================================

/** Stable key for storage, e.g. "2026-07" */
export function getMonthKey(
  date: Date = new Date()
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

/** Display label, e.g. "July 2026" */
export function getMonthLabel(
  date: Date = new Date()
): string {
  return date.toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );
}