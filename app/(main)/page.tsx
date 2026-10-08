"use client";

import Link from "next/link";
import { buildDashboardViewModel } from "@/lib/dashboard/dashboard-view-model";
import type { DashboardViewModel } from "@/lib/dashboard/dashboard.types";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { loadMonthlyReview, migrateToNewFormat } from "@/lib/storage";
import {
  formatINR,
  getFinancialMetrics,
  getAICFOInsights,
  calculateFinancialHealthScore,
} from "@/lib/financial-engine";
import { 
  getPortfolio, 
  getAssets, 
  getLiabilities, 
  runPortfolioMigration,
  getPortfolioSummary,
  getPortfolioInsights,
  getMonthlyInvestment,
  getMonthlyEMI,
  getTotalLiabilities,
} from "@/lib/investments";
import { simulateLoanSchedule } from "@/lib/loans/loan-engine";
import { getWealthMetrics } from "@/lib/wealth/wealth-engine";
import { 
  getRetirementProjection, 
  generateRetirementScenarios,
  DEFAULT_RETIREMENT_ASSUMPTIONS 
} from "@/lib/retirement/retirement-engine";
import { getGoals } from "@/lib/goals";

// Intelligence Engines
import { getCFOInsight } from "@/lib/intelligence/cfo-engine";
import { getDecisionPlan } from "@/lib/intelligence/decision-engine";
import { generateActions, getTopPriorityAction } from "@/lib/intelligence/action-engine";
import { getMonthlyCFOReview } from "@/lib/intelligence/monthly-cfo-engine";

// Components
import DebtOptimizerCard from "@/components/household/DebtOptimizerCard";
import ScenarioStressTestCard from "@/components/dashboard/ScenarioStressTestCard";
import LifeEventSimulatorCard from "@/components/dashboard/LifeEventSimulatorCard";
import FinancialDisciplineCard from "@/components/dashboard/FinancialDisciplineCard";
import RetirementCard from "@/components/dashboard/RetirementCard";
import CFOExecutivePlaybookCard from "@/components/dashboard/CFOExecutivePlaybookCard";
import RetirementGrowthChart from "@/components/dashboard/RetirementGrowthChart";
import NetWorthCard from "@/components/dashboard/NetWorthCard";
import CapitalDeploymentModal from "@/components/dashboard/CapitalDeploymentModal";
import AthenaCFOCard from "@/components/dashboard/AthenaCFOCard";
import AthenaActionCard from "@/components/dashboard/AthenaActionCard";
import AthenaMonthlyReviewCard from "@/components/dashboard/AthenaMonthlyReviewCard";

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const accentRing: Record<string, string> = {
  emerald: "from-emerald-500/20 to-transparent border-emerald-500/20",
  blue: "from-blue-500/20 to-transparent border-blue-500/20",
  violet: "from-violet-500/20 to-transparent border-violet-500/20",
  amber: "from-amber-500/20 to-transparent border-amber-500/20",
  cyan: "from-cyan-500/20 to-transparent border-cyan-500/20",
};

const accentText: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
};

