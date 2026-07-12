export type MonthlyReviewFormData = {
  netSalary: string;
  otherIncome: string;
  livingExpenses: string;
  travel: string;
  medical: string;
  otherExpenses: string;
  ppf: string;
  mutualFundSip: string;
  additionalMutualFund: string;
  nps: string;
  mutualFundValue: string;
  ppfValue: string;
  npsValue: string;
  emergencyFund: string;
  bankBalance: string;
  homeLoanOutstanding: string;
  emiPaid: string;
  extraHomeLoanPayment: string;
  tradedFno: boolean;
  tradingProfitLoss: string;
  biggestDecision: string;
  confidence: number;
  notes: string;
};

export const INITIAL_MONTHLY_REVIEW: MonthlyReviewFormData = {
  netSalary: "",
  otherIncome: "",
  livingExpenses: "",
  travel: "",
  medical: "",
  otherExpenses: "",
  ppf: "",
  mutualFundSip: "",
  additionalMutualFund: "",
  nps: "",
  mutualFundValue: "",
  ppfValue: "",
  npsValue: "",
  emergencyFund: "",
  bankBalance: "",
  homeLoanOutstanding: "",
  emiPaid: "",
  extraHomeLoanPayment: "",
  tradedFno: false,
  tradingProfitLoss: "",
  biggestDecision: "",
  confidence: 7,
  notes: "",
};

/** Stable key for storage, e.g. "2026-07" */
export function getMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Display label, e.g. "July 2026" */
export function getMonthLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
