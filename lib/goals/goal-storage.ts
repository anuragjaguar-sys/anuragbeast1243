// =========================================
// ATHENA Goal Storage
// =========================================

import type { Goal } from "./types";

const STORAGE_KEY = "athena-goals";

// ----------------------------------------
// Load Goals
// ----------------------------------------

export function loadGoals(): Goal[] {
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

    return parsed as Goal[];
  } catch {
    return [];
  }
}

// ----------------------------------------
// Save Goals
// ----------------------------------------

export function saveGoals(goals: Goal[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(goals)
  );
}

// ----------------------------------------
// Get Single Goal
// ----------------------------------------

export function getGoal(
  goalId: string
): Goal | null {
  const goals = loadGoals();

  return (
    goals.find(
      (goal) => goal.id === goalId
    ) ?? null
  );
}

// ----------------------------------------
// Update Single Goal
// ----------------------------------------

export function updateGoal(
  updatedGoal: Goal
): void {
  const goals = loadGoals();

  const updatedGoals = goals.map(
    (goal) =>
      goal.id === updatedGoal.id
        ? updatedGoal
        : goal
  );

  saveGoals(updatedGoals);
}

// ----------------------------------------
// Delete Single Goal
// ----------------------------------------

export function deleteGoal(
  goalId: string
): void {
  const goals = loadGoals();

  saveGoals(
    goals.filter(
      (goal) => goal.id !== goalId
    )
  );
}

// ----------------------------------------
// Clear Goals
// ----------------------------------------

export function clearGoals(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}