import type { RetirementAssumptions, RetirementProjection, YearProjection } from "./types";
import { calculateAnnualRetirementIncome, calculateFutureMonthlyIncome, calculateRequiredCorpus } from "./calculations";

function safeNumber(value: number | undefined | null): number {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Number(value);
}

function clampNonNegative(value: number): number {
  return Math.max(0, safeNumber(value));
}

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

// Standard deterministic future value (clamps negative rates to 0)
function futureValue(currentValue: number, annualReturn: number, years: number): number {
  const value = clampNonNegative(currentValue);
  const rate = normaliseRate(annualReturn, 0.5);
  const period = Math.max(0, years);
  return value * Math.pow(1 + rate, period);
}

// Standard deterministic monthly investment (clamps negative rates to 0)
function futureValueOfMonthlyInvestment(monthlyInvestment: number, annualReturn: number): number {
  const monthly = clampNonNegative(monthlyInvestment);
  const annualRate = normaliseRate(annualReturn, 0.5);
  if (monthly <= 0) return 0;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return monthly * 12;
  return monthly * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate);
}

// Monte Carlo stochastic functions (Allows negative returns in market crashes)
function stochasticFutureValue(currentValue: number, annualReturn: number): number {
  const value = Math.max(0, currentValue);
  const rate = Math.max(-1, annualReturn); 
  return value * (1 + rate);
}

function stochasticFutureValueOfMonthlyInvestment(monthlyInvestment: number, annualReturn: number): number {
  const monthly = Math.max(0, monthlyInvestment);
  if (monthly <= 0) return 0;
  const rate = Math.max(-0.999, annualReturn); 
  const monthlyRate = rate / 12;
  if (Math.abs(monthlyRate) < 0.0001) return monthly * 12;
  return monthly * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate);
}

function calculateYearlyMonthlyInvestment(baseMonthlyInvestment: number, annualSipIncrease: number, year: number): number {
  const base = clampNonNegative(baseMonthlyInvestment);
  const increase = normaliseRate(annualSipIncrease, 0.2);
  const yearIndex = Math.max(0, year - 1);
  return base * Math.pow(1 + increase, yearIndex);
}

// Standard Normal Random Variable Generator (Box-Muller Transform)
function randomNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Calculate stochastic return for a single year using Geometric Brownian Motion
function getStochasticReturn(mu: number, sigma: number): number {
  const z = randomNormal();
  return Math.exp((mu - Math.pow(sigma, 2) / 2) + sigma * z) - 1;
}

