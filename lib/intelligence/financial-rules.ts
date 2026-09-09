export interface FinancialSnapshotMetrics {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyInvestments: number;
  emergencyFundCorpus: number;
  totalDebt: number;
  liquidAssets: number;
  netWorth: number;
}

export type FinancialRulesResult = CalculatedFinancialRules;

export interface CalculatedFinancialRules {
  savingsRate: number;              // Percentage (0 - 100)
  investmentRate: number;           // Percentage (0 - 100)
  runwayMonths: number;             // Months of expenses covered by liquid assets
  emergencyFundMonths: number;      // Months covered by designated emergency fund
  debtToIncomeRatio: number;        // Monthly debt or total debt / annual income ratio
  monthlySurplus: number;           // Income - Expenses - Investments
  isEmergencyFundAdequate: boolean; // True if >= 6 months
  isInvestmentRateOptimal: boolean; // True if >= 20%
}

/**
 * Deterministic math calculations for Athena CFO decision-making.
 * No AI heuristics, side-effects, or storage calls.
 */
export function calculateFinancialRules(snapshot: FinancialSnapshotMetrics): CalculatedFinancialRules {
  const {
    monthlyIncome = 0,
    monthlyExpenses = 0,
    monthlyInvestments = 0,
    emergencyFundCorpus = 0,
    totalDebt = 0,
    liquidAssets = 0,
  } = snapshot;

  const validIncome = Math.max(0, monthlyIncome);
  const validExpenses = Math.max(1, monthlyExpenses); // avoid division by zero

  const savingsRate = validIncome > 0
    ? Number((((validIncome - validExpenses) / validIncome) * 100).toFixed(1))
    : 0;

  const investmentRate = validIncome > 0
    ? Number(((monthlyInvestments / validIncome) * 100).toFixed(1))
    : 0;

  const runwayMonths = Number((liquidAssets / validExpenses).toFixed(1));
  const emergencyFundMonths = Number((emergencyFundCorpus / validExpenses).toFixed(1));

  const annualIncome = validIncome * 12;
  const debtToIncomeRatio = annualIncome > 0
    ? Number(((totalDebt / annualIncome) * 100).toFixed(1))
    : 0;

  const monthlySurplus = validIncome - validExpenses - monthlyInvestments;

  return {
    savingsRate,
    investmentRate,
    runwayMonths,
    emergencyFundMonths,
    debtToIncomeRatio,
    monthlySurplus,
    isEmergencyFundAdequate: emergencyFundMonths >= 6,
    isInvestmentRateOptimal: investmentRate >= 20,
  };
}
