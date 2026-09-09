import { getPortfolio } from "@/lib/investments";
import { getRetirementGapAnalysis } from "@/lib/retirement/gap-intelligence-engine";
import {
  getBehaviourProfile,
  getRecoverySummary,
} from "@/lib/behaviour-engine";
import { FinancialProfile } from "@/lib/profile/profile.types";
import {
  calculateCFOMetrics,
  CFODeterministicMetrics,
} from "@/lib/intelligence/cfo-metrics";

export type CFOStatus =
  | "EXCELLENT"
  | "GOOD"
  | "NEEDS_ATTENTION"
  | "CRITICAL";

export interface CFOInsight {
  status: CFOStatus;
  headline: string;
  primaryIssue: string;
  recommendedAction: string;
  financialImpact: string;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}

export function generateCFOInsightFromMetrics(
  metrics: CFODeterministicMetrics,
  streak: number = 0
): CFOInsight {
  // 1. Behavioral Risk Check
  if (metrics.activeRecoveryRisk) {
    const relapseMessage = metrics.recentBehaviouralRelapse
      ? `A recent F&O relapse has occurred and the current recovery streak is only ${streak} days.`
      : `The current F&O-free recovery streak is ${streak} days.`;

    return {
      status: "CRITICAL",
      headline: "Protect the recovery before optimizing wealth",
      primaryIssue: `${relapseMessage} Behavioural stability is currently more important than increasing investment intensity.`,
      recommendedAction:
        "Maintain the F&O-free streak and avoid restarting speculative trading. Protect existing savings, investments and emergency reserves. Do not use available cash for trading.",
      financialImpact:
        "Every protected recovery day reduces the risk of another large trading loss and preserves capital that can compound toward FIRE54.",
    };
  }

  // 2. Liquidity Reserve & Debt Reduction Check
  if (metrics.emergencyFundBelowTarget || metrics.hasHomeLoan) {
    const issueParts: string[] = [];

    if (metrics.emergencyFundBelowTarget) {
      issueParts.push(
        `Emergency fund is at ${Math.round(metrics.emergencyFundCoverage * 100)}% of the required reserve (${metrics.rules.emergencyFundMonths} months covered).`
      );
    }

    if (metrics.hasHomeLoan) {
      issueParts.push(
        `Home loan remains outstanding at ₹${formatINR(metrics.homeLoanOutstanding)}.`
      );
    }

    return {
      status: "NEEDS_ATTENTION",
      headline: "Financial safety and debt reduction are the priority",
      primaryIssue: issueParts.join(" "),
      recommendedAction: metrics.hasHomeLoan
        ? "Continue planned home loan prepayment. After loan closure, redirect the freed cash flow into long-term equity SIPs."
        : "Complete the emergency reserve before increasing investment risk.",
      financialImpact:
        "Strengthening liquidity and reducing debt creates a safer financial base and increases future investment capacity.",
    };
  }

  // 3. Retirement Gap Check
  if (metrics.retirementGapExists) {
    return {
      status: "NEEDS_ATTENTION",
      headline: "Retirement gap exists, but the long-term strategy remains achievable",
      primaryIssue: `Projected retirement corpus is still ₹${formatINR(metrics.corpusGap)} short of the required FIRE54 target.`,
      recommendedAction: `Increase long-term investments by approximately ₹${formatINR(metrics.additionalMonthlyInvestmentNeeded)} per month if cash flow allows. Continue avoiding speculative trading.`,
      financialImpact:
        "Increasing systematic long-term investment while avoiding trading losses allows more of your existing income to compound toward the FIRE54 target.",
    };
  }

  // 4. Fully On-Track State
  return {
    status: "EXCELLENT",
    headline: "Your financial strategy is on track",
    primaryIssue: "No major behavioural, liquidity, debt or retirement gaps are currently visible.",
    recommendedAction:
      "Maintain your F&O-free discipline, continue systematic investing and gradually increase long-term equity contributions as income permits.",
    financialImpact:
      "Consistent investing without speculative trading gives your existing capital the best opportunity to compound toward FIRE54.",
  };
}

export function getCFOInsight(profile: FinancialProfile): CFOInsight {
  const retirement = getRetirementGapAnalysis(profile);
  const portfolio = getPortfolio();

  const behaviourProfile = getBehaviourProfile();
  const recovery = getRecoverySummary(behaviourProfile);

  const metrics = calculateCFOMetrics({
    profile,
    portfolio,
    retirementGap: retirement,
    behaviour: {
      currentStreak: recovery.currentStreak,
      relapseCount: recovery.relapseCount,
    },
  });

  return generateCFOInsightFromMetrics(metrics, recovery.currentStreak);
}
