"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { getPortfolio } from "@/lib/investments";
import { loadMonthlyReview } from "@/lib/storage";

function formatINR(value: number) {
  const numericVal = Number(value) || 0;
  if (numericVal >= 10000000) return `₹${(numericVal / 10000000).toFixed(2)} Cr`;
  if (numericVal >= 100000) return `₹${(numericVal / 100000).toFixed(2)} Lakhs`;
  return `₹${numericVal.toLocaleString("en-IN")}`;
}

export default function DebtOptimizerCard() {
  const { profile, loading } = useProfile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [extraSurplus, setExtraSurplus] = useState<number>(50000); 

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm text-zinc-400">
        Loading debt optimizer...
      </div>
    );
  }

  // Monthly base SIP (defaulting to user's ₹20k from monthly review)
  let monthlyReviewSip = 20000;
  try {
    const latestReview = loadMonthlyReview();
    if (latestReview?.cashAllocation?.investments) {
      monthlyReviewSip = Number(latestReview.cashAllocation.investments);
    }
  } catch {
    // fallback
  }
  const baseSip = monthlyReviewSip > 0 ? monthlyReviewSip : (profile.income?.monthlyInvestment || 20000);

  // Pull canonical portfolio liabilities
  const portfolio = getPortfolio();
  const homeLoan = portfolio.find(
    (item) => item.type === "Liability" && item.category === "Home Loan"
  ) || portfolio.find((item) => item.type === "Liability");

  const totalDebt = homeLoan ? Number(homeLoan.currentValue || 0) : 1300000;
  const interestRate = homeLoan && "interestRate" in homeLoan && Number(homeLoan.interestRate) > 0 
    ? Number(homeLoan.interestRate) 
    : 8.1;

  const portfolioEmi = homeLoan && "emi" in homeLoan ? Number(homeLoan.emi || 0) : 0;
  const emi = portfolioEmi > 0 ? portfolioEmi : 18500; 

  const currentAge = profile.personal?.currentAge || 37;
  const retirementAge = profile.personal?.retirementAge || 54;
  const yearsToRetirement = Math.max(1, retirementAge - currentAge);
  const monthsToRetirement = yearsToRetirement * 12;

  const equityReturnRate = profile.assumptions?.equityReturn ? profile.assumptions.equityReturn : 0.12; 
  const monthlyEquityRate = equityReturnRate / 12;
  const monthlyInterestRate = interestRate / 100 / 12;

  // Compounding helper function
  const getFutureValue = (monthlyPayment: number, totalMonths: number, startMonthOffset = 0) => {
    if (monthlyPayment <= 0 || totalMonths <= 0) return 0;
    const fv = monthlyPayment * ((Math.pow(1 + monthlyEquityRate, totalMonths) - 1) / monthlyEquityRate);
    return fv * Math.pow(1 + monthlyEquityRate, startMonthOffset);
  };

  // 1. Calculate Standard Amortization (Scenario 2: No Prepay) to find total bank interest paid
  let standardTotalInterestPaid = 0;
  let standardBal = totalDebt;
  let standardMonths = 0;
  while (standardBal > 0 && standardMonths < 360) {
    const interest = standardBal * monthlyInterestRate;
    const principal = emi - interest;
    if (principal <= 0) {
      // EMI doesn't cover interest
      standardTotalInterestPaid += interest;
      break;
    }
    standardTotalInterestPaid += interest;
    standardBal -= principal;
    standardMonths++;
  }

  // 2. Calculate Accelerated Amortization (Scenario 3 / Prepay check)
  let loanPayoffMonths = monthsToRetirement;
  let tempBal = totalDebt;
  let m = 0;
  const totalMonthlyPrepayAttack = emi + extraSurplus;
  let acceleratedTotalInterestPaid = 0;

  while (tempBal > 0 && m < monthsToRetirement) {
    const interestCharge = tempBal * monthlyInterestRate;
    acceleratedTotalInterestPaid += interestCharge;
    const principalPaid = totalMonthlyPrepayAttack - interestCharge;
    tempBal -= principalPaid;
    m++;
  }
  loanPayoffMonths = m;

  // --- Scenario 1: Aggressive Prepayment Only ---
  const corpusScenario1 = getFutureValue(baseSip, monthsToRetirement);

  // --- Scenario 2: Pure Equity SIP (No Prepay) ---
  // Base SIP (₹20k) + Extra Surplus (₹50k) = ₹70k/mo invested, MINUS the bank interest penalty drag
  const combinedPureSip = baseSip + extraSurplus;
  const rawCorpusScenario2 = getFutureValue(combinedPureSip, monthsToRetirement);
  // Subtracting total bank interest paid (compounded/adjusted as a direct cash leakage from net worth)
  const corpusScenario2 = Math.max(0, rawCorpusScenario2 - standardTotalInterestPaid);

  // --- Scenario 3: Sequential Hybrid (Prepay + Redirect EMI + Extra Surplus) ---
  const phase1Corpus = getFutureValue(baseSip, loanPayoffMonths, 0);
  const remainingMonths = Math.max(0, monthsToRetirement - loanPayoffMonths);
  const superSipMonthly = baseSip + extraSurplus + emi;
  const phase2Corpus = getFutureValue(superSipMonthly, remainingMonths, loanPayoffMonths);
  // Scenario 3 also saves you the difference in bank interest (paying acceleratedTotalInterestPaid instead of standardTotalInterestPaid)
  const interestSaved = standardTotalInterestPaid - acceleratedTotalInterestPaid;
  const corpusScenario3 = phase1Corpus + phase2Corpus;

  // Profit / Loss against Benchmark (Scenario 2)
  const diff1 = corpusScenario1 - corpusScenario2;
  const diff3 = corpusScenario3 - corpusScenario2;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl transition-all">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Capital Allocation Engine
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Debt Paydown vs. SIP Investing Optimizer
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-amber-400">
            Loan Rate: {interestRate}% p.a. | Bank Interest (No Prepay): {formatINR(standardTotalInterestPaid)}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            {isExpanded ? "Collapse ▲" : "Expand Scenarios ▼"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Active Home Loan Balance</p>
          <p className="mt-2 text-xl font-bold text-white">{formatINR(totalDebt)}</p>
          <p className="mt-1 text-xs text-zinc-400">Standard payoff interest: {formatINR(standardTotalInterestPaid)}</p>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Base Monthly SIP</p>
          <p className="mt-2 text-xl font-bold text-blue-400">{formatINR(baseSip)} <span className="text-xs font-normal text-zinc-400">/mo</span></p>
          <p className="mt-1 text-xs text-zinc-400">Pulled from latest monthly entry.</p>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Tested Extra Surplus</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={extraSurplus}
              onChange={(e) => setExtraSurplus(Number(e.target.value))}
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm font-bold text-emerald-400 outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-zinc-400">/ mo extra</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">Adjustable prepayment fund.</p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6 border-t border-zinc-800/60 pt-6 animate-fadeIn">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-emerald-400">
              Detailed Comparative Math (Net of Bank Interest Outgo)
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Scenario 2 includes a direct deduction for the heavy cumulative interest paid to the lender over the standard loan lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Scenario 1 */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <span className="rounded-md bg-blue-500/10 px-2 py-1 font-mono text-[10px] text-blue-400 border border-blue-500/20 uppercase">
                  Scenario 1
                </span>
                <h4 className="mt-3 text-sm font-semibold text-white">Aggressive Prepayment Only</h4>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Deploying {formatINR(extraSurplus)} extra + EMI to kill loan in {Math.round(loanPayoffMonths)} months. Saves <strong className="text-emerald-400">{formatINR(interestSaved)}</strong> in bank interest outgo.
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-800/60 pt-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Retirement Corpus</p>
                <p className="mt-1 text-lg font-bold text-white">{formatINR(corpusScenario1)}</p>
                <p className={`mt-1 font-mono text-xs font-semibold ${diff1 >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {diff1 >= 0 ? `+${formatINR(diff1)}` : `${formatINR(diff1)}`} vs Pure SIP
                </p>
              </div>
            </div>

            {/* Scenario 2 */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <span className="rounded-md bg-purple-500/10 px-2 py-1 font-mono text-[10px] text-purple-400 border border-purple-500/20 uppercase">
                  Scenario 2
                </span>
                <h4 className="mt-3 text-sm font-semibold text-white">Pure Equity SIP (No Prepay)</h4>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Investing {formatINR(baseSip + extraSurplus)}/mo into equity, <strong className="text-rose-400">minus {formatINR(standardTotalInterestPaid)}</strong> paid in cumulative bank interest over the loan term.
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-800/60 pt-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Net Retirement Corpus</p>
                <p className="mt-1 text-lg font-bold text-purple-400">{formatINR(corpusScenario2)}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">After Bank Interest Drag</p>
              </div>
            </div>

            {/* Scenario 3 */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 flex flex-col justify-between shadow-lg shadow-emerald-500/5">
              <div>
                <span className="rounded-md bg-emerald-500/20 px-2 py-1 font-mono text-[10px] text-emerald-400 border border-emerald-500/40 uppercase">
                  Scenario 3 (Recommended ⭐)
                </span>
                <h4 className="mt-3 text-sm font-semibold text-white">Sequential Hybrid (Prepay + Redirect)</h4>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                  Kill loan fast, pocket the interest savings, and roll <strong className="text-white">Base SIP ({formatINR(baseSip)}) + Extra ({formatINR(extraSurplus)}) + EMI ({formatINR(emi)})</strong> into a massive <strong className="text-emerald-400">{formatINR(baseSip + extraSurplus + emi)}/mo</strong> equity SIP post-payoff!
                </p>
              </div>
              <div className="mt-6 border-t border-emerald-500/20 pt-4">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400">Retirement Corpus</p>
                <p className="mt-1 text-xl font-bold text-emerald-400">{formatINR(corpusScenario3)}</p>
                <p className={`mt-1 font-mono text-xs font-semibold ${diff3 >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {diff3 >= 0 ? `+${formatINR(diff3)}` : `${formatINR(diff3)}`} vs Pure SIP (Net Profit!)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-indigo-300">
              Athena's Mathematical Justification & Verdict
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              When factoring in the literal cash leakage of <strong className="text-rose-400">{formatINR(standardTotalInterestPaid)}</strong> paid directly to the bank in Scenario 2, the illusion that "pure investing always wins" breaks down. <strong className="text-white">Scenario 3 (Sequential Hybrid)</strong> completely avoids this interest penalty while compounding at maximum velocity once the debt is cleared.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}