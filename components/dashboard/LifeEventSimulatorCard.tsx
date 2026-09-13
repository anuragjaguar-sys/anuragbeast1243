"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { getRetirementProjection } from "@/lib/retirement/retirement-engine";
import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";

type EventType = "none" | "sabbatical" | "secondHome" | "education" | "medical";
type StepUpMode = 0 | 0.03 | 0.05;

interface Preset {
  label: string;
  description: string;
  cost: number;
  year: number;
  sipPauseMonths: number;
}

const PRESETS: Record<Exclude<EventType, "none">, Preset> = {
  sabbatical: {
    label: "1-Yr Sabbatical",
    description: "Living costs funded with 12-month freeze on new investments",
    cost: 1200000,
    year: 2,
    sipPauseMonths: 12,
  },
  secondHome: {
    label: "Property Purchase",
    description: "Capital deployed toward real estate purchase or down payment",
    cost: 4500000,
    year: 3,
    sipPauseMonths: 0,
  },
  education: {
    label: "Higher Education / Child Goal",
    description: "Major milestone expenditure funded at Year 8",
    cost: 3000000,
    year: 8,
    sipPauseMonths: 0,
  },
  medical: {
    label: "Critical Health Contingency",
    description: "Out-of-pocket medical shock exceeding health cover",
    cost: 1500000,
    year: 1,
    sipPauseMonths: 3,
  },
};

