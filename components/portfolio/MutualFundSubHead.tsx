"use client";

import React, { useState, useMemo } from "react";
import type { PortfolioItem } from "@/lib/investments";

interface MutualFundSubHeadProps {
  portfolio?: PortfolioItem[];
  onUpdatePortfolio?: (updated: PortfolioItem[]) => void;
}

export default function MutualFundSubHead({
  portfolio = [],
  onUpdatePortfolio,
}: MutualFundSubHeadProps) {
  const currentYear = new Date().getFullYear();
  const yearsToRetire = 17; // FIRE54 horizon

  const [activePanel, setActivePanel] = useState<"none" | "loss_audit" | "tax_roadmap">("none");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncingNavs, setSyncingNavs] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Modal Form State
  const [schemeName, setSchemeName] = useState("");
  const [schemeCode, setSchemeCode] = useState("");
  const [planType, setPlanType] = useState<"regular" | "direct">("regular");
  const [unitsHeld, setUnitsHeld] = useState<number>(48500);
  const [liveNav, setLiveNav] = useState<number>(85.1546);
  const [lastNavDate, setLastNavDate] = useState<string>("");
  const [investedAmount, setInvestedAmount] = useState<number>(1950000);
  const [startYear, setStartYear] = useState<number>(2014);
  const [hasRunningSip, setHasRunningSip] = useState<boolean>(true);
  const [sipAmount, setSipAmount] = useState<number>(20000);
  const [sipDay, setSipDay] = useState<number>(5);
  const [cagr, setCagr] = useState<number>(14.8);
  const [regularTER, setRegularTER] = useState<number>(1.75);
  const [directTER, setDirectTER] = useState<number>(0.60);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const mfItems = useMemo(() => {
    return (portfolio || []).filter((item: any) => {
      if (item.type !== "Asset") return false;
      const cat = (item.category || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      return (
        cat === "mutual fund" ||
        cat === "mutual funds" ||
        item.isMutualFundSubItem === true ||
        name.includes("mutual fund") ||
        name.includes("flexi cap") ||
        name.includes("large cap") ||
        name.includes("mid cap") ||
        name.includes("small cap") ||
        name.includes("index fund")
      );
    });
  }, [portfolio]);

  const handleSchemeSearch = async (q: string) => {
    setSchemeName(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/mf-audit?action=search&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.schemes || []);
        if (data.benchmarks) {
          setRegularTER(data.benchmarks.regularTER);
          setDirectTER(data.benchmarks.directTER);
          setCagr(data.benchmarks.avgCAGR);
        }
      }
    } catch {
      // ignore network error
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectScheme = async (scheme: { schemeCode: number | string; schemeName: string }) => {
    const sName = scheme.schemeName || "";
    const sCode = String(scheme.schemeCode || "");
    setSchemeName(sName);
    setSchemeCode(sCode);
    setSearchResults([]);

    const lower = sName.toLowerCase();
    if (lower.includes("direct")) {
      setPlanType("direct");
    } else {
      setPlanType("regular");
    }

    try {
      const res = await fetch(
        `/api/mf-audit?action=nav&code=${encodeURIComponent(sCode)}&q=${encodeURIComponent(sName)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.nav && data.nav > 0) {
          setLiveNav(data.nav);
          setLastNavDate(data.date || "Live AMFI");
        }
        if (data.benchmarks) {
          setRegularTER(data.benchmarks.regularTER);
          setDirectTER(data.benchmarks.directTER);
          setCagr(data.benchmarks.avgCAGR);
        }
      }
    } catch {
      // ignore network error
    }
  };

  const syncLiveNavsAndSips = async () => {
    if (mfItems.length === 0 || !onUpdatePortfolio) return;
    setSyncingNavs(true);
    setStatusMessage("");

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const todayDate = now.getDate();

    let updatedCount = 0;
    let sipCreditedCount = 0;

    const updatedPortfolio = await Promise.all(
      portfolio.map(async (item: any) => {
        const isMF = mfItems.some((m) => m.id === item.id);
        if (!isMF) return item;

        let latestNav = Number(item.liveNav ?? item.nav) || 0;
        let latestDate = item.lastNavDate || "";

        if (item.schemeCode) {
          try {
            const res = await fetch(
              `/api/mf-audit?action=nav&code=${encodeURIComponent(String(item.schemeCode))}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.nav && data.nav > 0) {
                latestNav = data.nav;
                latestDate = data.date || latestDate;
                updatedCount++;
              }
            }
          } catch {
            // ignore network error
          }
        }

        let currentUnits = Number(item.unitsHeld ?? item.units) || 0;
        let currentInvested = Number(item.investedAmount) || 0;
        const sipMonthly = Number(item.sipAmount ?? item.monthlyContribution) || 0;
        const hasSip = Boolean(item.hasRunningSip ?? sipMonthly > 0);
        const dayOfSip = Number(item.sipDay) || 5;
        let lastCredited = item.lastSipCreditedMonth || "";

        if (
          hasSip &&
          sipMonthly > 0 &&
          latestNav > 0 &&
          todayDate >= dayOfSip &&
          lastCredited !== currentMonthKey
        ) {
          const netSipAfterStampDuty = sipMonthly * 0.99995;
          const newUnitsAllotted = netSipAfterStampDuty / latestNav;
          currentUnits = Number((currentUnits + newUnitsAllotted).toFixed(4));
          currentInvested = Math.round(currentInvested + sipMonthly);
          lastCredited = currentMonthKey;
          sipCreditedCount++;
        }

        const newCurrentValue =
          currentUnits > 0 && latestNav > 0
            ? Math.round(currentUnits * latestNav)
            : Number(item.currentValue) || 0;

        return {
          ...item,
          units: currentUnits,
          unitsHeld: currentUnits,
          nav: latestNav,
          liveNav: latestNav,
          lastNavDate: latestDate,
          investedAmount: currentInvested,
          currentValue: newCurrentValue,
          lastSipCreditedMonth: lastCredited,
        };
      })
    );

    onUpdatePortfolio(updatedPortfolio);
    setSyncingNavs(false);
    setStatusMessage(
      `Synced live NAVs for ${updatedCount} scheme(s)` +
        (sipCreditedCount > 0
          ? ` and credited monthly SIP units for ${sipCreditedCount} scheme(s).`
          : ".")
    );
  };

  const creditMonthlySipOnce = (fundId: string) => {
    if (!onUpdatePortfolio) return;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const updated = portfolio.map((item: any) => {
      if (item.id !== fundId) return item;
      const nav = Number(item.liveNav ?? item.nav) || 85.15;
      const sip = Number(item.sipAmount ?? item.monthlyContribution) || 0;
      if (sip <= 0 || nav <= 0) return item;

      const addedUnits = (sip * 0.99995) / nav;
      const baseUnits = Number(item.unitsHeld ?? item.units) || Number(item.currentValue || 0) / nav;
      const newUnits = Number((baseUnits + addedUnits).toFixed(4));
      const newInvested = Math.round((Number(item.investedAmount) || 0) + sip);
      const newValue = Math.round(newUnits * nav);

      setStatusMessage(
        `Credited +${addedUnits.toFixed(3)} units (₹${sip.toLocaleString("en-IN")} ÷ ₹${nav.toFixed(2)} NAV) to ${item.name}.`
      );

      return {
        ...item,
        units: newUnits,
        unitsHeld: newUnits,
        nav,
        liveNav: nav,
        investedAmount: newInvested,
        currentValue: newValue,
        lastSipCreditedMonth: currentMonthKey,
      };
    });

    onUpdatePortfolio(updated);
  };

  const openAddModal = () => {
    setEditingId(null);
    setSchemeName("");
    setSchemeCode("");
    setPlanType("regular");
    setUnitsHeld(10000);
    setLiveNav(85.0);
    setLastNavDate("");
    setInvestedAmount(500000);
    setStartYear(2014);
    setHasRunningSip(true);
    setSipAmount(10000);
    setSipDay(5);
    setCagr(14.8);
    setRegularTER(1.75);
    setDirectTER(0.60);
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setSchemeName(item.name || "");
    setSchemeCode(item.schemeCode ? String(item.schemeCode) : "");
    setPlanType(item.planType || "regular");
    const curVal = Number(item.currentValue) || 4130000;
    const nav = Number(item.liveNav ?? item.nav) || 85.15;
    const u =
      Number(item.unitsHeld ?? item.units) > 0
        ? Number(item.unitsHeld ?? item.units)
        : Number((curVal / nav).toFixed(3));
    setUnitsHeld(u);
    setLiveNav(nav);
    setLastNavDate(item.lastNavDate || "");
    setInvestedAmount(
      Number(item.investedAmount) > 0 ? Number(item.investedAmount) : Math.round(curVal * 0.48)
    );
    setStartYear(Number(item.startYear) || 2014);
    const sip = Number(item.sipAmount ?? item.monthlyContribution) || 0;
    setHasRunningSip(item.hasRunningSip !== undefined ? Boolean(item.hasRunningSip) : sip > 0);
    setSipAmount(sip > 0 ? sip : 20000);
    setSipDay(Number(item.sipDay) || 5);
    setCagr(Number(item.cagr ?? item.expectedReturn) || 14.8);
    setRegularTER(Number(item.regularTER) || 1.75);
    setDirectTER(Number(item.directTER) || 0.60);
    setShowModal(true);
  };

  const handleSaveScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeName.trim() || !onUpdatePortfolio) return;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const calculatedPresentValue = Math.round(unitsHeld * liveNav);
    const effectiveSip = hasRunningSip ? sipAmount : 0;

    const newItem: any = {
      id: editingId || `mf-${Date.now()}`,
      type: "Asset",
      name: schemeName.trim(),
      category: "Mutual Fund",
      assetClass: "Equity",
      isMutualFundSubItem: true,
      schemeCode: schemeCode.trim(),
      planType,
      units: Number(unitsHeld.toFixed(4)),
      unitsHeld: Number(unitsHeld.toFixed(4)),
      nav: Number(liveNav.toFixed(4)),
      liveNav: Number(liveNav.toFixed(4)),
      lastNavDate,
      currentValue: calculatedPresentValue,
      investedAmount: Math.round(investedAmount),
      monthlyContribution: effectiveSip,
      expectedReturn: cagr,
      goal: "Retirement",
      riskLevel: "High",
      hasRunningSip,
      sipAmount: effectiveSip,
      sipDay,
      lastSipCreditedMonth: currentMonthKey,
      startYear,
      cagr,
      regularTER,
      directTER,
    };

    let updated: PortfolioItem[];
    if (editingId) {
      updated = portfolio.map((p) => (p.id === editingId ? newItem : p));
    } else {
      const hasGenericPlaceholder = portfolio.some(
        (p) => p.type === "Asset" && (p.name || "").toLowerCase().trim() === "mutual fund"
      );
      if (hasGenericPlaceholder && mfItems.length === 1) {
        updated = portfolio.map((p) =>
          p.type === "Asset" && (p.name || "").toLowerCase().trim() === "mutual fund" ? newItem : p
        );
      } else {
        updated = [...portfolio, newItem];
      }
    }

    onUpdatePortfolio(updated);
    setShowModal(false);
  };

  const handleDeleteScheme = (id: string) => {
    if (!onUpdatePortfolio) return;
    onUpdatePortfolio(portfolio.filter((p) => p.id !== id));
  };

  const analyzedFunds = useMemo(() => {
    return mfItems.map((item: any) => {
      const rawUnits = Number(item.unitsHeld ?? item.units) || 0;
      const rawNav = Number(item.liveNav ?? item.nav) || 0;
      const curVal =
        rawUnits > 0 && rawNav > 0
          ? Math.round(rawUnits * rawNav)
          : Number(item.currentValue) || 0;
      const nav = rawNav > 0 ? rawNav : 85.15;
      const units = rawUnits > 0 ? rawUnits : Number((curVal / nav).toFixed(3));
      const inv =
        Number(item.investedAmount) > 0 ? Number(item.investedAmount) : Math.round(curVal * 0.48);
      const startYr = Number(item.startYear) || 2014;
      const pType: "regular" | "direct" = item.planType || "regular";
      const regTER = Number(item.regularTER) || 1.75;
      const dirTER = Number(item.directTER) || 0.60;
      const fundCagr = Number(item.cagr ?? item.expectedReturn) || 14.8;
      const sip = Number(item.sipAmount ?? item.monthlyContribution) || 0;
      const hasSip = item.hasRunningSip !== undefined ? Boolean(item.hasRunningSip) : sip > 0;

      const yearsInvested = Math.max(1, currentYear - startYr);
      const totalMonths = yearsInvested * 12;
      const baseTerDiff = pType === "regular" ? Math.max(0, regTER - dirTER) : 0;

      const getEffectiveAnnualTerDiff = (yrIdx: number) => {
        if (pType === "direct") return 0;
        return startYr + yrIdx < 2019 ? baseTerDiff + 0.35 : baseTerDiff;
      };

      const directCAGRDec = fundCagr / 100;
      const rDirectMonthly = Math.pow(1 + directCAGRDec, 1 / 12) - 1;

      const getRegularMonthlyRate = (yrIdx: number) => {
        const effDiff = getEffectiveAnnualTerDiff(yrIdx) / 100;
        const annualReg = (1 + directCAGRDec) * (1 - effDiff) - 1;
        return Math.pow(Math.max(1.005, 1 + annualReg), 1 / 12) - 1;
      };

      let simReg = 0;
      let simDir = 0;
      let simRawFee = 0;
      let contrib = 10000;

      for (let m = 0; m < totalMonths; m++) {
        const yrIdx = Math.floor(m / 12);
        if (m > 0 && m % 12 === 0) contrib *= 1.08;
        const rRegM = getRegularMonthlyRate(yrIdx);
        const mTerDrag = getEffectiveAnnualTerDiff(yrIdx) / 100 / 12;

        simRawFee += (simReg + contrib) * mTerDrag;
        simReg = (simReg + contrib) * (1 + rRegM);
        simDir = (simDir + contrib) * (1 + rDirectMonthly);
      }

      const scale = simReg > 0 ? curVal / simReg : 1;
      const directEquivalentVal = pType === "regular" ? Math.round(simDir * scale) : curVal;
      const totalLostTillNow = pType === "regular" ? Math.max(0, directEquivalentVal - curVal) : 0;
      const rawBrokeragePaid =
        pType === "regular" ? Math.min(totalLostTillNow, Math.round(simRawFee * scale)) : 0;
      const lostCompounding = Math.max(0, totalLostTillNow - rawBrokeragePaid);
      const annualLossToday = pType === "regular" ? Math.round(curVal * (baseTerDiff / 100)) : 0;

      const monthsToRetire = yearsToRetire * 12;
      const post2019RegMonthly = getRegularMonthlyRate(yearsInvested);
      const activeSip = hasSip ? sip : 0;

      const fvDir54 =
        curVal * Math.pow(1 + rDirectMonthly, monthsToRetire) +
        (activeSip > 0
          ? activeSip *
            ((Math.pow(1 + rDirectMonthly, monthsToRetire) - 1) / rDirectMonthly) *
            (1 + rDirectMonthly)
          : 0);

      const fvReg54 =
        curVal * Math.pow(1 + post2019RegMonthly, monthsToRetire) +
        (activeSip > 0
          ? activeSip *
            ((Math.pow(1 + post2019RegMonthly, monthsToRetire) - 1) / post2019RegMonthly) *
            (1 + post2019RegMonthly)
          : 0);

      const futureSavedAt54 = pType === "regular" ? Math.max(0, Math.round(fvDir54 - fvReg54)) : 0;

      const avgBuyNav = units > 0 ? inv / units : nav * 0.5;
      const profitPerUnit = Math.max(0, nav - avgBuyNav);
      const totalProfit = Math.max(0, curVal - inv);
      const nextMonthUnitsToAdd = activeSip > 0 && nav > 0 ? (activeSip * 0.99995) / nav : 0;

      return {
        ...item,
        curVal,
        nav,
        units,
        inv,
        startYr,
        yearsInvested,
        pType,
        regTER,
        dirTER,
        baseTerDiff,
        fundCagr,
        hasSip,
        activeSip,
        sipDay: Number(item.sipDay) || 5,
        nextMonthUnitsToAdd,
        directEquivalentVal,
        totalLostTillNow,
        rawBrokeragePaid,
        lostCompounding,
        annualLossToday,
        futureSavedAt54,
        avgBuyNav,
        profitPerUnit,
        totalProfit,
      };
    });
  }, [mfItems, currentYear, yearsToRetire]);

  const totals = useMemo(() => {
    let curVal = 0;
    let inv = 0;
    let monthlySip = 0;
    let directEq = 0;
    let lostTillNow = 0;
    let rawFee = 0;
    let lostComp = 0;
    let annualLoss = 0;
    let savedAt54 = 0;
    let regularProfit = 0;

    analyzedFunds.forEach((f) => {
      curVal += f.curVal;
      inv += f.inv;
      monthlySip += f.activeSip;
      directEq += f.directEquivalentVal;
      lostTillNow += f.totalLostTillNow;
      rawFee += f.rawBrokeragePaid;
      lostComp += f.lostCompounding;
      annualLoss += f.annualLossToday;
      savedAt54 += f.futureSavedAt54;
      if (f.pType === "regular") regularProfit += f.totalProfit;
    });

    return {
      curVal,
      inv,
      monthlySip,
      directEq,
      lostTillNow,
      rawFee,
      lostComp,
      annualLoss,
      savedAt54,
      regularProfit,
    };
  }, [analyzedFunds]);

  const switchSchedule = useMemo(() => {
    const regFunds = analyzedFunds
      .filter((f) => f.pType === "regular" && f.totalProfit > 0)
      .sort((a, b) => b.baseTerDiff - a.baseTerDiff);

    let fy1RemainingExemption = 125000;
    let fy2RemainingExemption = 125000;

    return regFunds.map((f) => {
      const gainRatio = f.curVal > 0 ? f.totalProfit / f.curVal : 0.5;

      const fy1GainUsed = Math.min(f.totalProfit, fy1RemainingExemption);
      fy1RemainingExemption = Math.max(0, fy1RemainingExemption - fy1GainUsed);
      const fy1RedeemAmount = gainRatio > 0 ? Math.round(fy1GainUsed / gainRatio) : 0;
      const fy1UnitsToRedeem = f.nav > 0 ? Number((fy1RedeemAmount / f.nav).toFixed(2)) : 0;

      const remProfitAfterFy1 = Math.max(0, f.totalProfit - fy1GainUsed);

      const fy2GainUsed = Math.min(remProfitAfterFy1, fy2RemainingExemption);
      fy2RemainingExemption = Math.max(0, fy2RemainingExemption - fy2GainUsed);
      const fy2RedeemAmount = gainRatio > 0 ? Math.round(fy2GainUsed / gainRatio) : 0;
      const fy2UnitsToRedeem = f.nav > 0 ? Number((fy2RedeemAmount / f.nav).toFixed(2)) : 0;

      const residualProfit = Math.max(0, remProfitAfterFy1 - fy2GainUsed);
      const residualTax = Math.round(residualProfit * 0.125);
      const breakEvenMonths =
        f.annualLossToday > 0 ? Math.round((residualTax / f.annualLossToday) * 12) : 0;

      return {
        ...f,
        fy1GainUsed,
        fy1RedeemAmount,
        fy1UnitsToRedeem,
        fy2GainUsed,
        fy2RedeemAmount,
        fy2UnitsToRedeem,
        residualProfit,
        residualTax,
        breakEvenMonths,
      };
    });
  }, [analyzedFunds]);

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  return (
    <section className="rounded-3xl border border-emerald-500/30 bg-zinc-950 p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Portfolio Sub-Head • Single Source of Truth
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Mutual Funds Holdings &amp; Live NAV Engine ({analyzedFunds.length} Schemes)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Total MF Value: <strong className="text-white font-mono">{formatINR(totals.curVal)}</strong> | Invested:{" "}
            <strong className="text-zinc-300 font-mono">{formatINR(totals.inv)}</strong> | Active Monthly SIPs:{" "}
            <strong className="text-emerald-400 font-mono">{formatINR(totals.monthlySip)}/mo</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={syncLiveNavsAndSips}
            disabled={syncingNavs}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-emerald-500 hover:text-white transition-all"
          >
            {syncingNavs ? "⏳ Syncing AMFI NAVs..." : "🔄 Sync Live NAVs & SIPs"}
          </button>

          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "loss_audit" ? "none" : "loss_audit")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
              activePanel === "loss_audit"
                ? "bg-rose-500 text-zinc-950 border-rose-400 shadow-lg shadow-rose-500/20"
                : "bg-zinc-900 text-rose-400 border-rose-500/40 hover:bg-rose-950/40"
            }`}
          >
            🔍 {activePanel === "loss_audit" ? "Hide Loss Audit" : "Audit Brokerage Loss"}
          </button>

          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "tax_roadmap" ? "none" : "tax_roadmap")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
              activePanel === "tax_roadmap"
                ? "bg-cyan-400 text-zinc-950 border-cyan-300 shadow-lg shadow-cyan-500/20"
                : "bg-zinc-900 text-cyan-400 border-cyan-500/40 hover:bg-cyan-950/40"
            }`}
          >
            ⚡ {activePanel === "tax_roadmap" ? "Hide Switch Plan" : "Zero-Tax Switch Plan"}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all"
          >
            + Add Mutual Fund
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300">
          ✓ {statusMessage}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-zinc-900/90 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
            <tr>
              <th className="py-3.5 px-4">Scheme Name</th>
              <th className="py-3.5 px-3">Plan</th>
              <th className="py-3.5 px-3 text-right">Units Held</th>
              <th className="py-3.5 px-3 text-right">Live NAV</th>
              <th className="py-3.5 px-3 text-right">Present Value (Units × NAV)</th>
              <th className="py-3.5 px-3 text-right">Invested Cost</th>
              <th className="py-3.5 px-3 text-center">Running SIP &amp; Next Units</th>
              <th className="py-3.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {analyzedFunds.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500">
                  No mutual fund schemes added yet. Click <strong>+ Add Mutual Fund</strong> to add your schemes.
                </td>
              </tr>
            ) : (
              analyzedFunds.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white max-w-[230px]">
                    <div className="truncate" title={f.name}>
                      {f.name}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      Since {f.startYr} ({f.yearsInvested} yrs){" "}
                      {f.schemeCode ? `• AMFI #${f.schemeCode}` : ""}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        f.pType === "direct"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {f.pType === "direct" ? "Direct" : "Regular"}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-zinc-200">
                    {f.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })}
                  </td>
                  <td className="py-3.5 px-3 text-right text-cyan-400">
                    ₹{f.nav.toFixed(2)}
                    {f.lastNavDate && (
                      <span className="block text-[9px] text-zinc-500">{f.lastNavDate}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right font-black text-white text-sm">
                    {formatINR(f.curVal)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-zinc-400">{formatINR(f.inv)}</td>
                  <td className="py-3.5 px-3 text-center">
                    {f.hasSip && f.activeSip > 0 ? (
                      <div>
                        <span className="text-emerald-400 font-bold">
                          {formatINR(f.activeSip)}/mo
                        </span>
                        <span className="block text-[10px] text-zinc-400">
                          +{f.nextMonthUnitsToAdd.toFixed(2)} units/mo (Day {f.sipDay})
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">No Running SIP</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {f.hasSip && f.activeSip > 0 && (
                        <button
                          type="button"
                          onClick={() => creditMonthlySipOnce(f.id)}
                          className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold"
                          title="Credit 1 monthly SIP installment (+SIP / Live NAV units)"
                        >
                          +SIP
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditModal(f)}
                        className="text-zinc-400 hover:text-white px-1"
                        title="Edit Scheme"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScheme(f.id)}
                        className="text-zinc-500 hover:text-rose-400 px-1"
                        title="Delete Scheme"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {analyzedFunds.length > 0 && (
            <tfoot className="bg-zinc-900 text-white font-bold border-t border-zinc-800">
              <tr>
                <td className="py-3 px-4" colSpan={4}>
                  MUTUAL FUNDS SUB-HEAD TOTAL ({analyzedFunds.length} Schemes)
                </td>
                <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                  {formatINR(totals.curVal)}
                </td>
                <td className="py-3 px-3 text-right text-zinc-300">{formatINR(totals.inv)}</td>
                <td className="py-3 px-3 text-center text-emerald-400">
                  {formatINR(totals.monthlySip)}/mo
                </td>
                <td className="py-3 px-3 text-center">—</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {activePanel === "loss_audit" && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-950/30 to-zinc-950 border border-rose-500/40 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="text-xs font-mono uppercase text-rose-400 font-bold">
                Historical Commission &amp; Opportunity Cost Audit (Includes Pre-2019 SEBI Regimes)
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                How Much You Have Lost to Regular Plan Brokerage &amp; What You Save by Switching
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel("none")}
              className="text-xs font-mono text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                Actual vs. Direct Equivalent
              </span>
              <p className="text-xl font-black text-white font-mono mt-1">
                {formatINR(totals.curVal)}
              </p>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">
                Should be: <strong>{formatINR(totals.directEq)}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-rose-500/40">
              <span className="text-[10px] font-mono uppercase text-rose-400 block font-bold">
                Total Wealth Lost Till Today
              </span>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                {formatINR(totals.lostTillNow)}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono mt-1">
                {formatINR(totals.rawFee)} Raw Fee + {formatINR(totals.lostComp)} Lost Growth
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30">
              <span className="text-[10px] font-mono uppercase text-amber-400 block font-bold">
                Ongoing Annual Commission Bleed
              </span>
              <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                {formatINR(totals.annualLoss)} / yr
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                Deducted from your NAV every year you stay in Regular
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-cyan-500/40">
              <span className="text-[10px] font-mono uppercase text-cyan-400 block font-bold">
                Wealth Saved by Age 54 If Switched
              </span>
              <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
                +{formatINR(totals.savedAt54)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                Reclaimed over remaining 17 years to Age 54
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Fund Name</th>
                  <th className="py-3 px-3 text-center">TER Spread</th>
                  <th className="py-3 px-3 text-right">Present Value</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Should Be (Direct)</th>
                  <th className="py-3 px-3 text-right text-rose-300">Raw Fee Paid</th>
                  <th className="py-3 px-3 text-right text-rose-400">Total Lost Till Now</th>
                  <th className="py-3 px-3 text-right text-cyan-400">Saved by Age 54</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                {analyzedFunds.map((f) => (
                  <tr key={f.id}>
                    <td className="py-3 px-4 font-bold text-white">{f.name}</td>
                    <td className="py-3 px-3 text-center text-rose-400">
                      {f.pType === "regular" ? `-${f.baseTerDiff.toFixed(2)}%/yr` : "0.00% (Direct)"}
                    </td>
                    <td className="py-3 px-3 text-right text-white">{formatINR(f.curVal)}</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      {formatINR(f.directEquivalentVal)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-300">
                      {formatINR(f.rawBrokeragePaid)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-400 font-black">
                      {formatINR(f.totalLostTillNow)}
                    </td>
                    <td className="py-3 px-3 text-right text-cyan-400 font-bold">
                      +{formatINR(f.futureSavedAt54)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePanel === "tax_roadmap" && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-cyan-950/30 to-zinc-950 border border-cyan-500/40 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold">
                Fund-Specific Section 112A LTCG Tax-Harvesting Schedule (₹1.25 Lakh/yr Tax-Free Quota)
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                Exact Units &amp; Amounts to Switch per Fund Without Paying Capital Gains Tax
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel("none")}
              className="text-xs font-mono text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              Close ✕
            </button>
          </div>

          {switchSchedule.length === 0 ? (
            <p className="text-xs font-mono text-emerald-400">
              ✓ All your mutual funds are already in Direct Plans or have no taxable regular gains!
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Regular Fund Name</th>
                    <th className="py-3 px-3 text-center">Step 1: Running SIP</th>
                    <th className="py-3 px-3 text-right">Tranche 1 (Now – Mar 31)</th>
                    <th className="py-3 px-3 text-right">Tranche 2 (Apr 1 Next FY)</th>
                    <th className="py-3 px-3 text-center text-emerald-400">Tax on Tranches</th>
                    <th className="py-3 px-3 text-right">Remaining Break-Even</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                  {switchSchedule.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {s.name}
                        <span className="block text-[10px] text-zinc-400 font-normal">
                          Buy NAV: ₹{s.avgBuyNav.toFixed(2)} | Live NAV: ₹{s.nav.toFixed(2)} | Gain/Unit: ₹
                          {s.profitPerUnit.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {s.activeSip > 0 ? (
                          <span className="text-emerald-400 font-bold">
                            Move ₹{s.activeSip.toLocaleString("en-IN")}/mo SIP to Direct Today (₹0 Tax)
                          </span>
                        ) : (
                          <span className="text-zinc-500">No Active SIP</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-white block">
                          Switch {formatINR(s.fy1RedeemAmount)}
                        </span>
                        <span className="text-[10px] text-cyan-400">
                          ({s.fy1UnitsToRedeem.toLocaleString("en-IN")} units • Gain: {formatINR(s.fy1GainUsed)})
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {s.fy2RedeemAmount > 0 ? (
                          <>
                            <span className="font-bold text-white block">
                              Switch {formatINR(s.fy2RedeemAmount)}
                            </span>
                            <span className="text-[10px] text-cyan-400">
                              ({s.fy2UnitsToRedeem.toLocaleString("en-IN")} units • Gain: {formatINR(s.fy2GainUsed)})
                            </span>
                          </>
                        ) : (
                          <span className="text-emerald-400">100% Switched in FY1</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center text-emerald-400 font-bold">
                        ₹0 Tax (Sec 112A)
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {s.residualProfit > 0 ? (
                          <div>
                            <span className="text-amber-400 font-bold block">
                              Break-even: {s.breakEvenMonths} mos
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              12.5% tax ({formatINR(s.residualTax)}) vs {formatINR(s.annualLossToday)}/yr fee
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-400 font-bold">₹0 Remainder</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 font-mono text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingId ? "Edit Mutual Fund Scheme" : "Add Mutual Fund Scheme to Portfolio"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-4">
              <div className="relative">
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                  1. Search Mutual Fund Scheme (Fetches Live Online NAV)
                </label>
                <input
                  type="text"
                  required
                  value={schemeName}
                  onChange={(e) => handleSchemeSearch(e.target.value)}
                  placeholder="Type fund name (e.g. Parag Parikh Flexi Cap, HDFC Top 100)..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-emerald-500"
                />
                {isSearching && (
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    Searching AMFI directory...
                  </span>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-zinc-800">
                    {searchResults.map((s) => (
                      <button
                        key={s.schemeCode}
                        type="button"
                        onClick={() => handleSelectScheme(s)}
                        className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs block truncate"
                      >
                        <span className="text-emerald-400 font-bold mr-2">#{s.schemeCode}</span>
                        {s.schemeName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                    2. Plan Type
                  </label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as "regular" | "direct")}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="regular">Regular (Indirect / Broker)</option>
                    <option value="direct">Direct Plan</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                    Investing Since Year
                  </label>
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    {[
                      2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021,
                      2022, 2023, 2024, 2025, 2026,
                    ].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} ({currentYear - yr} yrs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div>
                  <label className="text-emerald-400 block mb-1 uppercase text-[10px] font-bold">
                    3. Present Units Held
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={unitsHeld}
                    onChange={(e) => setUnitsHeld(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-cyan-400 block mb-1 uppercase text-[10px] font-bold">
                    Live NAV (₹)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={liveNav}
                    onChange={(e) => setLiveNav(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                    Present Value (Auto)
                  </label>
                  <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-white font-black">
                    {formatINR(Math.round(unitsHeld * liveNav))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                  Total Invested Principal Cost (₹) — Used for Sec 112A Capital Gains Tax
                </label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-emerald-400 uppercase text-[10px] font-bold">
                    4. Running Monthly SIP in This Fund?
                  </label>
                  <input
                    type="checkbox"
                    checked={hasRunningSip}
                    onChange={(e) => setHasRunningSip(e.target.checked)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                </div>

                {hasRunningSip && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                        Monthly SIP Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={sipAmount}
                        onChange={(e) => setSipAmount(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                        Monthly SIP Date (Day)
                      </label>
                      <select
                        value={sipDay}
                        onChange={(e) => setSipDay(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                      >
                        {[1, 5, 7, 10, 15, 20, 25, 28].map((d) => (
                          <option key={d} value={d}>
                            Day {d} of every month
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="col-span-2 text-[10px] text-emerald-400">
                      ✓ Auto-adds ~{liveNav > 0 ? ((sipAmount * 0.99995) / liveNav).toFixed(2) : 0}{" "}
                      units every month (SIP ÷ Live NAV).
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                    Expected CAGR %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cagr}
                    onChange={(e) => setCagr(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-rose-400 block mb-1 uppercase text-[10px]">
                    Regular TER %
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={regularTER}
                    onChange={(e) => setRegularTER(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-rose-400 text-center"
                  />
                </div>
                <div>
                  <label className="text-emerald-400 block mb-1 uppercase text-[10px]">
                    Direct TER %
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={directTER}
                    onChange={(e) => setDirectTER(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-emerald-400 text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400"
                >
                  Save to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
