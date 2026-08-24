import { getPortfolio } from "@/lib/investments";
import { getFinancialProfile } from "@/lib/profile/profile-engine";
import {
  getBehaviourProfile,
  getRecoverySummary,
} from "@/lib/behaviour-engine";
import { getCFOInsight } from "@/lib/intelligence/cfo-engine";

export interface DecisionPlan {
  phase: string;
  priority: string;
  nextAction: string;
  futureAction: string;
  reason: string;
  confidence: number; // 0-100
}

export function getDecisionPlan(): DecisionPlan {
  const insight = getCFOInsight();
  const profile = getFinancialProfile();
  const portfolio = getPortfolio();

  // =========================================
  // BEHAVIOUR / RECOVERY INTELLIGENCE
  // =========================================

  const behaviourProfile = getBehaviourProfile();
  const recovery = getRecoverySummary(behaviourProfile);

  const currentStreak = recovery.currentStreak;
  const relapseCount = recovery.relapseCount;
  const hasRelapseHistory = relapseCount > 0;

  // =========================================
  // FINANCIAL SAFETY
  // =========================================

  const emergencyAsset = portfolio.find(
    (p) => p.type === "Asset" && p.name === "Emergency Fund"
  );

  const emergencyValue = emergencyAsset?.currentValue ?? 0;
  const emergencyTarget = Math.max(profile.assets.emergencyFund || 0, 0);

  const emergencyBelow =
    emergencyTarget > 0 && emergencyValue < emergencyTarget;

  // =========================================
  // DEBT
  // =========================================

  const homeLoan = portfolio.find(
    (p) => p.type === "Liability" && p.name === "Home Loan"
  );

  const homeLoanOutstanding = homeLoan?.currentValue ?? 0;
  const hasHomeLoan = homeLoanOutstanding > 0;

  // =========================================
  // RETIREMENT
  // =========================================

  const retirementGapExists = Boolean(
    (insight && /retire/i.test(String(insight.headline || ""))) ||
      String(insight?.primaryIssue || "")
        .toLowerCase()
        .includes("retire")
  );

  // =========================================
  // 1. BEHAVIOURAL PROTECTION
  // =========================================
  //
  // Athena should recognize an active recovery journey.
  // This does NOT override genuine financial emergencies.
  // It simply makes the decision engine aware that
  // protecting the recovery is an important priority.
  //

  if (hasRelapseHistory && currentStreak < 365) {
    const confidence =
      currentStreak >= 100
        ? 90
        : currentStreak >= 30
        ? 88
        : 85;

    return {
      phase: "Behavioural Protection",
      priority: "Protect F&O-Free Recovery",
      nextAction:
        "Maintain the F&O-free streak and avoid restarting speculative trading.",
      futureAction:
        "Continue strengthening financial discipline before considering any increase in financial risk.",
      reason: `Current recovery streak is ${currentStreak} days with ${relapseCount} recorded relapse${
        relapseCount === 1 ? "" : "s"
      }. Protecting the recovery prevents further trading-related capital destruction.`,
      confidence,
    };
  }

  // =========================================
  // 2. FINANCIAL SAFETY
  // =========================================

  if (emergencyBelow) {
    const confidence = 85;

    return {
      phase: "Financial Safety",
      priority: "Build Emergency Reserve",
      nextAction: "Build emergency reserve",
      futureAction: hasHomeLoan
        ? "After securing emergency reserve, continue focused home loan repayment and then redirect freed cash flow into equity SIPs."
        : "After securing emergency reserve, increase systematic investments into equity SIPs to accelerate wealth creation.",
      reason: `Emergency reserve covers ${
        emergencyTarget > 0
          ? Math.round((emergencyValue / emergencyTarget) * 100)
          : 0
      }% of the target. Protect liquidity before taking higher financial risk.`,
      confidence,
    };
  }

  // =========================================
  // 3. DEBT REDUCTION
  // =========================================

  if (hasHomeLoan) {
    const confidence = 80;

    return {
      phase: "Debt Reduction",
      priority: "Home Loan Repayment",
      nextAction: "Continue planned home loan repayment",
      futureAction:
        "Redirect freed cash flow into equity investments after loan closure",
      reason: `Home loan outstanding ₹${Math.round(
        homeLoanOutstanding
      ).toLocaleString(
        "en-IN"
      )} reduces cash-flow flexibility. Debt reduction increases future investment capacity.`,
      confidence,
    };
  }

  // =========================================
  // 4. RETIREMENT OPTIMISATION
  // =========================================

  if (insight && insight.status === "NEEDS_ATTENTION" && retirementGapExists) {
    const confidence = 70;

    return {
      phase: "Retirement Optimisation",
      priority: "Retirement Gap",
      nextAction: "Increase long term investments",
      futureAction:
        "Model additional SIPs and increase contributions to close the gap.",
      reason: "Current projection requires additional retirement funding",
      confidence,
    };
  }

  // =========================================
  // 5. WEALTH ACCELERATION
  // =========================================

  return {
    phase: "Wealth Acceleration",
    priority: "Grow Equity Investments",
    nextAction:
      "Maintain and gradually increase monthly equity SIPs while monitoring asset allocation.",
    futureAction:
      "Consider targeting higher equity allocation and tax-efficient instruments as your net worth grows.",
    reason:
      "No immediate safety, debt, or behavioural constraints detected. Focus on consistent investing and diversification.",
    confidence: 75,
  };
}