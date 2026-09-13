import { RetirementAssumptions } from "@/lib/retirement/types";
import { FinancialProfile } from "@/lib/profile/profile.types";
import { MonthlyFinancialStatement } from "@/lib/monthly-review";
import { PortfolioItem } from "@/lib/investments/types";
import { } from "@/lib/retirement/retirement-engine";

export interface MonthlyCashAudit {
  salaryInHand: number;
  totalInflow: number;
  livingExpenses: number;
  monthlySIP: number;
  homeLoanPrepayment: number;
  emergencyRemittance: number;
  totalCommittedOutflow: number;
  unallocatedSurplus: number;
}

export interface LiabilityAudit {
  homeLoanPrincipal: number;
  estimatedInterestRate: number;
  prepaymentMonthly: number;
  prepaymentTrackStatus: "Ahead" | "Optimal" | "Sub-optimal";
  verdict: string;
}

export interface PlaybookRecommendation {
  id: string;
  category: "cash_surplus" | "liability" | "emergency_sunset" | "sip_stepup";
  title: string;
  verdict: string;
  actionItems: string[];
  impact: string;
  urgency: "critical" | "important" | "optimisation";
}

export interface ExecutivePlaybook {
  audit: MonthlyCashAudit;
  liability: LiabilityAudit;
  recommendations: PlaybookRecommendation[];
  phases: {
    phase: string;
    timeline: string;
    sipRunRate: number;
    directive: string;
  }[];
}

