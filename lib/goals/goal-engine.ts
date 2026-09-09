// =========================================
// ATHENA Goal Engine
// =========================================

import type {
  Goal,
  GoalSummary,
  CalculatedGoal,
} from "./types";

import {
  loadGoals,
} from "./goal-storage";

import {
  getTotalGoalContributions,
} from "./goal-ledger";

import {
  calculateEmergencyFundGoal,
  calculateHomeLoanGoal,
  calculateInvestmentGoal,
  calculateNetWorthGoal,
  calculateRetirementGoal,
} from "./calculations";

// -----------------------------------------------------
// Calculate A Single Persisted Goal
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
// Main Persisted Goal Engine
// -----------------------------------------------------

export function getGoals(): Goal[] {
  const storedGoals = loadGoals();

  return storedGoals.map(
    (goal) => calculateGoal(goal)
  );
}

// -----------------------------------------------------
// Get One Persisted Goal
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
          goal.status ===
          "Behind Schedule"
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

// -----------------------------------------------------
// System Financial Goals
// -----------------------------------------------------

export type SystemGoalInputs = {
  emergencyFund: number;
  monthlyExpenses: number;
  homeLoanOutstanding: number;
  monthlyInvestment: number;
  currentNetWorth: number;
  currentRetirementCorpus: number;

  /**
   * Retirement target is supplied by the
   * Retirement Engine so the Goal Engine
   * does not maintain a competing FIRE target.
   */
  retirementTargetCorpus: number;

  /**
   * Optional overrides for system goal targets.
   */
  emergencyFundTargetMonths?: number;
  homeLoanTargetOutstanding?: number;
  monthlyInvestmentTarget?: number;
  netWorthTarget?: number;
};

export type SystemGoals = {
  emergencyFund: CalculatedGoal;
  homeLoan: CalculatedGoal;
  investment: CalculatedGoal;
  netWorth: CalculatedGoal;
  retirement: CalculatedGoal;
};

// -----------------------------------------------------
// Calculate System Financial Goals
// -----------------------------------------------------

export function getSystemGoals(
  inputs: SystemGoalInputs
): SystemGoals {
  return {
    emergencyFund:
      calculateEmergencyFundGoal(
        inputs.emergencyFund,
        inputs.monthlyExpenses,
        inputs.emergencyFundTargetMonths
      ),

    homeLoan:
      calculateHomeLoanGoal(
        inputs.homeLoanOutstanding,
        inputs.homeLoanTargetOutstanding
      ),

    investment:
      calculateInvestmentGoal(
        inputs.monthlyInvestment,
        inputs.monthlyInvestmentTarget
      ),

    netWorth:
      calculateNetWorthGoal(
        inputs.currentNetWorth,
        inputs.netWorthTarget
      ),

    retirement:
      calculateRetirementGoal(
        inputs.currentRetirementCorpus,
        inputs.retirementTargetCorpus
      ),
  };
}