import type { RetirementAssumptions } from "./types";

export function calculateFutureMonthlyIncome(
  monthlyIncomeToday: number,
  inflationRate: number,
  years: number
): number {
  return monthlyIncomeToday * Math.pow(1 + inflationRate, years);
}

export function calculateAnnualRetirementIncome(
  monthlyIncome: number
): number {
  return monthlyIncome * 12;
}

/**
 * Calculates Required Corpus using SWR, optionally factoring in Section 112A LTCG tax.
 */
export function calculateRequiredCorpus(
  annualIncome: number,
  withdrawalRate: number,
  includeLtcgTaxHaircut: boolean = false
): number {
  if (withdrawalRate <= 0) return 0;
  const baseCorpus = annualIncome / withdrawalRate;
  
  if (!includeLtcgTaxHaircut) return baseCorpus;

  const estimatedEmbeddedGains = Math.max(0, (annualIncome * 0.75) - 125000);
  const estimatedAnnualTax = estimatedEmbeddedGains * 0.125;
  const grossIncomeNeeded = annualIncome + estimatedAnnualTax;

  return grossIncomeNeeded / withdrawalRate;
}

export function calculateYearsRemaining(
  assumptions: RetirementAssumptions
): number {
  return assumptions.retirementAge - assumptions.currentAge;
}

export function calculateFireScore(
  projectedCorpus: number,
  requiredCorpus: number
): number {
  if (requiredCorpus <= 0) return 100;
  return Math.min(100, Math.round((projectedCorpus / requiredCorpus) * 100));
}

export function calculateRetirementStatus(
  fireScore: number
): "Ahead" | "On Track" | "Behind" {
  if (fireScore >= 100) return "Ahead";
  if (fireScore >= 80) return "On Track";
  return "Behind";
}

/**
 * Post-Retirement 12.5% Equity LTCG Tax Haircut Engine (Section 112A)
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
