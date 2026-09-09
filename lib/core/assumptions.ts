export interface MacroAssumptions {
  inflationRate: number;              // e.g. 0.06 for 6%
  equityReturnRate: number;           // e.g. 0.12 for 12%
  debtReturnRate: number;             // e.g. 0.07 for 7%
  realEstateReturnRate: number;       // e.g. 0.08 for 8%
  goldReturnRate: number;             // e.g. 0.08 for 8%
  cashReturnRate: number;             // e.g. 0.04 for 4%
  safeWithdrawalRate: number;         // e.g. 0.04 for 4%
  lifeExpectancyAge: number;          // e.g. 85
  retirementAgeDefault: number;       // e.g. 54
}

export const DEFAULT_MACRO_ASSUMPTIONS: MacroAssumptions = {
  inflationRate: 0.06,
  equityReturnRate: 0.12,
  debtReturnRate: 0.07,
  realEstateReturnRate: 0.08,
  goldReturnRate: 0.08,
  cashReturnRate: 0.04,
  safeWithdrawalRate: 0.04,
  lifeExpectancyAge: 85,
  retirementAgeDefault: 54,
};

export type AssetClassKey = 'equity' | 'debt' | 'realEstate' | 'gold' | 'cash';

export const ASSET_CLASS_RETURNS: Record<AssetClassKey, number> = {
  equity: DEFAULT_MACRO_ASSUMPTIONS.equityReturnRate,
  debt: DEFAULT_MACRO_ASSUMPTIONS.debtReturnRate,
  realEstate: DEFAULT_MACRO_ASSUMPTIONS.realEstateReturnRate,
  gold: DEFAULT_MACRO_ASSUMPTIONS.goldReturnRate,
  cash: DEFAULT_MACRO_ASSUMPTIONS.cashReturnRate,
};
