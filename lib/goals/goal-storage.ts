import { CloudSyncService } from "@/lib/core/sync-service";
// =========================================
// ATHENA Goal Storage (Unified via StorageManager)
// =========================================

import type { Goal } from "./types";
import { StorageManager } from "@/lib/core/storage-manager";

const PRIMARY_KEY = StorageManager.KEYS.GOALS;
const LEGACY_KEY = "athena-goals";

// ----------------------------------------
// Load Goals (with legacy fallback migration)
// ----------------------------------------

export function loadGoals(): Goal[] {
  // Check primary unified key first
  const goals = StorageManager.get<Goal[]>(PRIMARY_KEY, []);
  if (Array.isArray(goals) && goals.length > 0) {
    return goals;
  }

  // Fallback check for legacy storage key
  const legacyGoals = StorageManager.get<Goal[]>(LEGACY_KEY, []);
  if (Array.isArray(legacyGoals) && legacyGoals.length > 0) {
    // Automatically migrate legacy goals to unified key
    StorageManager.set(PRIMARY_KEY, legacyGoals);
    return legacyGoals;
  }

  return [];
}

// ----------------------------------------
// Save Goals
// ----------------------------------------

export function saveGoals(goals: Goal[]): void {
  StorageManager.set(PRIMARY_KEY, goals);
  void CloudSyncService.pushStore("goals", goals);
}

// ----------------------------------------
// Get Single Goal
// ----------------------------------------

export function getGoal(goalId: string): Goal | null {
  const goals = loadGoals();
  return goals.find((goal) => goal.id === goalId) ?? null;
}

// ----------------------------------------
// Update Single Goal
// ----------------------------------------

export function updateGoal(updatedGoal: Goal): void {
  const goals = loadGoals();
  const updatedGoals = goals.map((goal) =>
    goal.id === updatedGoal.id ? updatedGoal : goal
  );
  saveGoals(updatedGoals);
}

// ----------------------------------------
// Delete Single Goal
// ----------------------------------------

export function deleteGoal(goalId: string): void {
  const goals = loadGoals();
  saveGoals(goals.filter((goal) => goal.id !== goalId));
}

// ----------------------------------------
// Clear Goals
// ----------------------------------------

export function clearGoals(): void {
  StorageManager.remove(PRIMARY_KEY);
  StorageManager.remove(LEGACY_KEY);
}