import { getPortfolio } from "@/lib/investments";
import { getFinancialProfile } from "@/lib/profile/profile-engine";
import { getRetirementGapAnalysis } from "@/lib/retirement/gap-intelligence-engine";
import {
  getBehaviourProfile,
  getRecoverySummary,
} from "@/lib/behaviour-engine";

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

export function getCFOInsight(): CFOInsight {
  const retirement = getRetirementGapAnalysis();
  const profile = getFinancialProfile();
  const portfolio = getPortfolio();

  // =========================================
  // BEHAVIOUR / RECOVERY INTELLIGENCE
  // =========================================

  const behaviourProfile = getBehaviourProfile();
  const recovery = getRecoverySummary(behaviourProfile);

  const currentStreak = recovery.currentStreak;
  const relapseCount = recovery.relapseCount;

  /*
   * Behavioural protection is the highest priority during
   * active recovery from F&O trading.
   *
   * We deliberately keep this independent from decision-engine.ts
   * to avoid a circular dependency:
   *
   * decision-engine -> cfo-engine
   *
   * Therefore cfo-engine must NOT import decision-engine.
   */

  const activeRecoveryRisk =
    relapseCount > 0 && currentStreak < 30;

  const recentBehaviouralRelapse =
    relapseCount > 0 && currentStreak < 14;

  // =========================================
  // EMERGENCY FUND
  // =========================================

  const emergencyFundAsset = portfolio.find(
    (item) =>
      item.type === "Asset" &&
      item.name === "Emergency Fund"
  );

  const emergencyFundValue =
    emergencyFundAsset?.currentValue ?? 0;

  const emergencyFundTarget =
    Math.max(profile.assets.emergencyFund, 0);

  const emergencyFundCoverage =
    emergencyFundTarget > 0
      ? emergencyFundValue / emergencyFundTarget
      : 0;

  const emergencyFundBelowTarget =
    emergencyFundTarget > 0 &&
    emergencyFundCoverage < 1;

  // =========================================
  // HOME LOAN
  // =========================================

  const homeLoan = portfolio.find(
    (item) =>
      item.type === "Liability" &&
      item.name === "Home Loan"
  );

  const homeLoanOutstanding =
    homeLoan?.currentValue ?? 0;

  const hasHomeLoan =
    homeLoanOutstanding > 0;

  // =========================================
  // RETIREMENT
  // =========================================

  const retirementGapExists =
    retirement.corpusGap > 0;

  // =========================================
  // PRIORITY 1
  // BEHAVIOURAL PROTECTION
  // =========================================

  if (activeRecoveryRisk) {
    const relapseMessage =
      recentBehaviouralRelapse
        ? `A recent F&O relapse has occurred and the current recovery streak is only ${currentStreak} days.`
        : `The current F&O-free recovery streak is ${currentStreak} days.`;

    return {
      status: "CRITICAL",

      headline:
        "Protect the recovery before optimizing wealth",

      primaryIssue:
        `${relapseMessage} Behavioural stability is currently more important than increasing investment intensity.`,

      recommendedAction:
        "Maintain the F&O-free streak and avoid restarting speculative trading. Protect existing savings, investments and emergency reserves. Do not use available cash for trading.",

      financialImpact:
        "Every protected recovery day reduces the risk of another large trading loss and preserves capital that can compound toward FIRE54.",
    };
  }

  // =========================================
  // PRIORITY 2
  // EMERGENCY FUND + DEBT
  // =========================================

  if (
    emergencyFundBelowTarget ||
    hasHomeLoan
  ) {
    const issueParts: string[] = [];

    if (emergencyFundBelowTarget) {
      issueParts.push(
        `Emergency fund is at ${Math.round(
          emergencyFundCoverage * 100
        )}% of the required reserve.`
      );
    }

    if (hasHomeLoan) {
      issueParts.push(
        `Home loan remains outstanding at ₹${formatINR(
          homeLoanOutstanding
        )}.`
      );
    }

    return {
      status: "NEEDS_ATTENTION",

      headline:
        "Financial safety and debt reduction are the priority",

      primaryIssue:
        issueParts.join(" "),

      recommendedAction:
        hasHomeLoan
          ? "Continue planned home loan prepayment. After loan closure, redirect the freed cash flow into long-term equity SIPs."
          : "Complete the emergency reserve before increasing investment risk.",

      financialImpact:
        "Strengthening liquidity and reducing debt creates a safer financial base and increases future investment capacity.",
    };
  }

  // =========================================
  // PRIORITY 3
  // RETIREMENT GAP
  // =========================================

  if (retirementGapExists) {
    const gapValue =
      Math.max(retirement.corpusGap, 0);

    return {
      status: "NEEDS_ATTENTION",

      headline:
        "Retirement gap exists, but the long-term strategy remains achievable",

      primaryIssue:
        `Projected retirement corpus is still ₹${formatINR(
          gapValue
        )} short of the required FIRE54 target.`,

      recommendedAction:
        `Increase long-term investments by approximately ₹${formatINR(
          retirement.additionalMonthlyInvestmentNeeded
        )} per month if cash flow allows. Continue avoiding speculative trading.`,

      financialImpact:
        "Increasing systematic long-term investment while avoiding trading losses allows more of your existing income to compound toward the FIRE54 target.",
    };
  }

  // =========================================
  // PRIORITY 4
  // WEALTH ACCELERATION
  // =========================================

  return {
    status: "EXCELLENT",

    headline:
      "Your financial strategy is on track",

    primaryIssue:
      "No major behavioural, liquidity, debt or retirement gaps are currently visible.",

    recommendedAction:
      "Maintain your F&O-free discipline, continue systematic investing and gradually increase long-term equity contributions as income permits.",

    financialImpact:
      "Consistent investing without speculative trading gives your existing capital the best opportunity to compound toward FIRE54.",
  };
}