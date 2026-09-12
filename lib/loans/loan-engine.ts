export interface LoanScheduleMonth {
  month: number;
  openingBalance: number;
  emi: number;
  interestPaid: number;
  principalPaid: number;
  prepayment: number;
  closingBalance: number;
}

export interface LoanSimulationResult {
  baseEMI: number;
  monthlyPrepayment: number;
  totalMonths: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  interestSaved: number;
  tenureReducedMonths: number;
  schedule: LoanScheduleMonth[];
}

export interface ArbitrageComparison {
  prepaymentReturnRate: number; // e.g. 8.5% guaranteed
  equityExpectedReturn: number; // e.g. 12%
  prepaymentMonthly: number;
  durationMonths: number;
  totalPrepaid: number;
  guaranteedInterestSaved: number;
  projectedEquityCorpus: number;
  netWealthDelta: number; // equityCorpus - (totalPrepaid + interestSaved)
}

/**
 * Standard EMI calculation: [P * r * (1 + r)^n] / [(1 + r)^n - 1]
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / tenureMonths);
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

/**
 * Generates full monthly amortisation schedule with recurring prepayment.
 */
export function simulateLoanSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  monthlyPrepayment: number = 0
): LoanSimulationResult {
  const baseEMI = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / 12 / 100;

  // 1. Calculate baseline without prepayment for interest saved comparison
  let baselineInterest = 0;
  let tempBal = principal;
  for (let m = 1; m <= tenureMonths; m++) {
    const interest = tempBal * monthlyRate;
    const princ = Math.min(tempBal, baseEMI - interest);
    baselineInterest += interest;
    tempBal -= princ;
    if (tempBal <= 0) break;
  }

  // 2. Simulate with prepayment
  const schedule: LoanScheduleMonth[] = [];
  let balance = principal;
  let totalInterestPaid = 0;
  let totalAmountPaid = 0;
  let month = 1;

  while (balance > 1 && month <= 600) { // Safety ceiling: 50 years
    const opening = balance;
    const interest = balance * monthlyRate;
    let regularPrincipal = baseEMI - interest;

    if (regularPrincipal > balance) {
      regularPrincipal = balance;
    }

    let actualPrepayment = monthlyPrepayment;
    if (opening - regularPrincipal < actualPrepayment) {
      actualPrepayment = Math.max(0, opening - regularPrincipal);
    }

    const totalPrincipal = regularPrincipal + actualPrepayment;
    const closing = Math.max(0, opening - totalPrincipal);
    const totalMonthPaid = interest + regularPrincipal + actualPrepayment;

    totalInterestPaid += interest;
    totalAmountPaid += totalMonthPaid;

    schedule.push({
      month,
      openingBalance: Math.round(opening),
      emi: Math.round(baseEMI),
      interestPaid: Math.round(interest),
      principalPaid: Math.round(totalPrincipal),
      prepayment: Math.round(actualPrepayment),
      closingBalance: Math.round(closing)
    });

    balance = closing;
    month++;
  }

  const simulatedMonths = schedule.length;
  const interestSaved = Math.max(0, Math.round(baselineInterest - totalInterestPaid));
  const tenureReducedMonths = Math.max(0, tenureMonths - simulatedMonths);

  return {
    baseEMI,
    monthlyPrepayment,
    totalMonths: simulatedMonths,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalAmountPaid: Math.round(totalAmountPaid),
    interestSaved,
    tenureReducedMonths,
    schedule
  };
}

/**
 * Evaluates guaranteed debt reduction vs equity index fund compounding
 */
export function calculateArbitrage(
  prepaymentMonthly: number,
  durationMonths: number,
  loanRate: number = 8.5,
  equityRate: number = 12.0
): ArbitrageComparison {
  const rEquity = equityRate / 12 / 100;
  
  // Future Value of monthly SIP in Equity
  const projectedEquityCorpus = rEquity > 0
    ? Math.round(prepaymentMonthly * ((Math.pow(1 + rEquity, durationMonths) - 1) / rEquity) * (1 + rEquity))
    : prepaymentMonthly * durationMonths;

  const totalPrepaid = prepaymentMonthly * durationMonths;
  
  // Approximate interest saved by accelerating debt payoff over the duration
  const rLoan = loanRate / 12 / 100;
  const guaranteedInterestSaved = Math.round(
    prepaymentMonthly * ((Math.pow(1 + rLoan, durationMonths) - 1) / rLoan) - totalPrepaid
  );

  const netWealthDelta = projectedEquityCorpus - (totalPrepaid + guaranteedInterestSaved);

  return {
    prepaymentReturnRate: loanRate,
    equityExpectedReturn: equityRate,
    prepaymentMonthly,
    durationMonths,
    totalPrepaid,
    guaranteedInterestSaved: Math.max(0, guaranteedInterestSaved),
    projectedEquityCorpus,
    netWealthDelta
  };
}
