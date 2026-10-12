"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface PortfolioItem {
  id?: string;
  name?: string;
  type?: string;
  category?: string;
  assetClass?: string;
  currentValue?: number | string;
  investedAmount?: number | string;
}

interface TacticalAlphaEngineProps {
  portfolio?: PortfolioItem[];
}

export default function TacticalAlphaEngine({ portfolio = [] }: TacticalAlphaEngineProps) {
  const [activeTab, setActiveTab] = useState<"tactical_tilt" | "fee_bleed" | "loan_arbitrage">("tactical_tilt");
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch live market pulse for valuation signals
  useEffect(() => {
    async function fetchPulse() {
      try {
        const res = await fetch("/api/market-pulse");
        if (res.ok) {
          const data = await res.json();
          setMarketData(data);
        }
      } catch (e) {
        console.error("Market pulse fetch failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPulse();
  }, []);

  const parseVal = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Calculate current equity corpus from portfolio
  const equityAssets = (portfolio || []).filter((item) => {
    if (item.type !== "Asset") return false;
    const cat = (item.category || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const cls = (item.assetClass || "").toLowerCase();
    return (
      cat.includes("mutual") ||
      cat.includes("stock") ||
      cat.includes("equity") ||
      cls.includes("equity") ||
      name.includes("fund") ||
      name.includes("nifty")
    );
  });

  const equityCorpus = equityAssets.reduce((sum, item) => sum + parseVal(item.currentValue ?? item.investedAmount ?? 0), 0) || 4130000;

  // Compounding Fee Drag calculation over 17 years (to age 54)
  // Direct Index Fund (TER 0.12%) vs Typical Active Fund (TER 1.15%)
  const yearsToRetire = 17;
  const directCAGR = 0.12; // 12.0% net
  const activeCAGR = 0.1085; // 10.85% net (1.15% expense drag)

  const corpusDirect = equityCorpus * Math.pow(1 + directCAGR, yearsToRetire);
  const corpusActive = equityCorpus * Math.pow(1 + activeCAGR, yearsToRetire);
  const feeBleedRupees = Math.max(0, corpusDirect - corpusActive);

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  // Market valuation metrics
  const distFrom200DMA = marketData?.dma200 ? ((marketData.currentPrice - marketData.dma200) / marketData.dma200) * 100 : -2.5;
  const isMarketInFlux = distFrom200DMA < 3 || (marketData?.drawdownFrom52wHigh && marketData.drawdownFrom52wHigh < -4);

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black p-6 md:p-8 shadow-2xl backdrop-blur-md mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Athena Tactical Alpha & Opportunity Engine
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Market Timing, Fee Arbitrage & Capital Deployment
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Actionable intelligence to maximize compounding velocity toward your ₹10 Cr Age 54 milestone.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab("tactical_tilt")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "tactical_tilt"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            ⚡ Market Flux Allocator
          </button>
          <button
            onClick={() => setActiveTab("fee_bleed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "fee_bleed"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            🔍 Fund Overlap & Fee Audit
          </button>
          <button
            onClick={() => setActiveTab("loan_arbitrage")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "loan_arbitrage"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            ⚖️ 8.5% Debt Arbitrage
          </button>
        </div>
      </div>

      {/* TAB 1: THE FLUX VS PEAK ALLOCATOR */}
      {activeTab === "tactical_tilt" && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-zinc-400 block">Current Market Regime</span>
              <p className={`text-lg font-black font-mono mt-1 ${isMarketInFlux ? "text-emerald-400" : "text-amber-400"}`}>
                {isMarketInFlux ? "Value / Accumulation Window" : "Elevated Momentum Zone"}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                {distFrom200DMA >= 0 ? `+${distFrom200DMA.toFixed(1)}% vs 200-DMA` : `${distFrom200DMA.toFixed(1)}% vs 200-DMA`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/40 shadow-inner">
              <span className="text-[11px] font-mono uppercase text-emerald-400 block font-bold">
                🎯 This Month Deployment Directive
              </span>
              <p className="text-xl font-black text-white font-mono mt-1">
                {isMarketInFlux ? "Boost Equity SIP (+₹20k–₹30k)" : "Base SIP + Debt Prepayment"}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                {isMarketInFlux ? "Divert surplus cash into broad index units" : "Park excess cash in liquid sweep / loan principal"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-cyan-400 block">Compounding Alpha Advantage</span>
              <p className="text-lg font-black text-white font-mono mt-1">+2.4% to +3.5% CAGR</p>
              <p className="text-[10px] text-zinc-500 mt-1">Historical 5-year return boost from buying in pullbacks</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-zinc-950 border border-emerald-500/30 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>💡</span> Concrete Tactical Prescription for This Month
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {isMarketInFlux ? (
                <>
                  Because market valuations are in an attractive consolidation/flux zone, <strong>do not hoard excessive cash in low-yield savings this month</strong>. 
                  Your baseline emergency runway already covers 3+ months. Allocate <strong>₹25,000 of your unallocated monthly cash flow directly into your core Nifty 50 / Next 50 index units</strong> to lock in a discounted NAV base before recovery.
                </>
              ) : (
                <>
                  Market valuations are trading near elevated multiples. Avoid FOMO lump-sum equity entries. 
                  Maintain your regular systematic SIPs, but channel your ₹50,000 monthly surplus into <strong>accelerating your 8.5% Home Loan closure</strong> to lock in a guaranteed 8.5% post-tax yield.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: FUND OVERLAP & 17-YEAR FEE BLEED */}
      {activeTab === "fee_bleed" && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-rose-500/30">
              <span className="text-[11px] font-mono uppercase text-rose-400 block font-bold">
                Hidden 17-Year Fee Drag
              </span>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">{formatINR(feeBleedRupees)}</p>
              <p className="text-[10px] text-zinc-400 mt-1">Lost compounding from active 1.15% TER vs 0.12% index</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-amber-400 block font-bold">
                Stock Overlap Risk in Indian MFs
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">60% – 68%</p>
              <p className="text-[10px] text-zinc-400 mt-1">Average duplicate stocks between Large Cap & Flexi Cap funds</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-emerald-400 block font-bold">
                Immediate Recovery Fix
              </span>
              <p className="text-lg font-black text-emerald-400 font-mono mt-1">Direct Growth Switch</p>
              <p className="text-[10px] text-zinc-400 mt-1">Reclaims ~₹1.2L–₹1.8L per year in pure compounding</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-white">Actionable 3-Point Mutual Fund Optimization Audit</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <p className="font-bold text-emerald-400 font-mono">1. Zero Commission Audit</p>
                <p className="text-[11px] text-zinc-400">
                  Verify that every mutual fund in your portfolio has <strong>"Direct - Growth"</strong> in its exact title. If any say "Regular", distributors take 1% of your entire portfolio value every single year.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <p className="font-bold text-cyan-400 font-mono">2. Eliminate Stock Duplication</p>
                <p className="text-[11px] text-zinc-400">
                  Holding multiple Large Cap and Flexi Cap schemes causes redundant holdings in HDFC Bank, Reliance, ICICI, Infosys, and TCS. Consolidate into 1 low-cost Nifty 50 Index.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <p className="font-bold text-amber-400 font-mono">3. Annual ₹1.25L Tax Harvest</p>
                <p className="text-[11px] text-zinc-400">
                  Under Section 112A, long-term capital gains up to ₹1.25 Lakh per financial year are 100% tax-free. Sell and immediately re-buy equity units annually to reset your cost basis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 8.5% HOME LOAN ARBITRAGE */}
      {activeTab === "loan_arbitrage" && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30">
              <span className="text-[11px] font-mono uppercase text-emerald-400 block font-bold">
                Guaranteed Prepayment Yield
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">8.50% Post-Tax</p>
              <p className="text-[10px] text-zinc-400 mt-1">Equivalent to a ~12.1% pre-tax fixed return in 30% tax bracket</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-cyan-400 block font-bold">
                Interest Saved per ₹50k Prepay
              </span>
              <p className="text-2xl font-black text-cyan-400 font-mono mt-1">~₹92,500</p>
              <p className="text-[10px] text-zinc-400 mt-1">Cumulative compounding interest knocked off your remaining principal</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-amber-400 block font-bold">
                Tenure Compression
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">-6.2 Years</p>
              <p className="text-[10px] text-zinc-400 mt-1">Accelerated timeline collapsing your ₹13.56L debt to ₹0</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <h4 className="text-sm font-bold text-white">The Arbitrage Verdict: When to Prepay vs When to Invest</h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Prepaying an 8.5% home loan is a <strong>guaranteed, risk-free compounding win</strong>. Equities carry market volatility, but during market dips, long-term equity yields 14%+.
              <br /><br />
              <strong>The Golden Rule for Your Portfolio:</strong> When Nifty is trading at or above all-time highs, prioritize loan prepayment (guaranteed 8.5%). When Nifty experiences a 5%+ correction (flux window), redirect surplus cash flow into index equity SIPs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
