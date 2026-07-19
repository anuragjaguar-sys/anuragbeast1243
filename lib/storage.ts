import {
  getMonthKey,
  getMonthLabel,
  type MonthlyFinancialStatement,
  INITIAL_MONTHLY_FINANCIAL_STATEMENT,
} from "./monthly-review";

// Temporary type for migration only
type LegacyMonthlyReviewFormData = {
  netSalary: string;
  otherIncome: string;
  livingExpenses: string;
  travel: string;
  medical: string;
  otherExpenses: string;
  ppf: string;
  mutualFundSip: string;
  additionalMutualFund: string;
  nps: string;
  mutualFundValue: string;
  ppfValue: string;
  npsValue: string;
  emergencyFund: string;
  bankBalance: string;
  homeLoanOutstanding: string;
  emiPaid: string;
  extraHomeLoanPayment: string;
  tradedFno: boolean;
  tradingProfitLoss: string;
  biggestDecision: string;
  confidence: number;
  notes: string;
};

/**
 * Migrate legacy MonthlyReviewFormData to MonthlyFinancialStatement
 * This is a one-time migration function
 */
function migrateLegacyData(
  legacyData: LegacyMonthlyReviewFormData
): MonthlyFinancialStatement {
  const statement: MonthlyFinancialStatement = {
    version: 2,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    financialNotes: legacyData.notes || "",
    importantDecisions: legacyData.biggestDecision || "",
    income: {
      salaryInHand: legacyData.netSalary || "",
      daAllowances: "",
      bonus: "",
      arrears: "",
      interestIncome: "",
      dividend: "",
      rentalIncome: "",
      otherIncome: legacyData.otherIncome || "",
    },
    cashAllocation: {
      investments: legacyData.mutualFundSip || "",
      emergencyFund: legacyData.emergencyFund || "",
      savingsAccount: legacyData.bankBalance || "",
      homeLoanPrepayment: legacyData.extraHomeLoanPayment || "",
      monthlyExpenses: legacyData.livingExpenses || "",
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
        flights: legacyData.travel || "",
        hotels: "",
        taxi: "",
        holiday: "",
      },
      family: {
        parents: "",
        medical: legacyData.medical || "",
        children: "",
        gifts: "",
      },
      misc: {
        unexpected: "",
        repairs: "",
        other: legacyData.otherExpenses || "",
      },
    },
    assets: {
      savingsAccount: legacyData.bankBalance || "",
      emergencyFund: legacyData.emergencyFund || "",
      mutualFunds: legacyData.mutualFundValue || "",
      ppf: legacyData.ppfValue || "",
      nps: legacyData.npsValue || "",
      fd: "",
      gold: "",
      property: "",
      cash: "",
    },
    liabilities: {
      homeLoanOutstanding: legacyData.homeLoanOutstanding || "",
      vehicleLoan: "",
      personalLoan: "",
      otherLoan: "",
    },
    decisionJournal: [],
  };

  return statement;
}

/**
 * Run one-time migration of legacy data to new format
 */
export function migrateToNewFormat(): void {
  if (!isBrowser()) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    // Parse as unknown first since it might be legacy format
    const store: unknown = JSON.parse(raw);
    let needsMigration = false;

    // Check if it's legacy format (has netSalary in data)
    if (store && typeof store === 'object') {
      for (const entry of Object.values(store as Record<string, any>)) {
        if (entry && entry.data && typeof entry.data === 'object' && 'netSalary' in entry.data) {
          needsMigration = true;
          break;
        }
      }
    }

    if (!needsMigration) return;

    // Migrate all legacy entries
    const newStore: MonthlyReviewsStore = {};
    for (const [key, entry] of Object.entries(store as Record<string, any>)) {
      if (entry && entry.data && typeof entry.data === 'object' && 'netSalary' in entry.data) {
        const legacyEntry = entry as { monthKey: string; monthLabel: string; savedAt: string; data: LegacyMonthlyReviewFormData };
        const newStatement = migrateLegacyData(legacyEntry.data);

        const newEntry: StoredFinancialStatement = {
          monthKey: legacyEntry.monthKey,
          monthLabel: legacyEntry.monthLabel,
          savedAt: legacyEntry.savedAt,
          data: newStatement,
        };

        newStore[key] = newEntry;
      } else {
        // Already in new format, keep as is
        newStore[key] = entry as StoredFinancialStatement;
      }
    }

    // Save migrated data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
    console.log("Data migration completed successfully");
  } catch (error) {
    console.error("Data migration failed:", error);
  }
}

const STORAGE_KEY = "fire54_monthly_reviews";

export type StoredFinancialStatement = {
  monthKey: string;
  monthLabel: string;
  savedAt: string;
  data: MonthlyFinancialStatement;
};

type MonthlyReviewsStore = Record<string, StoredFinancialStatement>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStore(): MonthlyReviewsStore {
  if (!isBrowser()) return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as MonthlyReviewsStore;
  } catch {
    return {};
  }
}

function writeStore(store: MonthlyReviewsStore): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Load a monthly review by key. Defaults to the current month. */
export function loadMonthlyReview(
  monthKey: string = getMonthKey()
): MonthlyFinancialStatement | null {
  const store = readStore();
  const entry = store[monthKey];
  if (!entry) return null;
  return entry.data as MonthlyFinancialStatement;
}

/**
 * Save (or update) a monthly financial statement for the given month.
 * Upserts by monthKey — no duplicate entries for the same month.
 */
export function saveFinancialStatement(
  data: MonthlyFinancialStatement,
  monthKey: string = getMonthKey(),
  monthLabel: string = getMonthLabel()
): StoredFinancialStatement {
  const store = readStore();

  const record: StoredFinancialStatement = {
    monthKey,
    monthLabel,
    savedAt: new Date().toISOString(),
    data,
  };

  store[monthKey] = record;
  writeStore(store);

  return record;
}

/** Return all stored reviews, newest month first. */
export function getAllMonthlyReviews(): StoredFinancialStatement[] {
  return Object.values(readStore()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

/** Check whether a review exists for a given month. */
export function hasMonthlyReview(monthKey: string = getMonthKey()): boolean {
  return monthKey in readStore();
}

/** Remove a review for a given month. */
export function deleteMonthlyReview(monthKey: string): void {
  const store = readStore();
  delete store[monthKey];
  writeStore(store);
}

/** Clear all stored monthly reviews. */
export function clearAllMonthlyReviews(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

