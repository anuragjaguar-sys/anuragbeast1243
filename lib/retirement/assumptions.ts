import { DEFAULT_MACRO_ASSUMPTIONS } from '../core/assumptions';

export interface RetirementAssumptions {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  inflationRate: number;
  preRetirementReturn: number;
  postRetirementReturn: number;
  safeWithdrawalRate: number;
  [key: string]: any;
}

export const DEFAULT_RETIREMENT_ASSUMPTIONS: RetirementAssumptions = {
  currentAge: 32,
  retirementAge: DEFAULT_MACRO_ASSUMPTIONS.retirementAgeDefault,
  lifeExpectancy: DEFAULT_MACRO_ASSUMPTIONS.lifeExpectancyAge,
  inflationRate: DEFAULT_MACRO_ASSUMPTIONS.inflationRate,
  preRetirementReturn: DEFAULT_MACRO_ASSUMPTIONS.equityReturnRate,
  postRetirementReturn: DEFAULT_MACRO_ASSUMPTIONS.debtReturnRate,
  safeWithdrawalRate: DEFAULT_MACRO_ASSUMPTIONS.safeWithdrawalRate,
};