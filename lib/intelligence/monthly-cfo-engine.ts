import { loadMonthlyReview } from "@/lib/storage";
import { getFinancialMetrics } from "@/lib/financial-engine";
import { getCFOInsight } from "@/lib/intelligence/cfo-engine";
import { getDecisionPlan } from "@/lib/intelligence/decision-engine";
import type { FinancialProfile } from "@/lib/profile/profile.types";

export type MonthlyCFOReview = {
  month: string;
  overallStatus: "Excellent" | "Good" | "Needs Attention";
  strength: string;
  risk: string;
  investmentScore: number;
  savingScore: number;
  behaviourScore: number;
  recommendation: string;
};

export type MonthlyScoreInput = {
  fire54Score?: number;
  savingsRate?: number;
  investmentRate?: number;
  emergencyFundProgress?: number;
};

export type MonthlyScoresResult = {
  overallStatus: "Excellent" | "Good" | "Needs Attention";
  investmentScore: number;
  savingScore: number;
  behaviourScore: number;
  strength?: string;
  risks: string[];
};

export function calculateMonthlyScores(input: MonthlyScoreInput): MonthlyScoresResult {
  const {
    fire54Score = 0,
    savingsRate = 0,
    investmentRate = 0,
    emergencyFundProgress = 0,
  } = input;

  let overallStatus: MonthlyScoresResult["overallStatus"] = "Needs Attention";
  if (fire54Score >= 80) overallStatus = "Excellent";
  else if (fire54Score >= 60) overallStatus = "Good";

  const risks: string[] = [];
  let strength: string | undefined;

  if (savingsRate >= 50) {
    strength = "Excellent savings discipline";
  } else if (savingsRate >= 30) {
    strength = "Good savings behaviour";
  } else {
    risks.push("Low savings rate");
  }

  let investmentScore = 0;
  if (investmentRate >= 40) {
    investmentScore = 100;
  } else {
    investmentScore = Math.min(100, Math.round((investmentRate / 30) * 90));
  }

  const savingScore = Math.min(100, Math.round((savingsRate / 50) * 100));

  if (emergencyFundProgress < 100) {
    risks.push("Emergency fund incomplete");
  }

  const behaviourScore = Math.min(100, Math.round(savingScore * 0.6 + investmentScore * 0.4));

  return {
    overallStatus,
    investmentScore,
    savingScore,
    behaviourScore,
    strength,
    risks,
  };
}

export function getMonthlyCFOReview(profile: FinancialProfile): MonthlyCFOReview {
  const statement = loadMonthlyReview();
  const metrics = getFinancialMetrics();
  const cfo = getCFOInsight(profile);
  const plan = getDecisionPlan(profile);

  const monthLabel = statement
    ? `${statement.month}/${statement.year}`
    : new Date().toLocaleString("en-IN", { month: "short", year: "numeric" });

  const scoreResults = metrics
    ? calculateMonthlyScores({
        fire54Score: metrics.fire54Score,
        savingsRate: Number(metrics.savingsRate || 0),
        investmentRate: Number(metrics.investmentRate || 0),
        emergencyFundProgress: Number(metrics.emergencyFundProgress || 0),
      })
    : {
        overallStatus: "Needs Attention" as const,
        investmentScore: 0,
        savingScore: 0,
        behaviourScore: 0,
        risks: [],
        strength: undefined,
      };

  const riskList = [...scoreResults.risks];
  let recommendation =
    cfo?.recommendedAction || plan?.nextAction || "Maintain current discipline and review next month.";

  if (statement?.month === 12) {
    riskList.push("January SIP step-up decision due");
    recommendation =
      "January SIP step-up coming: decide whether to increase your mutual-fund SIP by 10%, 15%, or 20%, and record the plan in January.";
  }

  const riskSummary = riskList.length > 0 ? riskList.join("; ") : cfo?.primaryIssue || "No immediate risks identified";

  return {
    month: monthLabel,
    overallStatus: scoreResults.overallStatus,
    strength: scoreResults.strength || cfo?.headline || "Consistent financial tracking",
    risk: riskSummary,
    investmentScore: scoreResults.investmentScore,
    savingScore: scoreResults.savingScore,
    behaviourScore: scoreResults.behaviourScore,
    recommendation,
  };
}
