export interface PersonalProfile {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
}

export interface IncomeProfile {
  monthlySalary: number;

  // Amount invested every month
  monthlyInvestment: number;

  // Annual salary growth (stored as decimal, e.g. 0.05 = 5%)
  annualIncrement: number;

  // Expected monthly pension after retirement
  monthlyPension: number;
}


export interface AssetProfile {
  mutualFunds: number;
  ppf: number;
  epf: number;
  nps: number;
  emergencyFund: number;
  cash: number;

  // Initial assets held before ATHENA was started
  stocks: number;
  fd: number;
  gold: number;
  property: number;
}

export interface LiabilityProfile {
  homeLoanOutstanding: number;
  otherLoans: number;
}

export interface AssumptionProfile {
  // Investment Returns
  equityReturn: number;
  debtReturn: number;

  // Economic Assumptions
  inflationRate: number;
  withdrawalRate: number;

  // Growth Assumptions
  salaryIncrement: number;
  sipIncrease: number;
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