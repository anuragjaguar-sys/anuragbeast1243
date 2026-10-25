"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MarketPulseData } from "@/app/api/market-pulse/route";

export default function AthenaTacticalBarometer() {
  const [data, setData] = useState<MarketPulseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market-pulse")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 animate-pulse">
        <div className="h-5 w-48 bg-zinc-800 rounded mb-4" />
        <div className="h-20 bg-zinc-900 rounded-2xl" />
      </div>
    );
  }

  const isPullback = data.marketContext === "PULLBACK";
  const isNearHigh = data.marketContext === "NEAR_HIGH";
  const isLive = data.dataStatus === "LIVE";
  const changePercent = data.changePercent ?? 0;

  const badgeColor = isPullback
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    : isNearHigh
    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
    : "bg-blue-500/10 text-blue-400 border-blue-500/30";

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md shadow-blue-500/20">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Athena Market Context</h2>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-zinc-900 border-zinc-700 text-zinc-300">
                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-amber-400"}`} />
                {isLive ? "Source data" : "Source unavailable"}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Technical context for reviewing a written financial plan — not a market-timing signal
            </p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-bold tracking-wide ${badgeColor}`}>
          <span>{isPullback ? "⚡" : isNearHigh ? "🛡️" : "⚖️"}</span>
          <span>{data.headline}</span>
        </span>
      </div>

      {isLive ? <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <p className="font-mono text-[10px] uppercase text-zinc-400">Nifty 50 Level</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-white">
              {data.currentPrice?.toLocaleString("en-IN")}
            </span>
            <span className={`text-xs font-mono font-semibold ${changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <p className="font-mono text-[10px] uppercase text-zinc-400">From 52W High</p>
          <p className="mt-1 text-xl font-bold font-mono text-white">
            {(data.dropFromHighPct ?? 0) > 0 ? `-${data.dropFromHighPct}%` : "At High"}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <p className="font-mono text-[10px] uppercase text-zinc-400">200-Day Moving Avg</p>
          <p className="mt-1 text-xl font-bold font-mono text-white">
            {data.dma200?.toLocaleString("en-IN")}
          </p>
        </div>
      </div> : <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
        No sample market values are displayed. Check your plan directly until the source is available again.
      </div>}

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
          💡 Scenario prompts
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="font-semibold text-emerald-400 block mb-1">📈 Equity allocation:</span>
            <p className="text-zinc-300 leading-relaxed">{data.scenario.equity}</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="font-semibold text-blue-400 block mb-1">🏠 Debt and cash:</span>
            <p className="text-zinc-300 leading-relaxed">{data.scenario.debt}</p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-zinc-800/60">
          <p className="text-zinc-400 italic">“{data.scenario.summary}”</p>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/portfolio"
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 font-medium text-white hover:bg-zinc-700 transition"
            >
              Adjust Portfolio →
            </Link>
            <Link
              href="/financial-statement"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 font-medium text-white hover:bg-emerald-500 transition"
            >
              Log Month Cashflow →
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-zinc-500">
        Source: {data.source.name} · Observed: {data.source.observedAt ? new Date(data.source.observedAt).toLocaleString("en-IN") : "not available"} · Retrieved: {new Date(data.source.retrievedAt).toLocaleString("en-IN")}. {data.methodology} {data.disclaimer}
      </p>
    </div>
  );
}