function formatINR(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function LifeEventSimulatorCard() {
  const { profile, loading } = useProfile();
  const [selectedEvent, setSelectedEvent] = useState<EventType>("none");
  const [cost, setCost] = useState<number>(0);
  const [eventYear, setEventYear] = useState<number>(1);
  const [sipPauseMonths, setSipPauseMonths] = useState<number>(0);

  // Step-Up Policy Toggle: 0% (Flat), 3% (Salary-Linked), 5% (Aggressive)
  const [stepUpRate, setStepUpRate] = useState<StepUpMode>(0.05);

  // Real estate investment parameters
  const [isRental, setIsRental] = useState<boolean>(true);
  const [propertyGrowthRate, setPropertyGrowthRate] = useState<number>(7.0);
  const [rentalYieldRate, setRentalYieldRate] = useState<number>(2.5);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-zinc-400">
        Loading simulator...
      </div>
    );
  }

  const retirementInputs = getRetirementAssumptionsFromProfile(profile);
  const baseline = getRetirementProjection(retirementInputs);

  const currentAge = Number(profile?.personal?.currentAge || 37);
  const retirementAge = Number(profile?.personal?.retirementAge || 54);
  const totalYears = Math.max(1, retirementAge - currentAge);
  const _monthlySalary = Number(profile?.income?.monthlySalary || 175000);

  const selectPreset = (type: EventType) => {
    setSelectedEvent(type);
    if (type === "none") {
      setCost(0);
      setEventYear(1);
      setSipPauseMonths(0);
    } else {
      const p = PRESETS[type];
      setCost(p.cost);
      setEventYear(p.year);
      setSipPauseMonths(p.sipPauseMonths);
    }
  };

  const baseSip = Number(profile?.income?.monthlyInvestment || 20000);
  const debtPayoffYear = 2;
  const surge = 68250;
  const r = Math.max(0.05, retirementInputs.equityReturn || 0.12);
  const yearsRemainingAfterEvent = Math.max(1, totalYears - eventYear);

  // Helper to project future value of SIP streams under a specific step-up rate
  const projectSipStream = (stepUp: number) => {
    let accumulated = 0;
    for (let yr = 1; yr <= totalYears; yr++) {
      const isPostDebt = yr >= debtPayoffYear;
      const surgeYears = Math.max(0, yr - debtPayoffYear);
      const activeSurge = isPostDebt ? surge * Math.pow(1 + stepUp, surgeYears) : 0;
      const activeBase = baseSip * Math.pow(1 + stepUp, yr - 1);
      let yearMonthly = activeBase + activeSurge;

      // Deduct pause if event occurs in this year
      if (selectedEvent !== "none" && yr === eventYear && sipPauseMonths > 0) {
        yearMonthly = Math.max(0, yearMonthly * (1 - sipPauseMonths / 12));
      }

      const yearsToCompound = totalYears - yr;
      // Monthly compounding factor for this year's 12 contributions
      const fvThisYear = (yearMonthly * 12) * Math.pow(1 + r, yearsToCompound);
      accumulated += fvThisYear;
    }
    return accumulated;
  };

  // Fixed Asset base compounding (Starting MF + Starting PPF)
  const initialMf = Number(profile?.assets?.mutualFunds || 4100000);
  const initialPpf = Number(profile?.assets?.ppf || 8400000);
  const ppfReturn = Math.max(0.05, retirementInputs.debtReturn || 0.071);

  const fvStartingMf = initialMf * Math.pow(1 + r, totalYears);
  const fvStartingPpf = initialPpf * Math.pow(1 + ppfReturn, totalYears);
  const fixedBaseCorpus = fvStartingMf + fvStartingPpf;

  // Compute corpus under active stepUpRate vs Flat (0% Step-Up)
  const fvSipActive = projectSipStream(stepUpRate);
  const fvSipFlat = projectSipStream(0);

  // Future cost impact of lump sum
  const fvCost = cost * Math.pow(1 + r, yearsRemainingAfterEvent);

  // Corpus outcomes
  const simulatedCorpusActive = Math.max(0, Math.round(fixedBaseCorpus + fvSipActive - fvCost));
  const simulatedCorpusFlat = Math.max(0, Math.round(fixedBaseCorpus + fvSipFlat - fvCost));
  const stepUpDeltaAdvantage = simulatedCorpusActive - simulatedCorpusFlat;

  // Real estate valuation & rental flow
  const isRealEstate = selectedEvent === "secondHome";
  const terminalPropertyValue = (isRealEstate && cost > 0)
    ? Math.round(cost * Math.pow(1 + propertyGrowthRate / 100, yearsRemainingAfterEvent))
    : 0;

  const monthlyRentalIncome = (isRealEstate && isRental && terminalPropertyValue > 0)
    ? Math.round((terminalPropertyValue * (rentalYieldRate / 100)) / 12)
    : 0;

  // Safe Withdrawal Rate (4% SWR)
  const _targetCorpus = baseline.yearlyProjection?.[baseline.yearlyProjection.length - 1]?.targetCorpus || 131566367;
  const activeSWRMonthly = Math.round((simulatedCorpusActive * 0.04) / 12);
  const flatSWRMonthly = Math.round((simulatedCorpusFlat * 0.04) / 12);
  const totalMonthlyRetirementInflow = activeSWRMonthly + monthlyRentalIncome;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            Lifecycle Strategy & Shock Modeler
          </span>
          <h3 className="text-xl font-bold text-white">Life Event Modeler: Shock vs. Step-Up</h3>
        </div>
        <div className="rounded-lg bg-zinc-800/60 px-3 py-1 font-mono text-xs text-zinc-300">
          Working Horizon: <span className="font-semibold text-white">{totalYears} Years</span> (to Age {retirementAge})
        </div>
      </div>

      {/* Preset Selector */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          onClick={() => selectPreset("none")}
          className={`rounded-xl px-3 py-2.5 text-xs font-medium transition ${
            selectedEvent === "none"
              ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm"
              : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white"
          }`}
        >
          Baseline
        </button>
        {(Object.keys(PRESETS) as Array<Exclude<EventType, "none">>).map((key) => (
          <button
            key={key}
            onClick={() => selectPreset(key)}
            className={`rounded-xl px-3 py-2.5 text-xs font-medium transition ${
              selectedEvent === key
                ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm"
                : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white"
            }`}
          >
            {PRESETS[key].label}
          </button>
        ))}
      </div>

      {/* Step-Up Policy Switcher */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Annual SIP Step-Up Policy
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simulate how stepping up contributions from salary raises counteracts financial shocks.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            <button
              onClick={() => setStepUpRate(0)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                stepUpRate === 0
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Flat (0% Step-Up)
            </button>
            <button
              onClick={() => setStepUpRate(0.03)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                stepUpRate === 0.03
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              +3% (Salary-Linked)
            </button>
            <button
              onClick={() => setStepUpRate(0.05)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                stepUpRate === 0.05
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              +5% (Aggressive)
            </button>
          </div>
        </div>

        {/* Real-time comparison pill */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/60 pt-3 text-xs">
          <span className="text-zinc-300">
            {stepUpRate === 0 ? (
              <span className="text-rose-400">⚠️ Flat SIP leaves your capital compounding vulnerable to inflation.</span>
            ) : (
              <span>
                Stepping up at <strong className="text-white">{(stepUpRate * 100).toFixed(0)}%/yr</strong> yields{" "}
                <strong className="text-emerald-400">+{formatINR(stepUpDeltaAdvantage)} extra corpus</strong> vs. Flat SIP.
              </span>
            )}
          </span>
          <span className="font-mono text-zinc-400">
            Monthly SWR Lift: <strong className="text-emerald-400">+{formatINR(Math.max(0, activeSWRMonthly - flatSWRMonthly))}/mo</strong>
          </span>
        </div>
      </div>

      {/* Event Customization Inputs */}
      {selectedEvent !== "none" && (
        <div className="mb-6 rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 space-y-4">
          <p className="text-xs text-zinc-400">
            {PRESETS[selectedEvent].description}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Outlay / Asset Cost (₹)
              </label>
              <input
                type="number"
                step="100000"
                value={cost}
                onChange={(e) => setCost(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Event Year
              </label>
              <select
                value={eventYear}
                onChange={(e) => setEventYear(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {Array.from({ length: totalYears }, (_, i) => i + 1).map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr} (Age {currentAge + yr}) · {totalYears - yr}y compounding left
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                SIP Pause (Months)
              </label>
              <input
                type="number"
                min="0"
                max="36"
                value={sipPauseMonths}
                onChange={(e) => setSipPauseMonths(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Real Estate Specific Options */}
          {isRealEstate && (
            <div className="border-t border-zinc-800/80 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold text-zinc-200">
                  Real Estate Valuation & Monetization
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRental(false)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      !isRental
                        ? "border border-amber-500/40 bg-amber-500/20 text-amber-300"
                        : "bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Personal Use (Self-Occupied)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRental(true)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      isRental
                        ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                        : "bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Rental Income Generator
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Property Capital Appreciation CAGR (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={propertyGrowthRate}
                    onChange={(e) => setPropertyGrowthRate(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Expected value at Age 54: <strong className="text-white">{formatINR(terminalPropertyValue)}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Net Rental Yield (% / year)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!isRental}
                    value={rentalYieldRate}
                    onChange={(e) => setRentalYieldRate(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white disabled:opacity-40 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    {isRental
                      ? `Yields +${formatINR(monthlyRentalIncome)}/month in retirement cash flow`
                      : "₹0 rental yield (personal lifestyle asset)"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparative Results Display */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Flat SIP (0% Step-Up)</span>
          <p className="mt-1 font-mono text-lg font-bold text-zinc-300">
            {formatINR(simulatedCorpusFlat)}
          </p>
          <span className="text-[11px] text-rose-400">
            SWR: {formatINR(flatSWRMonthly)}/mo
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            With {(stepUpRate * 100).toFixed(0)}% Step-Up Policy
          </span>
          <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
            {formatINR(simulatedCorpusActive)}
          </p>
          <span className="text-[11px] text-emerald-400">
            +{formatINR(stepUpDeltaAdvantage)} vs Flat
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Total Net Worth at 54</span>
          <p className="mt-1 font-mono text-lg font-bold text-white">
            {formatINR(simulatedCorpusActive + terminalPropertyValue)}
          </p>
          <span className="text-[11px] text-zinc-400">
            {isRealEstate ? `Includes ${formatINR(terminalPropertyValue)} property` : "Liquid only"}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Monthly Retirement Inflow</span>
          <p className="mt-1 font-mono text-lg font-bold text-indigo-300">
            {formatINR(totalMonthlyRetirementInflow)} / mo
          </p>
          <span className="text-[11px] text-zinc-400">
            {isRealEstate && isRental
              ? `${formatINR(activeSWRMonthly)} SWR + ${formatINR(monthlyRentalIncome)} Rent`
              : `4% SWR from liquid corpus`}
          </span>
        </div>
      </div>

      {/* Decision Summary */}
      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
          Step-Up Impact Assessment
        </h4>
        <div className="text-xs text-zinc-300 leading-relaxed space-y-1.5">
          <p>
            • <strong>Flat SIP Trajectory:</strong> If you never increase your post-debt SIP of ₹88,250/mo, your liquid corpus at 54 reaches <strong className="text-white">{formatINR(simulatedCorpusFlat)}</strong>, supporting a monthly SWR draw of <strong className="text-white">{formatINR(flatSWRMonthly)}/mo</strong>.
          </p>
          <p>
            • <strong>Stepped-Up Trajectory ({(stepUpRate * 100).toFixed(0)}%/yr):</strong> Channeling 3%–5% of your annual salary raises into your SIP adds <strong className="text-emerald-400">+{formatINR(stepUpDeltaAdvantage)}</strong> to your liquid corpus, increasing your safe monthly draw by <strong className="text-emerald-400">+{formatINR(Math.max(0, activeSWRMonthly - flatSWRMonthly))}/mo</strong>.
          </p>
          {selectedEvent !== "none" && (
            <p className="pt-1 text-zinc-400">
              💡 <em>Takeaway:</em> Even after paying for the {selectedEvent === "secondHome" ? "₹45L property" : "life event"}, applying a 5% step-up produces a terminal corpus of <strong className="text-white">{formatINR(simulatedCorpusActive)}</strong>, substantially surpassing what a flat SIP would yield with zero shocks ({formatINR(fixedBaseCorpus + fvSipFlat)}).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
