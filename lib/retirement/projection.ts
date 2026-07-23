import {
  RetirementAssumptions,
  RetirementProjection,
  YearProjection,
} from "./types";

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
  corpus * (1 + assumptions.equityReturn) +
  assumptions.monthlyInvestment * 12;
    }

    yearlyProjection.push({
  age,
  year,
  corpus: Math.round(corpus),

  // Temporary asset breakdown
  mutualFunds: Math.round(corpus),
  ppf: 0,
  epf: 0,
  emergencyFund: 0,

  targetCorpus: Math.round(requiredCorpus),
  gap: Math.round(requiredCorpus - corpus),
});
  }

  // ============================
  // Retirement Intelligence
  // ============================

  const fireReadiness = Math.min(
    (corpus / requiredCorpus) * 100,
    100
  );

  const surplus = corpus - requiredCorpus;

  const monthlyIncomeGap = Math.max(
    assumptions.desiredMonthlyIncome -
      assumptions.monthlyPension,
    0
  );

  const status =
    fireReadiness >= 100
      ? "Excellent"
      : fireReadiness >= 80
      ? "On Track"
      : fireReadiness >= 60
      ? "Needs Improvement"
      : "Critical";

  const recommendations: string[] = [];

  if (fireReadiness < 100) {
    recommendations.push(
      "Increase monthly investment to improve retirement readiness."
    );
  }

  if (monthlyIncomeGap > 0) {
    recommendations.push(
      "Plan additional investments to bridge your retirement income gap."
    );
  }

  if (corpus >= requiredCorpus) {
    recommendations.push(
      "You are on track to achieve your retirement goal."
    );
  }

  return {
    currentCorpus: assumptions.currentCorpus,

    projectedCorpus: Math.round(corpus),

    requiredCorpus: Math.round(requiredCorpus),

    targetMonthlyIncome: Math.round(targetMonthlyIncome),

    annualIncomeRequired: Math.round(
      annualIncomeRequired
    ),

    yearlyProjection,

    isOnTrack: corpus >= requiredCorpus,

    // Dashboard Intelligence

    yearsLeft: yearsToRetirement,

    fireReadiness: Math.round(fireReadiness),

    surplus: Math.round(surplus),

    monthlyIncomeGap: Math.round(monthlyIncomeGap),

    status,

    recommendations,
  };
}