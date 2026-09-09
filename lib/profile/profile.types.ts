export interface PersonalProfile {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
}

export interface IncomeProfile {
  monthlySalary: number;
  monthlyInvestment: number; // Amount invested every month
  annualIncrement: number;   // Annual salary growth (stored as decimal, e.g. 0.05 = 5%)
  monthlyPension: number;    // Expected monthly pension after retirement
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
  equityReturn: number;
  debtReturn: number;
  inflationRate: number;
  withdrawalRate: number;
  salaryIncrement: number;
  sipIncrease: number;
}

export interface GoalProfile {
  desiredMonthlyRetirementIncome: number;
  annualTravelBudget: number;
  emergencyFundMonths: number;
}

// NEW: Partner Profile for Household Mode
export interface PartnerProfile {
  name: string;
  currentAge: number;
  retirementAge: number;
  
  // Income
  monthlySalary: number;
  monthlyInvestment: number;
  monthlyPension: number;
  
  // Assets
  mutualFunds: number;
  ppf: number;
  epf: number;
  nps: number;
}

export interface FinancialProfile {
  householdMode: boolean;
  partner?: PartnerProfile;
  
  personal: PersonalProfile;
  income: IncomeProfile;
  assets: AssetProfile;
  liabilities: LiabilityProfile;
  assumptions: AssumptionProfile;
  goals: GoalProfile;
}