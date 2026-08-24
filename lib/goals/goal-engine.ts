// =========================================
// ATHENA Goal Engine
// =========================================

import type {
  Goal,
  GoalSummary,
} from "./types";

import {
  loadGoals,
} from "./goal-storage";

import {
  getTotalGoalContributions,
} from "./goal-ledger";

// -----------------------------------------------------
// Calculate A Single Goal
// -----------------------------------------------------

function calculateGoal(goal: Goal): Goal {
  // currentAmount stored on the goal represents
  // the amount already saved before monthly tracking.
  const startingAmount = Number(
    goal.currentAmount || 0
  );

  // Monthly contributions come from the Goal Ledger.
  const monthlyContributions =
    getTotalGoalContributions(goal.id);

  const currentAmount =
    startingAmount + monthlyContributions;

  const targetAmount =
    Number(goal.targetAmount || 0);

  const progress =
    targetAmount > 0
      ? Math.min(
          100,
          Math.round(
            (currentAmount / targetAmount) * 100
          )
        )
      : 0;

  // Automatically mark completed goals.
  const status =
    progress >= 100
      ? "Completed"
      : goal.status === "Completed"
      ? "On Track"
      : goal.status;

  return {
    ...goal,

    currentAmount,

    progress,

    status,
  };
}

// -----------------------------------------------------
// Main Goal Engine
// -----------------------------------------------------

export function getGoals(): Goal[] {
  const storedGoals = loadGoals();

  return storedGoals.map(
    (goal) => calculateGoal(goal)
  );
}

// -----------------------------------------------------
// Get One Goal
// -----------------------------------------------------

export function getGoalById(
  goalId: string
): Goal | null {
  const goals = getGoals();

  return (
    goals.find(
      (goal) => goal.id === goalId
    ) ?? null
  );
}

// -----------------------------------------------------
// Goal Summary
// -----------------------------------------------------

export function getGoalSummary(): GoalSummary {
  const goals = getGoals();

  return {
    totalGoals: goals.length,

    completedGoals:
      goals.filter(
        (goal) =>
          goal.status === "Completed"
      ).length,

    onTrackGoals:
      goals.filter(
        (goal) =>
          goal.status === "On Track"
      ).length,

    behindGoals:
      goals.filter(
        (goal) =>
          goal.status === "Behind Schedule"
      ).length,

    averageProgress:
      goals.length === 0
        ? 0
        : Math.round(
            goals.reduce(
              (sum, goal) =>
                sum + goal.progress,
              0
            ) / goals.length
          ),
  };
}

// -----------------------------------------------------
// Dashboard Insights
// -----------------------------------------------------

export function getGoalInsights(): string[] {
  const goals = getGoals();

  const insights: string[] = [];

  goals.forEach((goal) => {
    if (
      goal.status ===
      "Behind Schedule"
    ) {
      insights.push(
        `${goal.title} is behind schedule.`
      );
    }

    if (
      goal.status ===
      "Completed"
    ) {
      insights.push(
        `${goal.title} has been completed.`
      );
    }
  });

  if (insights.length === 0) {
    insights.push(
      "All active goals are progressing."
    );
  }

  return insights;
}