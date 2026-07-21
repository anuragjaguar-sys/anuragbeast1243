export interface RetirementAssumptions {
  currentAge: number;
  retirementAge: number;

  // Assets
  mutualFunds: number;
  ppf: number;
  epf: number;
  emergencyFund: number;
  cash: number;

  // Legacy (kept for compatibility)
  currentCorpus: number;

  // Income
  monthlySalary: number;
  monthlyInvestment: number;
  annualSipIncrease: number;
  expectedAnnualIncrement: number;

  // Returns
  equityReturn: number;
  debtReturn: number;
  inflationRate: number;
  withdrawalRate: number;

  // Retirement
  desiredMonthlyIncome: number;
  monthlyPension: number;
}

export interface YearProjection {
  age: number;
  year: number;

  corpus: number;
  mutualFunds: number;
  ppf: number;
  epf: number;
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