/**
 * =====================================================
 * FIRE54 Retirement Intelligence Engine
 * =====================================================
 * Financial Calculation Utilities
 */

import { RetirementAssumptions } from "./types";

/**
 * Inflate today's monthly income
 * to retirement year.
 */
export function calculateFutureMonthlyIncome(
  monthlyIncomeToday: number,
  inflationRate: number,
  years: number
): number {
  return monthlyIncomeToday * Math.pow(1 + inflationRate, years);
}

/**
 * Annual retirement income.
 */
export function calculateAnnualRetirementIncome(
  monthlyIncome: number
): number {
  return monthlyIncome * 12;
}

/**
 * Corpus required using
 * Safe Withdrawal Rate.
 */
export function calculateRequiredCorpus(
  annualIncome: number,
  withdrawalRate: number
): number {
  return annualIncome / withdrawalRate;
}

/**
 * Years left until retirement.
 */
export function calculateYearsRemaining(
  assumptions: RetirementAssumptions
): number {
  return assumptions.retirementAge - assumptions.currentAge;
}

/**
 * FIRE Score
 */
export function calculateFireScore(
  projectedCorpus: number,
  requiredCorpus: number
): number {

  if (requiredCorpus <= 0) {
    return 100;
  }

  return Math.min(
    100,
    Math.round(
      (projectedCorpus / requiredCorpus) * 100
    )
  );

}

/**
 * Retirement Status
 */
export function calculateRetirementStatus(
  fireScore: number
): "Ahead" | "On Track" | "Behind" {

  if (fireScore >= 100) {
    return "Ahead";
  }

  if (fireScore >= 80) {
    return "On Track";
  }

  return "Behind";

}