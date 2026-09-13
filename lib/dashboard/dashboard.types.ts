export interface NetWorthMetric {
  current: number;
  monthlyChange: number;
  history: Array<{ date: string; value: number }>;
}

export interface RetirementSummaryMetric {
  targetCorpus: number;
  projectedCorpus: number;
  readinessPercentage: number;
  yearsLeft: number;
  monthlyRequiredSIP: number;
}

export interface DashboardViewModel {
  netWorth: NetWorthMetric;
  retirement: RetirementSummaryMetric;
  disciplineScore: number;
  activeGoalsCount: number;
  totalLiquidAssets: number;
  hasHydrated: boolean;
}
