// =========================================
// ATHENA Goal Ledger (Unified via StorageManager)
// =========================================

import { StorageManager } from "@/lib/core/storage-manager";
import { CloudSyncService } from "@/lib/core/sync-service";

export interface GoalLedgerEntry {
  id?: string;
  goalId: string;
  goalTitle?: string;
  amount?: number;
  allocatedAmount?: number;
  month: number;
  year: number;
  date?: string;
  notes?: string;
}

const PRIMARY_KEY = StorageManager.KEYS.GOAL_LEDGER;
const LEGACY_KEY = "athena-goal-ledger";

export function loadGoalLedger(): GoalLedgerEntry[] {
  const ledger = StorageManager.get<GoalLedgerEntry[]>(PRIMARY_KEY, []);
  if (Array.isArray(ledger) && ledger.length > 0) {
    return ledger;
  }

  const legacyLedger = StorageManager.get<GoalLedgerEntry[]>(LEGACY_KEY, []);
  if (Array.isArray(legacyLedger) && legacyLedger.length > 0) {
    StorageManager.set(PRIMARY_KEY, legacyLedger);
    return legacyLedger;
  }

  return [];
}

export function saveGoalLedger(ledger: GoalLedgerEntry[]): void {
  StorageManager.set(PRIMARY_KEY, ledger);
  void CloudSyncService.pushStore("goalLedger", ledger);
}

export function saveGoalContribution(entry: GoalLedgerEntry): void {
  const ledger = loadGoalLedger();

  const existingIndex = ledger.findIndex(
    (item) =>
      item.goalId === entry.goalId &&
      item.month === entry.month &&
      item.year === entry.year
  );

  if (existingIndex >= 0) {
    ledger[existingIndex] = {
      ...ledger[existingIndex],
      ...entry,
    };
  } else {
    ledger.push(entry);
  }

  saveGoalLedger(ledger);
}

export function getContributionsForMonth(
  month: number,
  year: number
): GoalLedgerEntry[] {
  const ledger = loadGoalLedger();
  return ledger.filter((item) => item.month === month && item.year === year);
}

export function getTotalGoalContributions(goalId: string): number {
  const ledger = loadGoalLedger();
  return ledger
    .filter((entry) => entry.goalId === goalId)
    .reduce((sum, entry) => {
      const val = entry.amount ?? entry.allocatedAmount ?? 0;
      return sum + (Number(val) || 0);
    }, 0);
}
