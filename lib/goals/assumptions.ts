import { DEFAULT_MACRO_ASSUMPTIONS } from '@/lib/core/assumptions';

export interface GoalAssumptions {
  defaultInflationRate: number;
  expectedEquityReturn: number;
  expectedDebtReturn: number;
  bufferFactor: number;
  emergencyFund: {
    targetMonths: number;
  };
  homeLoan: {
    targetOutstanding: number;
  };
  investment: {
    targetMonthlyInvestment: number;
  };
  netWorth: {
    targetNetWorth: number;
  };
}

export const DEFAULT_GOAL_ASSUMPTIONS: GoalAssumptions = {
  defaultInflationRate: DEFAULT_MACRO_ASSUMPTIONS.inflationRate,
  expectedEquityReturn: DEFAULT_MACRO_ASSUMPTIONS.equityReturnRate,
  expectedDebtReturn: DEFAULT_MACRO_ASSUMPTIONS.debtReturnRate,
  bufferFactor: 1.10,
  emergencyFund: {
    targetMonths: 6,
  },
  homeLoan: {
    targetOutstanding: 0,
  },
  investment: {
    targetMonthlyInvestment: 50000,
  },
  netWorth: {
    targetNetWorth: 20000000,
  },
};

export const GOAL_ASSUMPTIONS: GoalAssumptions = DEFAULT_GOAL_ASSUMPTIONS;