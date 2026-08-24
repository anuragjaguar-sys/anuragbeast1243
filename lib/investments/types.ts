// =========================================
// ATHENA Portfolio Engine
// Types
// =========================================

export type PortfolioType = "Asset" | "Liability";

export type AssetClass =
  | "Equity"
  | "Debt"
  | "Hybrid"
  | "Alternative"
  | "Cash";

export type AssetCategory =
  | "Mutual Fund"
  | "PPF"
  | "EPF"
  | "NPS"
  | "Stocks"
  | "ETF"
  | "Gold"
  | "Fixed Deposit"
  | "Emergency Fund"
  | "Savings Account"
  | "Cash"
  | "Other";

export type LiabilityCategory =
  | "Home Loan"
  | "Car Loan"
  | "Personal Loan"
  | "Credit Card"
  | "Other";

export type GoalType =
  | "Retirement"
  | "Emergency Fund"
  | "Travel"
  | "House"
  | "Education"
  | "Wealth Creation"
  | "Other";

export interface BasePortfolioItem {
  id: string;
  name: string;
  type: PortfolioType;

  currentValue: number;

  notes?: string;
}

export interface Asset extends BasePortfolioItem {
  type: "Asset";

  category: AssetCategory;

  assetClass: AssetClass;

  investedAmount: number;

  monthlyContribution: number;

  expectedReturn: number;

  units?: number;

  nav?: number;

  goal: GoalType;

  riskLevel: "Low" | "Medium" | "High";
}

export interface Liability extends BasePortfolioItem {
  type: "Liability";

  category: LiabilityCategory;

  originalAmount: number;

  outstandingAmount: number;

  interestRate: number;

  emi: number;

  tenureMonths: number;

  remainingMonths: number;
}

export type PortfolioItem = Asset | Liability;

export interface AssetAllocation {
  equity: number;
  debt: number;
  hybrid: number;
  alternative: number;
  cash: number;
}

export interface GoalProgress {
  name: GoalType;

  currentValue: number;

  targetValue: number;

  progress: number;

  onTrack: boolean;
}

export interface PortfolioSummary {
  totalAssets: number;

  totalLiabilities: number;

  netWorth: number;

  monthlyInvestment: number;

  monthlyEMI: number;

  totalInvested: number;

  totalProfit: number;

  overallReturn: number;

  allocation: AssetAllocation;

  diversificationScore: number;

  largestHolding: string;

  assetCount: number;

  liabilityCount: number;
}