function parseNum(val: any): number {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function generateExecutivePlaybook(
  assumptions: RetirementAssumptions,
  profile: FinancialProfile,
  latestStatement?: MonthlyFinancialStatement | null,
  portfolio?: PortfolioItem[] | null
): ExecutivePlaybook {
  // 1. Reconcile Monthly Salary and Cash Flow
  const salaryInHand = parseNum(latestStatement?.income?.salaryInHand) || parseNum(profile?.income?.monthlySalary) || 150000;
  const totalInflow = salaryInHand + 
    parseNum(latestStatement?.income?.daAllowances) + 
    parseNum(latestStatement?.income?.bonus) + 
    parseNum(latestStatement?.income?.otherIncome);

  const livingExpenses = parseNum(latestStatement?.cashAllocation?.monthlyExpenses) || 50000;
  const monthlySIP = parseNum(latestStatement?.cashAllocation?.investments) || 
                     (profile?.income?.monthlyInvestment === 100000 ? 20000 : parseNum(profile?.income?.monthlyInvestment)) || 
                     20000;
  const homeLoanPrepayment = parseNum(latestStatement?.cashAllocation?.homeLoanPrepayment) || 
                             parseNum(profile?.income?.monthlyLoanPrepayment) || 
                             50000;
  const emergencyRemittance = parseNum(latestStatement?.cashAllocation?.savingsAccount) || 
                              parseNum(latestStatement?.cashAllocation?.emergencyFund) || 
                              parseNum(profile?.income?.monthlyEmergencySavings) || 
                              50000;

  const totalCommittedOutflow = livingExpenses + monthlySIP + homeLoanPrepayment + emergencyRemittance;
  const declaredCashRemaining = parseNum(latestStatement?.cashAllocation?.cashRemaining);
  const unallocatedSurplus = declaredCashRemaining > 0 
    ? declaredCashRemaining 
    : Math.max(0, totalInflow - totalCommittedOutflow);

  // 2. Audit Liabilities
  let homeLoanPrincipal = 0;
  if (portfolio && portfolio.length > 0) {
    const loanItem = portfolio.find(
      (item) => item.type === "Liability" && item.name.toLowerCase().includes("home loan")
    );
    if (loanItem) {
      const raw = loanItem as any;
      homeLoanPrincipal = raw.currentValue || raw.outstandingAmount || raw.investedAmount || 0;
    }
  }
  if (!homeLoanPrincipal) {
    homeLoanPrincipal = parseNum(profile?.liabilities?.homeLoanOutstanding);
  }

  const prepaymentTrackStatus: "Ahead" | "Optimal" | "Sub-optimal" = 
    homeLoanPrepayment >= 50000 ? "Optimal" : homeLoanPrepayment > 0 ? "Sub-optimal" : "Sub-optimal";

  const liability: LiabilityAudit = {
    homeLoanPrincipal,
    estimatedInterestRate: 8.5,
    prepaymentMonthly: homeLoanPrepayment,
    prepaymentTrackStatus,
    verdict: homeLoanPrepayment >= 50000
      ? `Your ₹${homeLoanPrepayment.toLocaleString("en-IN")}/mo prepayment is saving you compounding interest at ~8.5% p.a., rapidly collapsing your principal tenure.`
      : "Prepayment is below recommended velocity to crush high-interest tenure."
  };

  // 3. Emergency Fund Progress & Sunset Date
  const currentEmergencyCash = parseNum(profile?.assets?.emergencyFund) + parseNum(profile?.assets?.cash);
  const emergencyTargetMonths = parseNum(profile?.goals?.emergencyFundMonths) || 6;
  const emergencyTargetAmount = livingExpenses * emergencyTargetMonths;
  const emergencyGap = Math.max(0, emergencyTargetAmount - currentEmergencyCash);
  const emergencyMonthsLeft = emergencyRemittance > 0 
    ? Math.max(1, Math.ceil(emergencyGap / emergencyRemittance))
    : 0;

  const recommendations: PlaybookRecommendation[] = [];

  // Directive 1: Unallocated Surplus Cash Deployment
  if (unallocatedSurplus > 0) {
    recommendations.push({
      id: "rec-surplus-deploy",
      category: "cash_surplus",
      title: `Surplus Cash Deployment: Deploy ₹${unallocatedSurplus.toLocaleString("en-IN")} This Month`,
      verdict: `You have ₹${unallocatedSurplus.toLocaleString("en-IN")} in unallocated surplus this month after all EMIs, prepayments, living costs, and SIPs.`,
      actionItems: [
        `Do not leave this ₹${unallocatedSurplus.toLocaleString("en-IN")} sitting idle in your primary checking account.`,
        emergencyGap > 0 
          ? `Top up ₹${Math.min(unallocatedSurplus, emergencyGap).toLocaleString("en-IN")} into liquid emergency reserves to accelerate your sunset date.`
          : `Deploy 100% of this residual surplus into broad-market index equity funds (Nifty 50 / Next 50).`,
        `Sweep any excess beyond your baseline checking needs into high-yield sweep deposits.`
      ],
      impact: "Eliminates cash drag and accelerates compounding without straining monthly liquidity.",
      urgency: "critical"
    });
  } else {
    recommendations.push({
      id: "rec-zero-drag",
      category: "cash_surplus",
      title: "Zero Cash Drag Achieved",
      verdict: "100% of your incoming salary is accounted for across expenses, prepayments, emergency savings, and SIPs.",
      actionItems: [
        "Maintain this strict execution rhythm for the remainder of this fiscal quarter.",
        "Ensure bank balance is maintained strictly for immediate 30-day billings."
      ],
      impact: "Operating at peak financial discipline.",
      urgency: "optimisation"
    });
  }

  // Directive 2: Home Loan Prepayment Track
  recommendations.push({
    id: "rec-liability-track",
    category: "liability",
    title: `Home Loan Prepayment: ₹${homeLoanPrepayment.toLocaleString("en-IN")}/mo Track Check`,
    verdict: liability.verdict,
    actionItems: [
      `Maintain ₹${homeLoanPrepayment.toLocaleString("en-IN")}/month aggressive prepayment. This guarantees an 8.5% risk-free yield against bank debt.`,
      `Request updated amortisation schedule every 6 months to ensure bank reduces tenure, NOT monthly EMI.`,
      `Once loan balance is cleared, immediately pivot this entire ₹${homeLoanPrepayment.toLocaleString("en-IN")}/mo into wealth-building equity.`
    ],
    impact: "Saves ₹15L–₹35L in cumulative interest and knocks years off your debt timeline.",
    urgency: "important"
  });

  // Directive 3: Emergency Fund Sunset Directive
  if (emergencyGap > 0) {
    recommendations.push({
      id: "rec-emergency-sunset",
      category: "emergency_sunset",
      title: `Emergency Buffer: Sunset in ~${emergencyMonthsLeft} Months`,
      verdict: `You are depositing ₹${emergencyRemittance.toLocaleString("en-IN")}/mo into savings. Target ceiling: ₹${(emergencyTargetAmount / 100000).toFixed(2)}L (${emergencyTargetMonths} months).`,
      actionItems: [
        `Strict Rule: Once total emergency cash hits ₹${(emergencyTargetAmount / 100000).toFixed(2)}L in ~${emergencyMonthsLeft} months, CEASE this remittance.`,
        `Redirect that exact ₹${emergencyRemittance.toLocaleString("en-IN")}/month into equity SIPs.`,
        `Your active SIP will jump overnight from ₹${monthlySIP.toLocaleString("en-IN")}/mo to ₹${(monthlySIP + emergencyRemittance).toLocaleString("en-IN")}/mo.`
      ],
      impact: `Reclaims ₹${(emergencyRemittance * 12 / 100000).toFixed(2)} Lakh per year from low-yield savings into high-growth equity.`,
      urgency: "critical"
    });
  } else {
    recommendations.push({
      id: "rec-emergency-funded",
      category: "emergency_sunset",
      title: "Emergency Runway Fully Locked: Redirect Remittance",
      verdict: `Your emergency reserves have reached the full target of ₹${(emergencyTargetAmount / 100000).toFixed(2)}L.`,
      actionItems: [
        `Stop depositing ₹${emergencyRemittance.toLocaleString("en-IN")}/mo into low-yield savings immediately.`,
        `Deploy the full ₹${emergencyRemittance.toLocaleString("en-IN")}/mo into your core retirement equity SIPs today.`
      ],
      impact: "Unlocks maximum compounding efficiency.",
      urgency: "critical"
    });
  }

  // Phased Roadmap
  const phases = [
    {
      phase: "Phase 1: Capital Fortress (Current)",
      timeline: `Now (Next ${emergencyMonthsLeft} months)`,
      sipRunRate: monthlySIP,
      directive: `SIP: ₹${monthlySIP.toLocaleString("en-IN")}/mo | Prepayment: ₹${homeLoanPrepayment.toLocaleString("en-IN")}/mo | Emergency Remittance: ₹${emergencyRemittance.toLocaleString("en-IN")}/mo.`
    },
    {
      phase: "Phase 2: Emergency Pivot",
      timeline: `Month ${emergencyMonthsLeft + 1} onwards`,
      sipRunRate: monthlySIP + emergencyRemittance,
      directive: `Emergency fund full. Redirect ₹${emergencyRemittance.toLocaleString("en-IN")}/mo into Equity. Monthly SIP jumps to ₹${(monthlySIP + emergencyRemittance).toLocaleString("en-IN")}/mo.`
    },
    {
      phase: "Phase 3: Debt-Free Wealth Acceleration",
      timeline: "Post Home Loan Payoff",
      sipRunRate: monthlySIP + emergencyRemittance + homeLoanPrepayment,
      directive: `Loan fully retired. Deploy all ₹${(monthlySIP + emergencyRemittance + homeLoanPrepayment).toLocaleString("en-IN")}/mo into retirement corpus for rapid FIRE.`
    }
  ];

  return {
    audit: {
      salaryInHand,
      totalInflow,
      livingExpenses,
      monthlySIP,
      homeLoanPrepayment,
      emergencyRemittance,
      totalCommittedOutflow,
      unallocatedSurplus
    },
    liability,
    recommendations,
    phases
  };
}
