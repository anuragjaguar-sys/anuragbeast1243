import { getPortfolio } from "@/lib/investments";
import {
  getBehaviourProfile,
  getRecoverySummary,
} from "@/lib/behaviour-engine";
import { getRetirementGapAnalysis } from "@/lib/retirement/retirement-engine";
import type { FinancialProfile } from "@/lib/profile/profile.types";
import {
  calculateCFOMetrics,
  type CFODeterministicMetrics,
} from "@/lib/intelligence/cfo-metrics";

export type DecisionPlan = {
  phase: string;
  priority: string;
  nextAction: string;
  futureAction: string;
  reason: string;
  confidence: number;
};

export function generateDecisionPlanFromMetrics(
  metrics: CFODeterministicMetrics,
  behaviour: { currentStreak: number; relapseCount: number }
): DecisionPlan {
  const { currentStreak, relapseCount } = behaviour;
  const hasRelapseHistory = relapseCount > 0;

  // 1. Behavioral Protection Phase
  if (hasRelapseHistory && currentStreak < 365) {
    const confidence =
      currentStreak >= 100 ? 90 : currentStreak >= 30 ? 88 : 85;

    return {
      phase: "Behavioural Protection",
      priority: "Protect F&O-Free Recovery",
      nextAction: "Maintain the F&O-free streak and avoid restarting speculative trading.",
      futureAction: "Continue strengthening financial discipline before considering any increase in financial risk.",
      reason: `Current recovery streak is ${currentStreak} days with ${relapseCount} recorded relapse${relapseCount === 1 ? "" : "s"}. Protecting the recovery prevents further trading-related capital destruction.`,
      confidence,
    };
  }

  // 2. Financial Safety / Emergency Reserve Phase
  if (metrics.emergencyFundBelowTarget) {
    const confidence = 85;
    const coveragePercentage = Math.round(metrics.emergencyFundCoverage * 100);

    return {
      phase: "Financial Safety",
      priority: "Build Emergency Reserve",
      nextAction: "Build emergency reserve",
      futureAction: metrics.hasHomeLoan
        ? "After securing emergency reserve, continue focused home loan repayment and then redirect freed cash flow into equity SIPs."
        : "After securing emergency reserve, increase systematic investments into equity SIPs to accelerate wealth creation.",
      reason: `Emergency reserve covers ${coveragePercentage}% of the target (${metrics.rules.emergencyFundMonths} months of expenses). Protect liquidity before taking higher financial risk.`,
      confidence,
    };
  }

  // 3. Debt Reduction Phase
  if (metrics.hasHomeLoan) {
    const confidence = 80;

    return {
      phase: "Debt Reduction",
      priority: "Home Loan Repayment",
      nextAction: "Continue planned home loan repayment",
      futureAction: "Redirect freed cash flow into equity investments after loan closure",
      reason: `Home loan outstanding ₹${Math.round(metrics.homeLoanOutstanding).toLocaleString("en-IN")} reduces cash-flow flexibility (debt ratio: ${metrics.rules.debtToIncomeRatio}% of annual income). Debt reduction increases future investment capacity.`,
      confidence,
    };
  }

  // 4. Retirement Optimization Phase
  if (metrics.retirementGapExists) {
    const confidence = 70;

    return {
      phase: "Retirement Optimisation",
      priority: "Retirement Gap",
      nextAction: "Increase long term investments",
      futureAction: "Model additional SIPs and increase contributions to close the gap.",
      reason: "Current projection requires additional retirement funding",
      confidence,
    };
  }

  // 5. Wealth Acceleration Phase
  return {
    phase: "Wealth Acceleration",
    priority: "Grow Equity Investments",
    nextAction: "Maintain and gradually increase monthly equity SIPs while monitoring asset allocation.",
    futureAction: "Consider targeting higher equity allocation and tax-efficient instruments as your net worth grows.",
    reason: "No immediate safety, debt, or behavioural constraints detected. Focus on consistent investing and diversification.",
    confidence: 75,
  };
}

export function getDecisionPlan(profile: FinancialProfile): DecisionPlan {
  const retirementGap = getRetirementGapAnalysis(profile);
  const portfolio = getPortfolio();

  const behaviourProfile = getBehaviourProfile();
  const recovery = getRecoverySummary(behaviourProfile);

  const metrics = calculateCFOMetrics({
    profile,
    portfolio,
    retirementGap,
    behaviour: {
      currentStreak: recovery.currentStreak,
      relapseCount: recovery.relapseCount,
    },
  });

  return generateDecisionPlanFromMetrics(metrics, {
    currentStreak: recovery.currentStreak,
    relapseCount: recovery.relapseCount,
  });
}
