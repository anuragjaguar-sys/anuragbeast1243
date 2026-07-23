export interface DashboardData {
  profile: any;
  retirement: any;
  behaviour: any;
  wealth: any;

  kpis: {
    netWorth: number;
    retirementCorpus: number;
    fireReadiness: number;
    wealthScore: number;
  };

  quickInsights: string[];
}