export function generateRetirementProjection(assumptions: RetirementAssumptions): RetirementProjection {
  const currentAge = clampNonNegative(assumptions.currentAge);
  const retirementAge = clampNonNegative(assumptions.retirementAge);
  const yearsToRetirement = Math.max(0, Math.floor(retirementAge - currentAge));

  const equityReturn = normaliseRate(assumptions.equityReturn, 0.2);
  const equityVolatility = normaliseRate(assumptions.equityVolatility ?? 0.15, 0.3);
  const debtReturn = normaliseRate(assumptions.debtReturn, 0.15);
  const debtVolatility = normaliseRate(assumptions.debtVolatility ?? 0.03, 0.1);
  const inflationRate = normaliseRate(assumptions.inflationRate, 0.15);
  const withdrawalRate = normaliseRate(assumptions.withdrawalRate, 0.1);
  const annualSipIncrease = normaliseRate(assumptions.annualSipIncrease, 0.2);

  const targetMonthlyIncome = calculateFutureMonthlyIncome(
    clampNonNegative(assumptions.desiredMonthlyIncome),
    inflationRate,
    yearsToRetirement
  );
  
  const monthlyPension = clampNonNegative(assumptions.monthlyPension);
  const corpusFundedMonthlyIncome = Math.max(targetMonthlyIncome - monthlyPension, 0);
  const annualIncomeRequired = calculateAnnualRetirementIncome(corpusFundedMonthlyIncome);
  const requiredCorpus = calculateRequiredCorpus(annualIncomeRequired, Math.max(withdrawalRate, 0.0001));

  let mutualFunds = clampNonNegative(assumptions.mutualFunds);
  let ppf = clampNonNegative(assumptions.ppf);
  let epf = clampNonNegative(assumptions.epf);
  let nps = clampNonNegative(assumptions.nps);
  
  const explicitRetirementCorpus = mutualFunds + ppf + epf + nps;
  const legacyCorpus = clampNonNegative(assumptions.currentCorpus);

  if (explicitRetirementCorpus <= 0 && legacyCorpus > 0) {
    mutualFunds = legacyCorpus;
    ppf = 0; epf = 0; nps = 0;
  }

  const initialCorpus = mutualFunds + ppf + epf + nps;
  let corpus = initialCorpus;
  const yearlyProjection: YearProjection[] = [];

  // -----------------------------------------------------
  // 1. DETERMINISTIC PROJECTION (BASELINE)
  // -----------------------------------------------------
  yearlyProjection.push({
    age: currentAge,
    year: 0,
    corpus: Math.round(corpus),
    mutualFunds: Math.round(mutualFunds),
    ppf: Math.round(ppf),
    epf: Math.round(epf),
    nps: Math.round(nps),
    emergencyFund: 0,
    targetCorpus: Math.round(requiredCorpus),
    gap: Math.round(requiredCorpus - corpus),
  });

  for (let year = 1; year <= yearsToRetirement; year++) {
    mutualFunds = futureValue(mutualFunds, equityReturn, 1);
    ppf = futureValue(ppf, debtReturn, 1);
    epf = futureValue(epf, debtReturn, 1);
    nps = futureValue(nps, equityReturn, 1);

    const monthlyInvestment = calculateYearlyMonthlyInvestment(assumptions.monthlyInvestment, annualSipIncrease, year);
    const annualInvestment = futureValueOfMonthlyInvestment(monthlyInvestment, equityReturn);
    mutualFunds += annualInvestment;
    corpus = mutualFunds + ppf + epf + nps;

    yearlyProjection.push({
      age: currentAge + year,
      year,
      corpus: Math.round(corpus),
      mutualFunds: Math.round(mutualFunds),
      ppf: Math.round(ppf),
      epf: Math.round(epf),
      nps: Math.round(nps),
      emergencyFund: 0,
      targetCorpus: Math.round(requiredCorpus),
      gap: Math.round(requiredCorpus - corpus),
    });
  }

  // -----------------------------------------------------
  // 2. MONTE CARLO SIMULATION (1,000 ITERATIONS)
  // -----------------------------------------------------
  const ITERATIONS = 1000;
  const pathsByYear: number[][] = Array.from({ length: yearsToRetirement + 1 }, () => []);
  let successfulPaths = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    let p_mf = clampNonNegative(assumptions.mutualFunds > 0 ? assumptions.mutualFunds : legacyCorpus);
    let p_ppf = clampNonNegative(assumptions.ppf);
    let p_epf = clampNonNegative(assumptions.epf);
    let p_nps = clampNonNegative(assumptions.nps);

    pathsByYear[0].push(p_mf + p_ppf + p_epf + p_nps);

    for (let y = 1; y <= yearsToRetirement; y++) {
      const rEq = getStochasticReturn(equityReturn, equityVolatility);
      const rDebt = getStochasticReturn(debtReturn, debtVolatility);

      p_mf = stochasticFutureValue(p_mf, rEq);
      p_nps = stochasticFutureValue(p_nps, rEq);
      p_ppf = stochasticFutureValue(p_ppf, rDebt);
      p_epf = stochasticFutureValue(p_epf, rDebt);

      const monthlyInv = calculateYearlyMonthlyInvestment(assumptions.monthlyInvestment, annualSipIncrease, y);
      const annualInv = stochasticFutureValueOfMonthlyInvestment(monthlyInv, rEq);
      
      p_mf += annualInv;
      pathsByYear[y].push(p_mf + p_ppf + p_epf + p_nps);
    }

    if (pathsByYear[yearsToRetirement][i] >= requiredCorpus) {
      successfulPaths++;
    }
  }

  // Calculate Percentiles and Merge into Projection
  for (let y = 0; y <= yearsToRetirement; y++) {
    const sortedPaths = pathsByYear[y].sort((a, b) => a - b);
    yearlyProjection[y].corpus10 = Math.round(sortedPaths[Math.floor(ITERATIONS * 0.10)]);
    yearlyProjection[y].corpus50 = Math.round(sortedPaths[Math.floor(ITERATIONS * 0.50)]);
    yearlyProjection[y].corpus90 = Math.round(sortedPaths[Math.floor(ITERATIONS * 0.90)]);
  }

  // -----------------------------------------------------
  // 3. FINAL RESULTS
  // -----------------------------------------------------
  const probabilityOfSuccess = Math.round((successfulPaths / ITERATIONS) * 100);
  const projectedCorpus = Math.round(corpus);
  const finalGap = Math.max(requiredCorpus - projectedCorpus, 0);
  const surplus = projectedCorpus - requiredCorpus;
  const fireReadiness = requiredCorpus > 0 ? Math.min((projectedCorpus / requiredCorpus) * 100, 100) : 100;
  
  let status: RetirementProjection["status"];
  if (probabilityOfSuccess >= 90) status = "Excellent";
  else if (probabilityOfSuccess >= 75) status = "On Track";
  else if (probabilityOfSuccess >= 50) status = "Needs Improvement";
  else status = "Critical";

  const recommendations: string[] = [];
  
  if (probabilityOfSuccess < 75) {
    recommendations.push(`Your Monte Carlo simulation shows only a ${probabilityOfSuccess}% probability of success. Consider lowering your FIRE target or increasing your equity safety buffer.`);
  } else {
    recommendations.push(`Excellent resilience! You have a ${probabilityOfSuccess}% probability of surviving market volatility and reaching your target.`);
  }

  return {
    currentCorpus: Math.round(initialCorpus),
    projectedCorpus,
    requiredCorpus: Math.round(requiredCorpus),
    targetMonthlyIncome: Math.round(targetMonthlyIncome),
    annualIncomeRequired: Math.round(annualIncomeRequired),
    yearlyProjection,
    isOnTrack: probabilityOfSuccess >= 75,
    yearsLeft: yearsToRetirement,
    fireReadiness: Math.round(fireReadiness),
    surplus: Math.round(surplus),
    monthlyIncomeGap: Math.round(corpusFundedMonthlyIncome),
    probabilityOfSuccess,
    status,
    recommendations,
  };
}