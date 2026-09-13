export interface RetirementAssumptions {
  currentAge: number;
  retirementAge: number;

  // Assets
  mutualFunds: number;
  ppf: number;
  epf: number;
  nps: number;
  emergencyFund: number;
  cash: number;

  // Legacy (kept for compatibility)
  currentCorpus: number;

  // Income
  monthlySalary: number;
  monthlyInvestment: number;
  postDebtMonthlySurge?: number;
  debtPayoffYears?: number;
  annualSipIncrease: number;
  expectedAnnualIncrement: number;

  // Returns & Volatility (Monte Carlo)
  equityReturn: number;
  equityVolatility: number;
  debtReturn: number;
  debtVolatility: number;
  inflationRate: number;
  withdrawalRate: number;

  // Retirement
  desiredMonthlyIncome: number;
  monthlyPension: number;
}

export interface YearProjection {
  age: number;
  year: number;

  // Deterministic baseline
  corpus: number;
  
  // Monte Carlo Percentile Bands
  corpus10?: number;
  corpus50?: number;
  corpus90?: number;

  mutualFunds: number;
  ppf: number;
  epf: number;
  nps: number;
  emergencyFund: number;

  targetCorpus: number;
  gap: number;
}

export interface RetirementProjection {
  currentCorpus: number;
  projectedCorpus: number;
  requiredCorpus: number;

  targetMonthlyIncome: number;
  annualIncomeRequired: number;

  yearlyProjection: YearProjection[];

  isOnTrack: boolean;

  // Dashboard Intelligence
  yearsLeft: number;
  fireReadiness: number;
  surplus: number;
  monthlyIncomeGap: number;
  
  // Monte Carlo probability of hitting the target
  probabilityOfSuccess: number;

  status:
    | "Excellent"
    | "On Track"
    | "Needs Improvement"
    | "Critical";

  recommendations: string[];

  // Future expansion
  retirementAgeReached?: boolean;
  sustainableUntilAge?: number;
}