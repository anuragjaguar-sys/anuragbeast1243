// =========================================
// ATHENA Goal Ledger
// =========================================

export interface GoalLedgerEntry {
  id: string;

  goalId: string;

  goalTitle: string;

  amount: number;

  month: number;

  year: number;

  date: string;

  notes?: string;
}

const STORAGE_KEY = "athena-goal-ledger";

// ----------------------------------------
// Load Ledger
// ----------------------------------------

export function loadGoalLedger(): GoalLedgerEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as GoalLedgerEntry[];
  } catch {
    return [];
  }
}

// ----------------------------------------
// Save Ledger
// ----------------------------------------

export function saveGoalLedger(
  ledger: GoalLedgerEntry[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(ledger)
  );
}

// ----------------------------------------
// Add / Update Monthly Contribution
// ----------------------------------------

export function saveGoalContribution(
  entry: GoalLedgerEntry
): void {
  const ledger = loadGoalLedger();

  // A goal should have only ONE contribution
  // for a particular month/year.
  const existingIndex = ledger.findIndex(
    (item) =>
      item.goalId === entry.goalId &&
      item.month === entry.month &&
      item.year === entry.year
  );

  if (existingIndex >= 0) {
    ledger[existingIndex] = entry;
  } else {
    ledger.push(entry);
  }

  saveGoalLedger(ledger);
}

// ----------------------------------------
// Get Contributions For A Goal
// ----------------------------------------

export function getGoalContributions(
  goalId: string
): GoalLedgerEntry[] {
  return loadGoalLedger().filter(
    (entry) => entry.goalId === goalId
  );
}

// ----------------------------------------
// Get Total Contributions For A Goal
// ----------------------------------------

export function getTotalGoalContributions(
  goalId: string
): number {
  return getGoalContributions(goalId).reduce(
    (total, entry) =>
      total + Number(entry.amount || 0),
    0
  );
}

// ----------------------------------------
// Get Goal Contribution For A Month
// ----------------------------------------

export function getMonthlyGoalContribution(
  goalId: string,
  month: number,
  year: number
): number {
  const entry = loadGoalLedger().find(
    (item) =>
      item.goalId === goalId &&
      item.month === month &&
      item.year === year
  );

  return entry
    ? Number(entry.amount || 0)
    : 0;
}

// ----------------------------------------
// Delete A Goal's Ledger
// ----------------------------------------

export function deleteGoalLedger(
  goalId: string
): void {
  const ledger = loadGoalLedger();

  const updatedLedger = ledger.filter(
    (entry) => entry.goalId !== goalId
  );

  saveGoalLedger(updatedLedger);
}

// ----------------------------------------
// Clear Entire Ledger
// ----------------------------------------

export function clearGoalLedger(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}