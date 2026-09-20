import { DEFAULT_MACRO_ASSUMPTIONS } from '../core/assumptions';
import type { RetirementAssumptions } from './types';

export const DEFAULT_RETIREMENT_ASSUMPTIONS: RetirementAssumptions = {
  currentAge: 32,
  retirementAge: DEFAULT_MACRO_ASSUMPTIONS.retirementAgeDefault,
  mutualFunds: 0,
  ppf: 0,
  epf: 0,
  nps: 0,
  emergencyFund: 0,
  cash: 0,
  currentCorpus: 0,
  monthlySalary: 0,
  monthlyInvestment: 0,
  annualSipIncrease: 0.10,
  expectedAnnualIncrement: 0.08,
  equityReturn: DEFAULT_MACRO_ASSUMPTIONS.equityReturnRate,
  equityVolatility: 0.15,
  debtReturn: DEFAULT_MACRO_ASSUMPTIONS.debtReturnRate,
  debtVolatility: 0.05,
  inflationRate: DEFAULT_MACRO_ASSUMPTIONS.inflationRate,
  withdrawalRate: DEFAULT_MACRO_ASSUMPTIONS.safeWithdrawalRate,
  desiredMonthlyIncome: 100000,
  monthlyPension: 0,
};
