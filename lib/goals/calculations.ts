// =========================================
// ATHENA Goal Calculations
// =========================================

import type { CalculatedGoal } from "./types";
import { GOAL_ASSUMPTIONS } from "./assumptions";

// ----------------------------------------------------
// Generic Progress Calculator
// ----------------------------------------------------

export function calculateProgress(
  current: number,
  target: number
): number {
  if (target <= 0) return 0;

  return Math.min(
    100,
    Math.round((current / target) * 100)
  );
}

// ----------------------------------------------------
// Emergency Fund
// ----------------------------------------------------

export function calculateEmergencyFundGoal(
  emergencyFund: number,
  monthlyExpenses: number,
  targetMonths: number = GOAL_ASSUMPTIONS.emergencyFund.targetMonths
): CalculatedGoal {
  const safeExpenses = Math.max(
    Number(monthlyExpenses) || 0,
    0
  );

  const safeTargetMonths = Math.max(
    Number(targetMonths) || 0,
    0
  );

  const target = safeExpenses * safeTargetMonths;

  return {
    id: "emergency",
    type: "Emergency Fund",
    title: "Emergency Fund",
    description: `Maintain ${safeTargetMonths} months of expenses.`,
    targetValue: target,
    currentValue: Math.max(
      Number(emergencyFund) || 0,
      0
    ),
    progress: calculateProgress(
      Math.max(Number(emergencyFund) || 0, 0),
      target
    ),
    status:
      target > 0 &&
      emergencyFund >= target
        ? "Completed"
        : target > 0 &&
          emergencyFund >= target * 0.75
        ? "On Track"
        : "Needs Attention",
  };
}

// ----------------------------------------------------
// Home Loan
// ----------------------------------------------------

export function calculateHomeLoanGoal(
  outstanding: number,
  targetOutstanding: number =
    GOAL_ASSUMPTIONS.homeLoan.targetOutstanding
): CalculatedGoal {
  const safeOutstanding = Math.max(
    Number(outstanding) || 0,
    0
  );

  const safeTargetOutstanding = Math.max(
    Number(targetOutstanding) || 0,
    0
  );

  const paidOff =
    safeOutstanding <= safeTargetOutstanding;

  return {
    id: "loan",
    type: "Home Loan",
    title: "Home Loan Freedom",
    description: "Pay off your home loan.",
    targetValue: safeTargetOutstanding,
    currentValue: safeOutstanding,
    progress: paidOff ? 100 : 0,
    status: paidOff ? "Completed" : "On Track",
  };
}

// ----------------------------------------------------
// Investment Goal
// ----------------------------------------------------

export function calculateInvestmentGoal(
  monthlyInvestment: number,
  targetInvestment: number =
    GOAL_ASSUMPTIONS.investment.targetMonthlyInvestment
): CalculatedGoal {
  const safeMonthlyInvestment = Math.max(
    Number(monthlyInvestment) || 0,
    0
  );

  const safeTargetInvestment = Math.max(
    Number(targetInvestment) || 0,
    0
  );

  return {
    id: "investment",
    type: "Investment",
    title: "Monthly Investment",
    description:
      "Achieve target monthly investing.",
    targetValue: safeTargetInvestment,
    currentValue: safeMonthlyInvestment,
    progress: calculateProgress(
      safeMonthlyInvestment,
      safeTargetInvestment
    ),
    status:
      safeMonthlyInvestment >=
      safeTargetInvestment
        ? "Completed"
        : safeTargetInvestment > 0 &&
          safeMonthlyInvestment >=
            safeTargetInvestment * 0.8
        ? "On Track"
        : "Needs Attention",
  };
}

// ----------------------------------------------------
// Net Worth
// ----------------------------------------------------

export function calculateNetWorthGoal(
  currentNetWorth: number,
  targetNetWorth: number =
    GOAL_ASSUMPTIONS.netWorth.targetNetWorth
): CalculatedGoal {
  const safeCurrentNetWorth = Number(
    currentNetWorth
  ) || 0;

  const safeTargetNetWorth = Math.max(
    Number(targetNetWorth) || 0,
    0
  );

  return {
    id: "networth",
    type: "Net Worth",
    title: "Net Worth",
    description: "Grow overall net worth.",
    targetValue: safeTargetNetWorth,
    currentValue: safeCurrentNetWorth,
    progress: calculateProgress(
      safeCurrentNetWorth,
      safeTargetNetWorth
    ),
    status:
      safeCurrentNetWorth >= safeTargetNetWorth
        ? "Completed"
        : safeTargetNetWorth > 0 &&
          safeCurrentNetWorth >=
            safeTargetNetWorth * 0.75
        ? "On Track"
        : "Needs Attention",
  };
}

// ----------------------------------------------------
// Retirement Goal
// ----------------------------------------------------

export function calculateRetirementGoal(
  currentCorpus: number,
  targetCorpus: number
): CalculatedGoal {
  const safeCurrentCorpus = Math.max(
    Number(currentCorpus) || 0,
    0
  );

  const safeTargetCorpus = Math.max(
    Number(targetCorpus) || 0,
    0
  );

  return {
    id: "retirement",
    type: "Retirement",
    title: "FIRE @ 54",
    description:
      "Retirement corpus target.",
    targetValue: safeTargetCorpus,
    currentValue: safeCurrentCorpus,
    progress: calculateProgress(
      safeCurrentCorpus,
      safeTargetCorpus
    ),
    status:
      safeCurrentCorpus >= safeTargetCorpus
        ? "Completed"
        : safeTargetCorpus > 0 &&
          safeCurrentCorpus >=
            safeTargetCorpus * 0.7
        ? "On Track"
        : "Needs Attention",
  };
}