function UpArrow() {
  return (
    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`h-5 w-5 text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-400" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function Home() {
  const today = formatTodayDate();
  const { profile, isLoading: isProfileLoading } = useProfile();
  
  const [metrics, setMetrics] = useState<ReturnType<typeof getFinancialMetrics> | null>(null);
  const [goals, setGoals] = useState<ReturnType<typeof getGoals>>([]);
  const [_aicfoInsights, _setAicfoInsights] = useState<ReturnType<typeof getAICFOInsights> | null>(null);
  const [hasData, setHasData] = useState(false);

  // Dumb Component States
  const [wealthData, setWealthData] = useState<any>(null);
  const [retirementScenarios, setRetirementScenarios] = useState<any>(null);
  const [_portfolioData, _setPortfolioData] = useState<any>(null);
  const [_healthData, _setHealthData] = useState<any>(null);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [cfoData, setCfoData] = useState<any>(null);
  const [actionData, setActionData] = useState<any>(null);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [_commandData, _setCommandData] = useState<any>(null);
  const [monthlyReviewData, setMonthlyReviewData] = useState<any>(null);

  // Collapsible Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    financialPosition: false,
    debtOptimizer: false,
    stressTest: false,
    discipline: false,
    goalsReview: false,
    healthIntelligence: false,
    commandCenter: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    migrateToNewFormat();
    runPortfolioMigration();

    const loadData = () => {
      const review = loadMonthlyReview();
      const financialMetrics = getFinancialMetrics();
      const canonicalPortfolio = getPortfolio();
      setPortfolioItems(canonicalPortfolio);

      if (financialMetrics) {
        setMetrics(financialMetrics);

        // 1. Calculate Wealth Data
        const assets = getAssets(canonicalPortfolio);
        const liabilities = getLiabilities(canonicalPortfolio);
        const wealthMetrics = getWealthMetrics();
        setWealthData({ metrics: wealthMetrics, assets, liabilities });

        // 2. Calculate Portfolio Data
        const summary = getPortfolioSummary(canonicalPortfolio);
        const insights = getPortfolioInsights(canonicalPortfolio);
        _setPortfolioData({ summary, insights });

        // 3. Calculate Health Data
        const emergencyAsset = canonicalPortfolio.find(
          (item) => item.type === "Asset" && item.name === "Emergency Fund"
        );
        const emergencyCurrent = emergencyAsset?.currentValue ?? 0;
        const emergencyProgress = Math.min(Math.round((emergencyCurrent / 600000) * 100), 100);
        
        let score = null;
        if (review) {
          try { score = calculateFinancialHealthScore(review); } catch {}
        }
        if (score === null && financialMetrics) {
          const proxy = Math.round(
            (financialMetrics.savingsRate * 1.5 + financialMetrics.investmentRate * 1.2 + emergencyProgress * 1.0) / 3
          );
          score = Math.min(Math.max(proxy, 0), 100);
        }
        
        _setHealthData({
          score,
          emergencyProgress,
          fireProgress: financialMetrics.financialIndependenceProgress,
          netWorth: financialMetrics.netWorth,
          financialAssets: financialMetrics.financialAssets,
        });

        // 4. Monthly MoM Review Math
        try {
          const rawStorage = localStorage.getItem("fire54_monthly_reviews") || localStorage.getItem("fire54-monthly-reviews");
          let currentReview = review || { month: "August 2026", income: { salary: 250000 }, cashAllocation: { investments: 60000 } };
          let previousReview = { month: "July 2026", income: { salary: 250000 }, cashAllocation: { investments: 50000 } };

          if (rawStorage) {
            const parsed = JSON.parse(rawStorage);
            if (Array.isArray(parsed) && parsed.length >= 2) {
              currentReview = parsed[parsed.length - 1];
              previousReview = parsed[parsed.length - 2];
            } else if (Array.isArray(parsed) && parsed.length === 1) {
              currentReview = parsed[0];
            }
          }

          const currSalary = Number((currentReview as any)?.income?.salaryInHand || (currentReview as any)?.income?.salary || (currentReview as any)?.income || 250000);
          const currInvested = Number((currentReview as any)?.cashAllocation?.investments || (currentReview as any)?.investments || 60000);
          const currentInvRate = currSalary > 0 ? Number(((currInvested / currSalary) * 100).toFixed(1)) : 0;

          const prevSalary = Number((previousReview as any)?.income?.salaryInHand || (previousReview as any)?.income?.salary || (previousReview as any)?.income || 250000);
          const prevInvested = Number((previousReview as any)?.cashAllocation?.investments || (previousReview as any)?.investments || 50000);
          const prevInvRate = prevSalary > 0 ? Number(((prevInvested / prevSalary) * 100).toFixed(1)) : 0;
          const calculatedRateDelta = Number((currentInvRate - prevInvRate).toFixed(1));
          
          setMonthlyReviewData({
            currentMonth: currentReview?.month || "Current",
            currentInvRate,
            currentInvested: currInvested,
            prevMonth: previousReview?.month || "Prior",
            prevInvRate,
            prevInvested: prevInvested,
            rateDelta: calculatedRateDelta,
          });
        } catch {}
        
        setGoals(getGoals());
        setHasData(true);
      } else {
        setHasData(false);
      }
    };

    loadData();

    // Listen for cross-device sync updates
    const handleRemoteUpdate = () => {
      loadData();
    };
    window.addEventListener("fire54_remote_data_updated", handleRemoteUpdate);
    window.addEventListener("storage", handleRemoteUpdate);

    return () => {
      window.removeEventListener("fire54_remote_data_updated", handleRemoteUpdate);
      window.removeEventListener("storage", handleRemoteUpdate);
    };
  }, []);

  // Compute AI Intel and Scenarios once Profile is ready
  useEffect(() => {
    if (profile && hasData && metrics) {
      const canonicalPortfolio = getPortfolio();
      setPortfolioItems(canonicalPortfolio);

      const retirementInputs: any = {
        ...DEFAULT_RETIREMENT_ASSUMPTIONS,
        currentAge: (profile as any)?.age || (profile as any)?.currentAge || DEFAULT_RETIREMENT_ASSUMPTIONS.currentAge,
        retirementAge: (profile as any)?.retirementAge || DEFAULT_RETIREMENT_ASSUMPTIONS.retirementAge,
        currentCorpus: metrics.financialAssets || 0,
        monthlyExpenses: (profile as any)?.monthlyExpenses || 50000,
        desiredMonthlyIncome: (profile as any)?.desiredMonthlyIncome || 50000,
        monthlyInvestment: metrics.investmentRate ? (metrics.netWorth * 0.05) : 20000,
      };

      const scenarios = generateRetirementScenarios(retirementInputs);
      setRetirementScenarios(scenarios);

      // AI CFO Insights
      const insight = getCFOInsight(profile);
      setCfoData(insight);

      // Decision and Actions
      const plan = getDecisionPlan(profile, canonicalPortfolio);
      const actions = generateActions(plan);
      const topAction = getTopPriorityAction(actions);
      setActionData({ actions, topAction });

      // Monthly Review Card Engine
      const monthlyCFOReview = getMonthlyCFOReview(profile);

      // Command Center Data
      _setCommandData({
        netWorth: metrics.netWorth,
        savings: metrics.savingsRate ?? 0,
        investments: metrics.investmentRate ?? 0,
        emergency: metrics.emergencyFundProgress ?? 0,
        review: monthlyCFOReview,
        topAction: topAction,
        cfo: insight,
      });
    }
  }, [profile, hasData, metrics]);

  // ==========================================
  // DYNAMIC KPI CALCULATIONS
  // ==========================================

  // 1. Calculate true salary from profile or monthly review
  const latestReview = loadMonthlyReview();
  const actualSalary =
    Number(profile?.income?.monthlySalary) ||
    Number((monthlyReviewData as any)?.currentSalary) ||
    Number(latestReview?.income?.salaryInHand) ||
    Number(latestReview?.income?.salary) ||
    150000;

  // 2. Identify active liabilities from canonical portfolio
  const canonicalPortfolio = getPortfolio();
  const liabilities = getLiabilities(canonicalPortfolio);
  const totalDebt = getTotalLiabilities(canonicalPortfolio);
  const homeLoan = liabilities.find(
    (item) => item.category === "Home Loan" || item.name.toLowerCase().includes("home") || item.name.toLowerCase().includes("loan")
  );
  const homeLoanBalance = Number(homeLoan?.currentValue ?? homeLoan?.outstandingAmount ?? 0);

  // 3. Prepayment recorded this month from the monthly financial statement
  const monthlyPrepaymentThisMonth = Number(latestReview?.cashAllocation?.homeLoanPrepayment || 0);

  // 4. Calculate monthly SIPs and EMIs
  const portfolioMonthlySIP = getMonthlyInvestment(canonicalPortfolio);
  const portfolioMonthlyEMI = getMonthlyEMI(canonicalPortfolio);
  const reviewSIP = Number(latestReview?.cashAllocation?.investments || 0);
  const profileSIP = Number(profile?.income?.monthlyInvestment || 0);
  const profilePrepay = Number(profile?.income?.monthlyLoanPrepayment || 0);
  const profileEmergency = Number(profile?.income?.monthlyEmergencySavings || 0);

  const activeSIP = Math.max(portfolioMonthlySIP, reviewSIP, profileSIP);
  const activeEMI = portfolioMonthlyEMI > 0 ? portfolioMonthlyEMI : (homeLoanBalance > 0 ? 25000 : 0);
  const effectivePrepay = monthlyPrepaymentThisMonth > 0 ? monthlyPrepaymentThisMonth : profilePrepay;

  // Capital Deployment: sum of SIPs + regular EMIs + prepayments + emergency savings
  const totalMonthlyDeployed = activeSIP + (totalDebt > 0 ? activeEMI + effectivePrepay : 0) + profileEmergency;
  const deploymentRate = actualSalary > 0
    ? Math.min(100, Math.round((totalMonthlyDeployed / actualSalary) * 100))
    : (totalMonthlyDeployed > 0 ? 100 : 0);

  // 5. Dynamic Debt Payoff Horizon calculation
  const currentAge = Number(profile?.personal?.currentAge) || 32;
  let debtHorizonValue = "Debt Free 🎉";
  let debtHorizonSubtext = "0 active liabilities";
  let debtAccent: "emerald" | "blue" | "violet" | "amber" | "cyan" = "emerald";

  const effectiveDebt = homeLoanBalance > 0 ? homeLoanBalance : totalDebt;

  if (effectiveDebt > 0) {
    const interestRate = Number(homeLoan?.interestRate) || 8.5;
    const defaultTenure = Number(homeLoan?.remainingMonths) || Math.max(24, Math.ceil(effectiveDebt / (activeEMI || 25000)));

    // Simulate amortisation with this month's prepayment pace
    const simResult = simulateLoanSchedule(
      effectiveDebt,
      interestRate,
      defaultTenure,
      effectivePrepay
    );

    const yearsRemaining = Number((simResult.totalMonths / 12).toFixed(1));
    const debtFreeAge = Number((currentAge + yearsRemaining).toFixed(1));

    debtHorizonValue = `${yearsRemaining} Yrs`;
    if (effectivePrepay > 0) {
      debtHorizonSubtext = `With ${formatINR(effectivePrepay)} prepay (Age ${debtFreeAge})`;
    } else {
      debtHorizonSubtext = `Debt-free at Age ${debtFreeAge}`;
    }
    debtAccent = "blue";
  }

  const viewModel: DashboardViewModel = buildDashboardViewModel({
    profile: profile as any,
    portfolio: canonicalPortfolio,
    disciplineScore: metrics?.fire54Score ?? 70,
  });

  const kpiCards = metrics
    ? [
        { 
          label: "Net Worth", 
          value: formatINR(viewModel.netWorth.current || metrics.netWorth), 
          accent: "emerald" as const, 
          trend: "up" as const, 
          subtext: "Total assets net of liabilities" 
        },
        { 
          label: "Capital Deployment", 
          value: `${deploymentRate}%`, 
          accent: "blue" as const, 
          subtext: totalMonthlyDeployed > 0 ? `${formatINR(totalMonthlyDeployed)}/mo deployed` : "Monthly inflow into wealth & debt" 
        },
        { 
          label: "Debt Payoff Horizon", 
          value: debtHorizonValue, 
          accent: debtAccent, 
          subtext: debtHorizonSubtext 
        },
        { 
          label: "FIRE Readiness", 
          value: `${viewModel.disciplineScore}/100`, 
          accent: "amber" as const, 
          subtext: metrics.fire54Score >= 80 ? "Target secured" : "Accelerating trajectory" 
        },
      ]
    : [];

  if (isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0c] font-sans text-zinc-400">
        Initializing Command Center...
      </div>
    );
  }

  if (!hasData || !wealthData) {
    return (
      <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100 p-12 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">No financial data available yet</h2>
        <p className="text-zinc-400 mb-6">Complete your Monthly Entry to see your dashboard come to life.</p>
        <Link href="/financial-statement" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white">Go to Financial Statement</Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100 selection:bg-emerald-500/30">
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        
        {/* Header */}
        <header className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-800/60 pb-6">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <span className="font-mono text-sm font-bold text-black">54</span>
              </div>
              <p className="font-mono text-xs tracking-[0.3em] text-emerald-500/80 uppercase">Command Center OS</p>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              FIRE<span className="text-emerald-400">54</span>
            </h1>
            <p className="mt-1 text-base text-zinc-400">Personal Wealth Management System</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 px-5 py-3 shadow-inner">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">As of today</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-300">{today}</p>
          </div>
        </header>

        {/* TIER 1: COMMAND BAR */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              card.label === "Net Worth" ? (
                <NetWorthCard 
                  key={card.label} 
                  metrics={wealthData.metrics} 
                  assets={wealthData.assets} 
                  liabilities={wealthData.liabilities} 
                />
              ) : card.label === "Capital Deployment" ? (
                <button
                  key={card.label}
                  onClick={() => setIsCapitalModalOpen(true)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-5 text-left transition-all hover:border-blue-500/50 hover:bg-zinc-900/60 shadow-inner"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 group-hover:text-blue-400 transition-colors">
                      {card.label}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 group-hover:text-blue-400 transition-colors">
                      View Graph ↗
                    </span>
                  </div>
                  <div className="my-2">
                    <span className="font-mono text-3xl font-semibold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                      {card.value}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {card.subtext}
                  </span>
                </button>
              ) : card.label === "Debt Payoff Horizon" ? (
                <Link
                  key={card.label}
                  href="/portfolio"
                  className={`rounded-2xl border bg-gradient-to-br ${accentRing[card.accent] || accentRing.blue} border-zinc-800/60 p-5 shadow-lg block transition hover:border-blue-500/50 hover:bg-zinc-900/60`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">{card.label}</p>
                    <span className="text-[10px] font-mono text-zinc-500 hover:text-blue-400">Portfolio →</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-2xl font-bold text-white font-mono">{card.value}</p>
                  </div>
                  <p className={`mt-2 text-xs ${accentText[card.accent] || accentText.blue}`}>{card.subtext}</p>
                </Link>
              ) : (
                <div key={card.label} className={`rounded-2xl border bg-gradient-to-br ${accentRing[card.accent]} border-zinc-800/60 p-5 shadow-lg`}>
                  <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">{card.label}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-2xl font-bold text-white font-mono">{card.value}</p>
                    {card.accent === "emerald" && <UpArrow />}
                  </div>
                  <p className={`mt-2 text-xs ${accentText[card.accent]}`}>{card.subtext}</p>
                </div>
              )
            ))}
          </div>
        </section>

        {/* Capital Deployment Velocity Modal */}
        <CapitalDeploymentModal
          isOpen={isCapitalModalOpen}
          onClose={() => setIsCapitalModalOpen(false)}
          profileSalary={actualSalary || 150000}
          profileSIP={activeSIP}
          profilePrepay={activeEMI + effectivePrepay}
          profileEmergency={profileEmergency}
        />

        {/* STRATEGIC ADVISORY: EXECUTIVE CFO PLAYBOOK */}
        <section className="mb-8">
          <CFOExecutivePlaybookCard statement={monthlyReviewData} />
        </section>

        {/* TIER 2: CORE WEALTH ENGINES */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RetirementCard scenarios={retirementScenarios} />
          </div>
        </section>

        {/* DIRECT PLACEMENT: RETIREMENT GROWTH CHART & LIFE-EVENT MODELER */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RetirementGrowthChart />
            <LifeEventSimulatorCard />
          </div>
        </section>

        {/* TIER 3: EXPANDABLE INTELLIGENCE TABS */}
        <div className="space-y-4 mt-6">

          {/* 2. Debt vs Investing Optimizer */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("debtOptimizer")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">How do I leverage debt?</span>
                <h3 className="text-lg font-semibold text-white">Debt Payoff vs. Investing Optimizer</h3>
              </div>
              <ChevronIcon isOpen={openSections.debtOptimizer} />
            </button>
            {openSections.debtOptimizer && (
              <div className="p-6 border-t border-zinc-800/60">
                <DebtOptimizerCard />
              </div>
            )}
          </div>

          {/* 3. Scenario Stress Testing */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("stressTest")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">Can my plan survive a shock?</span>
                <h3 className="text-lg font-semibold text-white">Scenario Stress Testing</h3>
              </div>
              <ChevronIcon isOpen={openSections.stressTest} />
            </button>
            {openSections.stressTest && (
              <div className="p-6 border-t border-zinc-800/60">
                <ScenarioStressTestCard />
              </div>
            )}
          </div>

          {/* 4. Financial Discipline & Behavior */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("discipline")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">How disciplined is my execution?</span>
                <h3 className="text-lg font-semibold text-white">Financial Discipline & Execution Score</h3>
              </div>
              <ChevronIcon isOpen={openSections.discipline} />
            </button>
            {openSections.discipline && (
              <div className="p-6 border-t border-zinc-800/60">
                <FinancialDisciplineCard />
              </div>
            )}
          </div>

        </div>

        {/* Bottom Monthly Review */}
        <div className="mt-8 space-y-6">
          {monthlyReviewData && <AthenaMonthlyReviewCard reviewData={monthlyReviewData} />}
          {cfoData && <AthenaCFOCard insight={cfoData} />}
          {actionData && <AthenaActionCard actions={actionData.actions} topAction={actionData.topAction} />}
        </div>

      </main>
    </div>
  );
}
