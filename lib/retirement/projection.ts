import { RetirementAssumptions, RetirementProjection, YearProjection } from "./types";
import {
  calculateAnnualRetirementIncome,
  calculateFutureMonthlyIncome,
  calculateRequiredCorpus,
} from "./calculations";

export function generateRetirementProjection(
  assumptions: RetirementAssumptions
): RetirementProjection {
  const yearsToRetirement =
    assumptions.retirementAge - assumptions.currentAge;

  const targetMonthlyIncome = calculateFutureMonthlyIncome(
    assumptions.desiredMonthlyIncome,
    assumptions.inflationRate,
    yearsToRetirement
  );

  const annualIncomeRequired =
    calculateAnnualRetirementIncome(targetMonthlyIncome);

  const requiredCorpus = calculateRequiredCorpus(
    annualIncomeRequired,
    assumptions.withdrawalRate
  );

  const yearlyProjection: YearProjection[] = [];

  let corpus = assumptions.currentCorpus;

  for (let year = 0; year <= yearsToRetirement; year++) {
    const age = assumptions.currentAge + year;

    if (year > 0) {
      corpus =
        corpus * (1 + assumptions.expectedReturn) +
        assumptions.monthlyInvestment * 12;
    }

    yearlyProjection.push({
      age,
      year,
      corpus: Math.round(corpus),
      targetCorpus: Math.round(requiredCorpus),
      gap: Math.round(requiredCorpus - corpus),
    });
  }

  return {
    currentCorpus: assumptions.currentCorpus,
    projectedCorpus: Math.round(corpus),
    requiredCorpus: Math.round(requiredCorpus),
    targetMonthlyIncome: Math.round(targetMonthlyIncome),
    annualIncomeRequired: Math.round(annualIncomeRequired),
    yearlyProjection,
    isOnTrack: corpus >= requiredCorpus,
  };
}