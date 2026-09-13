import type { DashboardViewModel } from "./dashboard.types";
import type { FinancialProfile } from "@/lib/profile/profile.types";
import type { PortfolioItem } from "@/lib/investments/types";

interface ViewModelParams {
  profile: FinancialProfile | null;
  portfolio: PortfolioItem[] | null;
  disciplineScore?: number;
}

export function buildDashboardViewModel({
  profile,
  portfolio,
  disciplineScore = 70,
}: ViewModelParams): DashboardViewModel {
  const items = portfolio ?? [];

  const totalLiquidAssets = items
    .filter((i) => i.type === "Asset")
    .reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0);

  const totalLiabilities = items
    .filter((i) => i.type === "Liability")
    .reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0);

  const netWorthValue = totalLiquidAssets - totalLiabilities;
  const targetRetirementAge = profile?.personal?.retirementAge ?? 54;
  const currentAge = profile?.personal?.currentAge ?? 30;
  const yearsLeft = Math.max(1, targetRetirementAge - currentAge);

  // IncomeProfile properties check with safe fallback
  const incomeObj = profile?.income as Record<string, unknown> | undefined;
  const monthlyExpenses = Number(incomeObj?.monthlyExpenses ?? incomeObj?.expenses ?? 50000);
  const currentAnnualExpenses = monthlyExpenses * 12;
  const targetCorpus = currentAnnualExpenses * 25; // 4% Rule
  const projectedCorpus = totalLiquidAssets * Math.pow(1 + 0.1, yearsLeft);

  const goalsCount = Array.isArray(profile?.goals)
    ? profile.goals.length
    : profile?.goals ? 1 : 0;

  return {
    netWorth: {
      current: netWorthValue,
      monthlyChange: 0,
      history: [{ date: new Date().toISOString().slice(0, 7), value: netWorthValue }],
    },
    retirement: {
      targetCorpus,
      projectedCorpus,
      readinessPercentage: targetCorpus > 0 ? Math.min(100, Math.round((projectedCorpus / targetCorpus) * 100)) : 0,
      yearsLeft,
      monthlyRequiredSIP: Math.max(0, (targetCorpus - projectedCorpus) / (yearsLeft * 12)),
    },
    disciplineScore,
    activeGoalsCount: goalsCount,
    totalLiquidAssets,
    hasHydrated: true,
  };
}
