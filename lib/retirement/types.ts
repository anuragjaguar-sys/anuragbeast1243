export interface RetirementAssumptions {
  currentAge: number;
  retirementAge: number;

  currentCorpus: number;
  monthlyInvestment: number;

  expectedReturn: number;
  inflationRate: number;
  withdrawalRate: number;

  desiredMonthlyIncome: number;
  monthlyPension: number;
}

export interface YearProjection {
  age: number;
  year: number;

  corpus: number;
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

  // Retirement Intelligence
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
}