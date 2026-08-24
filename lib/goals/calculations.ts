// =========================================
// ATHENA Goal Calculations
// =========================================

import type { CalculatedGoal } from "./types";

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
  monthlyExpenses: number
): CalculatedGoal {

  const target =
    monthlyExpenses * 12;

  return {

    id: "emergency",

    type: "Emergency Fund",

    title: "Emergency Fund",

    description:
      "Maintain one year of expenses.",

    targetValue: target,

    currentValue: emergencyFund,

    progress: calculateProgress(
      emergencyFund,
      target
    ),

    status:
      emergencyFund >= target
        ? "Completed"
        : emergencyFund >= target * 0.75
        ? "On Track"
        : "Needs Attention",

  };

}

// ----------------------------------------------------
// Home Loan
// ----------------------------------------------------

export function calculateHomeLoanGoal(
  outstanding: number
): CalculatedGoal {

  return {

    id: "loan",

    type: "Home Loan",

    title: "Home Loan Freedom",

    description:
      "Pay off your home loan.",

    targetValue: 0,

    currentValue: outstanding,

    progress:
      outstanding <= 0 ? 100 : 0,

    status:
      outstanding <= 0
        ? "Completed"
        : "On Track",

  };

}

// ----------------------------------------------------
// Investment Goal
// ----------------------------------------------------

export function calculateInvestmentGoal(
  monthlyInvestment: number,
  targetInvestment: number
): CalculatedGoal {

  return {

    id: "investment",

    type: "Investment",

    title: "Monthly Investment",

    description:
      "Achieve target monthly investing.",

    targetValue: targetInvestment,

    currentValue: monthlyInvestment,

    progress: calculateProgress(
      monthlyInvestment,
      targetInvestment
    ),

    status:
      monthlyInvestment >= targetInvestment
        ? "Completed"
        : monthlyInvestment >=
          targetInvestment * 0.8
        ? "On Track"
        : "Needs Attention",

  };

}

// ----------------------------------------------------
// Net Worth
// ----------------------------------------------------

export function calculateNetWorthGoal(
  currentNetWorth: number,
  targetNetWorth: number
): CalculatedGoal {

  return {

    id: "networth",

    type: "Net Worth",

    title: "Net Worth",

    description:
      "Grow overall net worth.",

    targetValue: targetNetWorth,

    currentValue: currentNetWorth,

    progress: calculateProgress(
      currentNetWorth,
      targetNetWorth
    ),

    status:
      currentNetWorth >= targetNetWorth
        ? "Completed"
        : currentNetWorth >=
          targetNetWorth * 0.75
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

  return {

    id: "retirement",

    type: "Retirement",

    title: "FIRE @ 54",

    description:
      "Retirement corpus target.",

    targetValue: targetCorpus,

    currentValue: currentCorpus,

    progress: calculateProgress(
      currentCorpus,
      targetCorpus
    ),

    status:
      currentCorpus >= targetCorpus
        ? "Completed"
        : currentCorpus >=
          targetCorpus * 0.7
        ? "On Track"
        : "Needs Attention",

  };

}