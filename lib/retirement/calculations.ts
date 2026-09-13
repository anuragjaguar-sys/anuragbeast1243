/**
 * =====================================================
 * FIRE54 Retirement Intelligence Engine
 * =====================================================
 * Financial Calculation Utilities
 */

import type { RetirementAssumptions } from "./types";

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
/**
 * =====================================================
 * Post-Retirement 12.5% Equity LTCG Tax Haircut Engine
 * =====================================================
 * Computes the exact tax drag on SWP redemptions under
 * Section 112A (12.5% LTCG with ₹1.25L annual exemption).
 */

export interface SWPTaxResult {
  grossWithdrawal: number;
  gainRatio: number;
  embeddedGains: number;
  exemptGains: number;
  taxableGains: number;
  ltcgTaxOutflow: number;
  effectiveTaxRateOnDraw: number;
  netLivingReceived: number;
  remainingCostBasis: number;
}

export function calculateSWPLTCGTax(
  annualWithdrawal: number,
  corpusValue: number,
  costBasis: number,
  exemptionLimit: number = 125000,
  taxRate: number = 0.125
): SWPTaxResult {
  if (annualWithdrawal <= 0 || corpusValue <= 0) {
    return {
      grossWithdrawal: annualWithdrawal,
      gainRatio: 0,
      embeddedGains: 0,
      exemptGains: 0,
      taxableGains: 0,
      ltcgTaxOutflow: 0,
      effectiveTaxRateOnDraw: 0,
      netLivingReceived: annualWithdrawal,
      remainingCostBasis: costBasis,
    };
  }

  // Calculate proportion of current corpus that represents profit
  const gainRatio = Math.min(1, Math.max(0, 1 - (costBasis / corpusValue)));
  const embeddedGains = annualWithdrawal * gainRatio;
  const principalRedeemed = annualWithdrawal * (1 - gainRatio);

  const exemptGains = Math.min(embeddedGains, exemptionLimit);
  const taxableGains = Math.max(0, embeddedGains - exemptGains);
  const ltcgTaxOutflow = Math.round(taxableGains * taxRate);

  const effectiveTaxRateOnDraw = annualWithdrawal > 0 ? (ltcgTaxOutflow / annualWithdrawal) * 100 : 0;
  const remainingCostBasis = Math.max(0, costBasis - principalRedeemed);

  return {
    grossWithdrawal: annualWithdrawal,
    gainRatio,
    embeddedGains,
    exemptGains,
    taxableGains,
    ltcgTaxOutflow,
    effectiveTaxRateOnDraw,
    netLivingReceived: annualWithdrawal - ltcgTaxOutflow,
    remainingCostBasis,
  };
}
