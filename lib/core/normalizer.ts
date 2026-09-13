export interface NormalizedBehaviourProfile {
  reflections: unknown[];
  tradingHistory: unknown[];
  disciplineScore: number;
}

export function normalizeBehaviourProfile(raw: unknown): NormalizedBehaviourProfile {
  const profile = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    ...profile,
    reflections: Array.isArray(profile.reflections) ? profile.reflections : [],
    tradingHistory: Array.isArray(profile.tradingHistory) ? profile.tradingHistory : [],
    disciplineScore: typeof profile.disciplineScore === "number" ? profile.disciplineScore : 70,
  };
}

export function normalizeFinancialStatement(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const stmt = raw as Record<string, unknown>;

  const salary = Number(stmt.monthlySalary ?? stmt.salaryInHand ?? stmt.income ?? 0);
  const expenses = Number(stmt.monthlyExpenses ?? stmt.expenses ?? 0);
  const investments = Number(stmt.monthlyInvestments ?? stmt.investments ?? stmt.sipStepUp ?? 0);

  return {
    ...stmt,
    monthlySalary: salary,
    monthlyExpenses: expenses,
    monthlyInvestments: investments,
    goalContributions: Array.isArray(stmt.goalContributions) ? stmt.goalContributions : [],
  };
}
