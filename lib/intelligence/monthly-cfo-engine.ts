import { loadMonthlyReview } from "@/lib/storage";
import { getFinancialMetrics } from "@/lib/financial-engine";
import { getCFOInsight } from "@/lib/intelligence/cfo-engine";
import { getDecisionPlan } from "@/lib/intelligence/decision-engine";

export interface MonthlyCFOReview {
  month: string;
  overallStatus: "Excellent" | "Good" | "Needs Attention";
  strength: string;
  risk: string;
  investmentScore: number;
  savingScore: number;
  behaviourScore: number;
  recommendation: string;
}

/**
 * Generate a Monthly CFO review by composing existing engines.
 * This engine only reads existing systems and does not persist data.
 */
export function getMonthlyCFOReview(): MonthlyCFOReview {
  const statement = loadMonthlyReview();
  const metrics = getFinancialMetrics();
  const cfo = getCFOInsight();
  const plan = getDecisionPlan();

  const monthLabel = statement ? `${statement.month}/${statement.year}` : new Date().toLocaleString("en-IN", { month: "short", year: "numeric" });

  // Default buckets
  let overallStatus: MonthlyCFOReview["overallStatus"] = "Needs Attention";
  let strength = "";
  let risk = "";
  let investmentScore = 0;
  let savingScore = 0;
  let behaviourScore = 0;

  // Derive overall status from fire54Score when available
  if (metrics) {
    if (metrics.fire54Score >= 80) overallStatus = "Excellent";
    else if (metrics.fire54Score >= 60) overallStatus = "Good";
    else overallStatus = "Needs Attention";

    // Savings analysis
    const savingsRate = Number(metrics.savingsRate || 0);
    if (savingsRate >= 50) {
      strength = "Excellent savings discipline";
    } else if (savingsRate >= 30) {
      strength = "Good savings behaviour";
    }

    if (savingsRate < 30) {
      risk = risk ? `${risk}; Low savings rate` : "Low savings rate";
    }

    // Investment analysis
    const investmentRate = Number(metrics.investmentRate || 0);
    // Scale investmentScore: 0-100 where 30% -> 90, 40%+ -> 100
    if (investmentRate >= 40) investmentScore = 100;
    else investmentScore = Math.min(100, Math.round((investmentRate / 30) * 90));

    // Saving score proportional to savingsRate (scale to 0-100, 50% -> 100)
    savingScore = Math.min(100, Math.round((savingsRate / 50) * 100));

    // Emergency fund check
    const emergency = Number(metrics.emergencyFundProgress || 0);
    if (emergency < 100) {
      risk = risk ? `${risk}; Emergency fund incomplete` : "Emergency fund incomplete";
    }

    // Behaviour score: Use behaviour engine if available. Fallback to a proxy derived from savings/investment discipline.
    // The repo contains a behaviour engine (calculateFinancialDisciplineScore) but it requires behavioural streak input which
    // is not always available here. Use a pragmatic proxy: combine savings + investment rates.
    behaviourScore = Math.min(100, Math.round((savingScore * 0.6 + investmentScore * 0.4)));
  }

  // Retirement guidance — surface CFO & Decision Plan recommendations
  let recommendation = cfo?.recommendedAction || plan?.nextAction || "Maintain current discipline and review next month.";

  return {
    month: monthLabel,
    overallStatus,
    strength: strength || cfo?.headline || "Consistent financial tracking",
    risk: risk || cfo?.primaryIssue || "No immediate risks identified",
    investmentScore,
    savingScore,
    behaviourScore,
    recommendation,
  };
}
