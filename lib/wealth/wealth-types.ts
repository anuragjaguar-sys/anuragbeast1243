// ==========================================
// FIRE54 Wealth Engine Types
// Sprint 4A
// ==========================================

export interface AssetAllocation {
  mutualFunds: number;
  ppf: number;
  epf: number;
  nps: number;
  emergencyFund: number;
  cash: number;
}

export interface LiabilityAllocation {
  homeLoan: number;
  otherLoans: number;
}

export interface WealthMetrics {
  // Totals
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;

  // Categories
  investedAssets: number;
  liquidAssets: number;

  // Ratios
  investmentRatio: number;
  liquidityRatio: number;
  debtRatio: number;

  // Dashboard
  wealthScore: number;
  status: "Excellent" | "Good" | "Average" | "Needs Attention";

  recommendations: string[];
}