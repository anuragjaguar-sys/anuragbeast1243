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

/**
 * =====================================================
 * FIRE54 RETIREMENT PROJECTION ENGINE
 * =====================================================
 *
 * Projects the retirement corpus using:
 *
 * - Mutual Funds -> equity return
 * - PPF -> debt return
 * - EPF -> debt return
 * - New SIP -> equity return
 * - Annual SIP increase
 *
 * IMPORTANT:
 *
 * Athena accepts percentage assumptions in either form:
 *
 *   0.12 = 12%
 *   12   = 12%
 *
 * This prevents accidental 1200% growth.
 * =====================================================
 */

function safeNumber(value: number | undefined | null): number {
  if (!Number.isFinite(value ?? NaN)) {
    return 0;
  }

  return Number(value);
}

function clampNonNegative(value: number): number {
  return Math.max(0, safeNumber(value));
}

/**
 * Convert either decimal or percentage input
 * into decimal form.
 *
 * Examples:
 *
 * 0.12 -> 0.12
 * 12   -> 0.12
 * 0.05 -> 0.05
 * 5    -> 0.05
 */
function normaliseRate(value: number, maximumRate: number): number {
  const safe = safeNumber(value);
  const decimalRate = safe >= 1 ? safe / 100 : safe;

  return Math.min(Math.max(0, decimalRate), maximumRate);
}

function isRateCapped(value: number, maximumRate: number): boolean {
  const safe = safeNumber(value);
  const decimalRate = safe >= 1 ? safe / 100 : safe;

  return decimalRate > maximumRate;
}

/**
 * Future value of an existing asset.
 */
function futureValue(
  currentValue: number,
  annualReturn: number,
  years: number
): number {
  const value = clampNonNegative(currentValue);
  const rate = normaliseRate(annualReturn, 0.2);
  const period = Math.max(0, years);

  return value * Math.pow(1 + rate, period);
}

/**
 * Future value of monthly contributions made
 * throughout one year.
 */
