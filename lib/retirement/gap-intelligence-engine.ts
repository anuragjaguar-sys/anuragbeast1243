import { getPortfolio } from "@/lib/investments";
import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";
import { getRetirementProjection } from "./retirement-engine";
import type { RetirementAssumptions } from "./types";

export type RetirementGapStatus =
  | "ON_TRACK"
  | "NEEDS_ATTENTION"
  | "AT_RISK";

export interface RetirementGapAnalysis {
  status: RetirementGapStatus;
  currentCorpus: number;
  projectedCorpus: number;
  requiredCorpus: number;
  corpusGap: number;
  yearsLeft: number;
  currentMonthlyInvestment: number;
  requiredMonthlyInvestment: number;
  additionalMonthlyInvestmentNeeded: number;
  monthlyPension: number;
  desiredRetirementIncome: number;
  recommendation: string;
}

function clampFiniteNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Number(value);
}

function getPortfolioRetirementCorpus(portfolio = getPortfolio()): number {
  const retirementCategories = new Set(["Mutual Fund", "PPF", "EPF", "NPS"]);

  return portfolio
    .filter(
      (item) =>
        item.type === "Asset" && retirementCategories.has(item.category)
    )
    .reduce((sum, item) => sum + clampFiniteNumber(item.currentValue, 0), 0);
}

function calculateRequiredMonthlyInvestment(
  requiredCorpus: number,
  currentCorpus: number,
  yearsLeft: number,
  expectedAnnualReturn: number
): number {
  const targetCorpus = clampFiniteNumber(requiredCorpus, 0);
  const corpusNow = clampFiniteNumber(currentCorpus, 0);
  const yearsRemaining = Math.max(0, clampFiniteNumber(yearsLeft, 0));
  const annualReturn = Math.max(0, clampFiniteNumber(expectedAnnualReturn, 0));

  if (targetCorpus <= 0) {
    return 0;
  }

  if (yearsRemaining <= 0) {
    return Math.max(0, targetCorpus - corpusNow);
  }

  const monthlyRate = annualReturn / 12;
  const periods = yearsRemaining * 12;

  const futureValueOfCurrentCorpus =
    corpusNow * Math.pow(1 + monthlyRate, periods);

  const amountStillNeeded = Math.max(0, targetCorpus - futureValueOfCurrentCorpus);

  if (amountStillNeeded <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return amountStillNeeded / periods;
  }

  const annuityFactor =
    (Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate;

  if (annuityFactor <= 0) {
    return amountStillNeeded / Math.max(1, periods);
  }

  return amountStillNeeded / annuityFactor;
}

export function getRetirementGapAnalysis(
  overrides?: Partial<RetirementAssumptions>
): RetirementGapAnalysis {
  const assumptions = {
    ...getRetirementAssumptionsFromProfile(),
    ...overrides,
  };

  const portfolio = getPortfolio();
  const projection = getRetirementProjection(overrides);

  const currentCorpus =
    clampFiniteNumber(projection.currentCorpus, 0) ||
    getPortfolioRetirementCorpus(portfolio);
  const projectedCorpus = clampFiniteNumber(projection.projectedCorpus, 0);
  const requiredCorpus = clampFiniteNumber(projection.requiredCorpus, 0);
  const corpusGap =
    projectedCorpus >= requiredCorpus
      ? 0
      : Math.max(requiredCorpus - projectedCorpus, 0);
  const yearsLeft = clampFiniteNumber(projection.yearsLeft, 0);
  const currentMonthlyInvestment = clampFiniteNumber(
    assumptions.monthlyInvestment,
    0
  );
  const monthlyPension = clampFiniteNumber(assumptions.monthlyPension, 0);
  const desiredRetirementIncome = clampFiniteNumber(
    assumptions.desiredMonthlyIncome,
    0
  );

  const requiredMonthlyInvestment = calculateRequiredMonthlyInvestment(
    requiredCorpus,
    currentCorpus,
    yearsLeft,
    assumptions.equityReturn
  );

  const additionalMonthlyInvestmentNeeded = Math.max(
    requiredMonthlyInvestment - currentMonthlyInvestment,
    0
  );

  let status: RetirementGapStatus = "ON_TRACK";

  if (projectedCorpus < requiredCorpus) {
    if (currentMonthlyInvestment === 0) {
      status = "AT_RISK";
    } else if (
      additionalMonthlyInvestmentNeeded <= currentMonthlyInvestment * 0.5
    ) {
      status = "NEEDS_ATTENTION";
    } else {
      status = "AT_RISK";
    }
  }

  let recommendation = "Current investment strategy is sufficient for FIRE54.";

  if (status === "NEEDS_ATTENTION") {
    const amount = Math.round(additionalMonthlyInvestmentNeeded);
    recommendation = `Increase monthly investment by ₹${amount.toLocaleString("en-IN")} to bridge the retirement gap.`;
  }

  if (status === "AT_RISK") {
    recommendation =
      "Current path may not achieve FIRE54. Consider increasing investments, reducing expenses, or reviewing retirement age.";
  }

  return {
    status,
    currentCorpus,
    projectedCorpus,
    requiredCorpus,
    corpusGap,
    yearsLeft,
    currentMonthlyInvestment,
    requiredMonthlyInvestment,
    additionalMonthlyInvestmentNeeded,
    monthlyPension,
    desiredRetirementIncome,
    recommendation,
  };
}
