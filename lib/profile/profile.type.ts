export interface PersonalProfile {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
}

export interface IncomeProfile {
  monthlySalary: number;
  annualIncrement: number;
  monthlyPension: number;
}

export interface AssetProfile {
  mutualFunds: number;
  ppf: number;
  epf: number;
  nps: number;
  emergencyFund: number;
  cash: number;
}

export interface LiabilityProfile {
  homeLoanOutstanding: number;
  otherLoans: number;
}

export interface AssumptionProfile {
  equityReturn: number;
  debtReturn: number;
  inflationRate: number;
  withdrawalRate: number;
}

export interface GoalProfile {
  desiredMonthlyRetirementIncome: number;
  annualTravelBudget: number;
  emergencyFundMonths: number;
}

export interface FinancialProfile {
  personal: PersonalProfile;
  income: IncomeProfile;
  assets: AssetProfile;
  liabilities: LiabilityProfile;
  assumptions: AssumptionProfile;
  goals: GoalProfile;
}