function futureValueOfMonthlyInvestment(
  monthlyInvestment: number,
  annualReturn: number
): number {
  const monthly = clampNonNegative(monthlyInvestment);
  const annualRate = normaliseRate(annualReturn, 0.2);

  if (monthly <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12;

  if (monthlyRate === 0) {
    return monthly * 12;
  }

  return (
    monthly *
    ((Math.pow(1 + monthlyRate, 12) - 1) /
      monthlyRate)
  );
}

/**
 * Calculate monthly SIP for a particular year.
 *
 * Example:
 *
 * Base SIP = ₹20,000
 * SIP increase = 10%
 *
 * Year 1 = ₹20,000
 * Year 2 = ₹22,000
 * Year 3 = ₹24,200
 */
function calculateYearlyMonthlyInvestment(
  baseMonthlyInvestment: number,
  annualSipIncrease: number,
  year: number
): number {
  const base = clampNonNegative(
    baseMonthlyInvestment
  );

  const increase = normaliseRate(annualSipIncrease, 0.2);

  const yearIndex = Math.max(0, year - 1);

  return (
    base *
    Math.pow(1 + increase, yearIndex)
  );
}

/**
 * Generate FIRE54 retirement projection.
 */
export function generateRetirementProjection(
  assumptions: RetirementAssumptions
): RetirementProjection {
  const currentAge = clampNonNegative(
    assumptions.currentAge
  );

  const retirementAge = clampNonNegative(
    assumptions.retirementAge
  );

  const yearsToRetirement = Math.max(
    0,
    Math.floor(retirementAge - currentAge)
  );

  /**
   * -----------------------------------------------------
   * NORMALISED ASSUMPTIONS
   * -----------------------------------------------------
   */

  const equityReturn = normaliseRate(
    assumptions.equityReturn,
    0.2
  );

  const debtReturn = normaliseRate(
    assumptions.debtReturn,
    0.15
  );

  const inflationRate = normaliseRate(
    assumptions.inflationRate,
    0.15
  );

  const withdrawalRate = normaliseRate(
    assumptions.withdrawalRate,
    0.1
  );

  const annualSipIncrease = normaliseRate(
    assumptions.annualSipIncrease,
    0.2
  );

  /**
   * -----------------------------------------------------
   * RETIREMENT INCOME TARGET
   * -----------------------------------------------------
   */

  const targetMonthlyIncome =
    calculateFutureMonthlyIncome(
      clampNonNegative(
        assumptions.desiredMonthlyIncome
      ),
      inflationRate,
      yearsToRetirement
    );

  const monthlyPension = clampNonNegative(
    assumptions.monthlyPension
  );

  const corpusFundedMonthlyIncome = Math.max(
    targetMonthlyIncome - monthlyPension,
    0
  );

  const annualIncomeRequired =
    calculateAnnualRetirementIncome(
      corpusFundedMonthlyIncome
    );

  const requiredCorpus =
    calculateRequiredCorpus(
      annualIncomeRequired,
      Math.max(
        withdrawalRate,
        0.0001
      )
    );

  /**
   * -----------------------------------------------------
   * CURRENT RETIREMENT ASSETS
   * -----------------------------------------------------
   */

  let mutualFunds =
    clampNonNegative(
      assumptions.mutualFunds
    );

  let ppf =
    clampNonNegative(
      assumptions.ppf
    );

  let epf =
    clampNonNegative(
      assumptions.epf
    );

  let nps =
    clampNonNegative(
      assumptions.nps
    );

  const explicitRetirementCorpus =
    mutualFunds +
    ppf +
    epf +
    nps;

  const legacyCorpus =
    clampNonNegative(
      assumptions.currentCorpus
    );

  /**
   * Backwards compatibility.
   *
   * If individual assets aren't available,
   * use legacy currentCorpus.
   */
  if (
    explicitRetirementCorpus <= 0 &&
    legacyCorpus > 0
  ) {
    mutualFunds = legacyCorpus;
    ppf = 0;
    epf = 0;
    nps = 0;
  }

  let corpus =
    mutualFunds +
    ppf +
    epf +
    nps;

  /**
   * -----------------------------------------------------
   * YEAR 0
   * -----------------------------------------------------
   */

  const yearlyProjection: YearProjection[] = [];

  yearlyProjection.push({
    age: currentAge,
    year: 0,

    corpus: Math.round(corpus),

    mutualFunds: Math.round(
      mutualFunds
    ),

    ppf: Math.round(
      ppf
    ),

    epf: Math.round(
      epf
    ),

    nps: Math.round(
      nps
    ),

    emergencyFund: 0,

    targetCorpus: Math.round(
      requiredCorpus
    ),

    gap: Math.round(
      requiredCorpus - corpus
    ),
  });

  /**
   * -----------------------------------------------------
   * YEAR-BY-YEAR PROJECTION
   * -----------------------------------------------------
   */

  for (
    let year = 1;
    year <= yearsToRetirement;
    year++
  ) {
    /**
     * Existing Mutual Funds
     */
    mutualFunds =
      futureValue(
        mutualFunds,
        equityReturn,
        1
      );

    /**
     * Existing PPF
     */
    ppf =
      futureValue(
        ppf,
        debtReturn,
        1
      );

    /**
     * Existing EPF
     */
    epf =
      futureValue(
        epf,
        debtReturn,
        1
      );

    nps =
      futureValue(
        nps,
        equityReturn,
        1
      );

    /**
     * SIP for this year.
     */
    const monthlyInvestment =
      calculateYearlyMonthlyInvestment(
        assumptions.monthlyInvestment,
        annualSipIncrease,
        year
      );

    /**
     * New SIP is treated as equity investment.
     */
    const annualInvestment =
      futureValueOfMonthlyInvestment(
        monthlyInvestment,
        equityReturn
      );

    mutualFunds +=
      annualInvestment;

    /**
     * Total retirement corpus.
     */
    corpus =
      mutualFunds +
      ppf +
      epf +
      nps;

    const age =
      currentAge + year;

    const gap =
      requiredCorpus - corpus;

    yearlyProjection.push({
      age,
      year,

      corpus: Math.round(
        corpus
      ),

      mutualFunds: Math.round(
        mutualFunds
      ),

      ppf: Math.round(
        ppf
      ),

      epf: Math.round(
        epf
      ),

      nps: Math.round(
        nps
      ),

      emergencyFund: 0,

      targetCorpus: Math.round(
        requiredCorpus
      ),

      gap: Math.round(
        gap
      ),
    });
  }

  /**
   * -----------------------------------------------------
   * FINAL POSITION
   * -----------------------------------------------------
   */

  const projectedCorpus =
    Math.round(corpus);

  const finalGap =
    Math.max(
      requiredCorpus -
        projectedCorpus,
      0
    );

  const surplus =
    projectedCorpus -
    requiredCorpus;

  const fireReadiness =
    requiredCorpus > 0
      ? Math.min(
          (
            projectedCorpus /
            requiredCorpus
          ) * 100,
          100
        )
      : 100;

  /**
   * Today's monthly income gap.
   */
  const monthlyIncomeGap = corpusFundedMonthlyIncome;

  /**
   * -----------------------------------------------------
   * STATUS
   * -----------------------------------------------------
   */

  let status:
    RetirementProjection["status"];

  if (
    fireReadiness >= 100
  ) {
    status = "Excellent";
  } else if (
    fireReadiness >= 80
  ) {
    status = "On Track";
  } else if (
    fireReadiness >= 60
  ) {
    status = "Needs Improvement";
  } else {
    status = "Critical";
  }

  /**
   * -----------------------------------------------------
   * RECOMMENDATIONS
   * -----------------------------------------------------
   */

  const recommendations: string[] = [];

  if (
    isRateCapped(assumptions.equityReturn, 0.2) ||
    isRateCapped(assumptions.debtReturn, 0.15) ||
    isRateCapped(assumptions.inflationRate, 0.15) ||
    isRateCapped(assumptions.withdrawalRate, 0.1) ||
    isRateCapped(assumptions.annualSipIncrease, 0.2)
  ) {
    recommendations.push(
      "One or more growth assumptions exceeded the retirement model's guardrails and were capped. Review your Financial Profile assumptions."
    );
  }

  if (finalGap > 0) {
    recommendations.push(
      "Your projected retirement corpus is below the FIRE54 target."
    );

    recommendations.push(
      "Increase long-term monthly investments and use annual SIP increases to progressively close the retirement gap."
    );
  }

  if (
    annualSipIncrease === 0 &&
    finalGap > 0
  ) {
    recommendations.push(
      "Consider increasing your SIP annually as your income grows."
    );
  }

  if (
    monthlyIncomeGap > 0
  ) {
    recommendations.push(
      "Your pension does not fully cover your desired retirement spending, so the retirement corpus must fund the remaining income requirement."
    );
  }

  if (
    finalGap <= 0
  ) {
    recommendations.push(
      "Your projected corpus reaches the FIRE54 target under the current assumptions."
    );

    recommendations.push(
      "Maintain investment discipline and periodically review your return, inflation and retirement-income assumptions."
    );
  }

  /**
   * -----------------------------------------------------
   * RETURN
   * -----------------------------------------------------
   */

  return {
    currentCorpus:
      Math.round(
        explicitRetirementCorpus > 0
          ? explicitRetirementCorpus
          : legacyCorpus
      ),

    projectedCorpus,

    requiredCorpus:
      Math.round(
        requiredCorpus
      ),

    targetMonthlyIncome:
      Math.round(
        targetMonthlyIncome
      ),

    annualIncomeRequired:
      Math.round(
        annualIncomeRequired
      ),

    yearlyProjection,

    isOnTrack:
      projectedCorpus >=
      requiredCorpus,

    yearsLeft:
      yearsToRetirement,

    fireReadiness:
      Math.round(
        fireReadiness
      ),

    surplus:
      Math.round(
        surplus
      ),

    monthlyIncomeGap:
      Math.round(
        monthlyIncomeGap
      ),

    status,

    recommendations,
  };
}
