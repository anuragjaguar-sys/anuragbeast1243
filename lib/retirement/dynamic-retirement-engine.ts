export interface DynamicRetirementInputs {
  currentAge: number;
  retirementAge: number;
  currentMutualFunds: number;
  currentStocks: number;
  currentPPF: number;
  currentEPF: number;
  currentNPS: number;
  currentProperty: number;
  activeMonthlySIP: number;
  stepUpPercent: number;
  loanPrincipal: number;
  actualMonthlyEMI: number;
  loanInterestRate: number;
  loanTenureMonths?: number;
  monthlyPrepayment: number;
  equityReturnRate?: number;
  ppfReturnRate?: number;
  epfReturnRate?: number;
  npsReturnRate?: number;
  propertyReturnRate?: number;
}

export interface AssetBreakdownAt54 {
  equitySIPAndMF: number;
  directStocks: number;
  ppfValue: number;
  epfValue: number;
  npsValue: number;
  propertyValue: number;
  liquidCorpus: number;
  totalNetWorth: number;
}

export interface DynamicRetirementResult {
  debtFreeMonths: number;
  debtFreeAge: number;
  baseEMI: number;
  liberatedCashflowAtPayoff: number;
  projectedCorpusAtRetirement: number;
  assetBreakdown: AssetBreakdownAt54;
  yearlyBreakdown: {
    age: number;
    year: number;
    monthlySIP: number;
    isDebtFree: boolean;
    equityCorpus: number;
    totalCorpus: number;
  }[];
}

export function calculateDynamicRetirementCorpus(
  inputs: DynamicRetirementInputs
): DynamicRetirementResult {
  const {
    currentAge,
    retirementAge,
    currentMutualFunds,
    currentStocks = 0,
    currentPPF = 0,
    currentEPF = 0,
    currentNPS = 0,
    currentProperty = 4500000,
    activeMonthlySIP,
    stepUpPercent,
    loanPrincipal,
    actualMonthlyEMI = 18250,
    loanInterestRate = 8.5,
    loanTenureMonths: _loanTenureMonths = 126,
    monthlyPrepayment,
    equityReturnRate = 12.0,
    ppfReturnRate = 7.1,
    epfReturnRate = 8.15,
    npsReturnRate = 9.5,
    propertyReturnRate = 5.0,
  } = inputs;

  const totalMonths = Math.max(0, (retirementAge - currentAge) * 12);
  const totalYears = totalMonths / 12;

  const monthlyEquityRate = equityReturnRate / 100 / 12;
  const loanMonthlyRate = loanInterestRate / 100 / 12;

  const baseEMI = actualMonthlyEMI;
  let loanBalance = loanPrincipal;
  let debtFreeMonthIndex = -1;

  let equityCorpus = currentMutualFunds;
  let currentSIP = activeMonthlySIP;

  const yearlyBreakdown: DynamicRetirementResult["yearlyBreakdown"] = [];

  for (let m = 1; m <= totalMonths; m++) {
    if (m > 1 && (m - 1) % 12 === 0 && stepUpPercent > 0) {
      currentSIP = Math.round(currentSIP * (1 + stepUpPercent / 100));
    }

    let isLoanActive = false;
    if (loanBalance > 1) {
      isLoanActive = true;
      const interest = loanBalance * loanMonthlyRate;
      const regularPrincipal = Math.max(0, Math.min(loanBalance, baseEMI - interest));
      const prepay = Math.max(0, Math.min(loanBalance - regularPrincipal, monthlyPrepayment));
      loanBalance = Math.max(0, loanBalance - (regularPrincipal + prepay));

      if (loanBalance <= 1 && debtFreeMonthIndex === -1) {
        debtFreeMonthIndex = m;
      }
    }

    let effectiveMonthlySIP = currentSIP;
    if (!isLoanActive) {
      effectiveMonthlySIP += (baseEMI + monthlyPrepayment);
    }

    // Mid-month convention for newly added SIP capital
    equityCorpus = equityCorpus * (1 + monthlyEquityRate) + effectiveMonthlySIP * (1 + monthlyEquityRate / 2);

    if (m % 12 === 0 || m === totalMonths) {
      const yearIndex = Math.ceil(m / 12);
      const currentSimAge = currentAge + yearIndex;
      yearlyBreakdown.push({
        age: currentSimAge,
        year: yearIndex,
        monthlySIP: Math.round(effectiveMonthlySIP),
        isDebtFree: !isLoanActive,
        equityCorpus: Math.round(equityCorpus),
        totalCorpus: Math.round(equityCorpus),
      });
    }
  }

  const debtFreeMonths = debtFreeMonthIndex > 0 ? debtFreeMonthIndex : 23;
  const debtFreeAge = Number((currentAge + debtFreeMonths / 12).toFixed(1));

  const directStocksAt54 = Math.round(currentStocks * Math.pow(1 + equityReturnRate / 100, totalYears));
  const ppfAt54 = Math.round(currentPPF * Math.pow(1 + ppfReturnRate / 100, totalYears));
  const epfAt54 = Math.round(currentEPF * Math.pow(1 + epfReturnRate / 100, totalYears));
  const npsAt54 = Math.round(currentNPS * Math.pow(1 + npsReturnRate / 100, totalYears));
  const propertyAt54 = Math.round(currentProperty * Math.pow(1 + propertyReturnRate / 100, totalYears));

  const liquidCorpus = Math.round(equityCorpus) + directStocksAt54 + ppfAt54 + epfAt54 + npsAt54;
  const totalNetWorth = liquidCorpus + propertyAt54;

  const assetBreakdown: AssetBreakdownAt54 = {
    equitySIPAndMF: Math.round(equityCorpus),
    directStocks: directStocksAt54,
    ppfValue: ppfAt54,
    epfValue: epfAt54,
    npsValue: npsAt54,
    propertyValue: propertyAt54,
    liquidCorpus,
    totalNetWorth,
  };

  return {
    debtFreeMonths,
    debtFreeAge,
    baseEMI,
    liberatedCashflowAtPayoff: baseEMI + monthlyPrepayment,
    projectedCorpusAtRetirement: liquidCorpus,
    assetBreakdown,
    yearlyBreakdown,
  };
}
