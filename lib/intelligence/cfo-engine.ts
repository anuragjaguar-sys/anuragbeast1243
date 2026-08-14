import { getPortfolio } from "@/lib/investments";
import { getFinancialProfile } from "@/lib/profile/profile-engine";
import { getRetirementGapAnalysis } from "@/lib/retirement/gap-intelligence-engine";

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

  const emergencyFundAsset = portfolio.find(
    (item) => item.type === "Asset" && item.name === "Emergency Fund"
  );
  const emergencyFundValue = emergencyFundAsset?.currentValue ?? 0;
  const emergencyFundTarget = Math.max(profile.assets.emergencyFund, 0);
  const emergencyFundCoverage =
    emergencyFundTarget > 0 ? emergencyFundValue / emergencyFundTarget : 0;

  const homeLoan = portfolio.find(
    (item) => item.type === "Liability" && item.name === "Home Loan"
  );
  const homeLoanOutstanding = homeLoan?.currentValue ?? 0;

  const emergencyFundBelowTarget =
    emergencyFundTarget > 0 && emergencyFundCoverage < 1;
  const hasHomeLoan = homeLoanOutstanding > 0;
  const retirementGapExists = retirement.corpusGap > 0;

  if (emergencyFundBelowTarget || hasHomeLoan) {
    const issueParts: string[] = [];

    if (emergencyFundBelowTarget) {
      issueParts.push(
        `Emergency fund is below target at ${Math.round(
          emergencyFundCoverage * 100
        )}% of the required reserve.`
      );
    }

    if (hasHomeLoan) {
      issueParts.push(
        `Home loan remains outstanding at ₹${formatINR(homeLoanOutstanding)}.`
      );
    }

    return {
      status: "NEEDS_ATTENTION",
      headline: "Financial safety and debt reduction are the priority",
      primaryIssue: issueParts.join(" "),
      recommendedAction:
        "Continue planned home loan prepayment. After loan closure redirect freed cash flow into equity SIP.",
      financialImpact:
        "This phase protects liquidity and accelerates debt reduction before increasing retirement intensity.",
    };
  }

  if (retirementGapExists) {
    const gapValue = Math.max(retirement.corpusGap, 0);

    return {
      status: "NEEDS_ATTENTION",
      headline: "Retirement gap exists, but the strategy should continue through debt reduction first",
      primaryIssue: `Projected retirement corpus is still ₹${formatINR(
        gapValue
      )} short of the required FIRE54 target.`,
      recommendedAction:
        "Retirement gap exists, but current strategy should continue through debt reduction. Continue planned home loan prepayment. After loan closure, redirect freed cash flow into equity SIP to close the gap.",
      financialImpact:
        "Debt reduction creates the cash flow needed to accelerate retirement savings without compromising financial safety.",
    };
  }

  return {
    status: "EXCELLENT",
    headline: "Your plan is on track",
    primaryIssue: "No major retirement or liquidity gaps are currently visible.",
    recommendedAction:
      "Keep investing consistently and maintain your current savings pace.",
    financialImpact:
      "Your financial strategy is aligned with long-term FIRE54 progress and stability.",
  };
}
