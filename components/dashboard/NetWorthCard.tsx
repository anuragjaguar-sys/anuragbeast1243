"use client";
import { useState } from "react";

export interface NetWorthCardProps {
  metrics: {
    status: string;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    wealthScore: number;
  };
  assets: { id: string; name: string; currentValue: number }[];
  liabilities: { id: string; name: string; outstandingAmount: number }[];
}

export default function NetWorthCard({ metrics, assets, liabilities }: NetWorthCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">💰 Net Worth</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium
            ${
              metrics.status === "Excellent"
                ? "bg-green-500/20 text-green-400"
                : metrics.status === "Good"
                ? "bg-blue-500/20 text-blue-400"
                : metrics.status === "Average"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-red-500/20 text-red-400"
            }`}
        >
          {metrics.status}
        </span>
      </div>

      <div className="space-y-3 text-slate-300">
        <div className="flex justify-between">
          <span>Total Assets</span>
          <span>{formatCurrency(metrics.totalAssets)}</span>
        </div>

        <div className="flex justify-between">
          <span>Total Liabilities</span>
          <span>{formatCurrency(metrics.totalLiabilities)}</span>
        </div>

        <hr className="border-slate-700" />

        <div className="flex justify-between text-lg font-bold text-white">
          <span>Net Worth</span>
          <span>{formatCurrency(metrics.netWorth)}</span>
        </div>

        <div className="pt-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>Wealth Score</span>
            <span>{metrics.wealthScore}/100</span>
          </div>
          <div className="h-3 rounded-full bg-slate-700">
            <div
              className="h-3 rounded-full bg-emerald-500"
              style={{ width: `${metrics.wealthScore}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowBreakdown((visible) => !visible)}
          className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white"
        >
          {showBreakdown ? "Hide breakdown" : "View net worth breakdown"}
        </button>

        {showBreakdown && (
          <div className="space-y-5 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
            <BreakdownSection
              title="Assets"
              items={assets}
              total={metrics.totalAssets}
              formatCurrency={formatCurrency}
              emptyMessage="No assets have been added to Portfolio yet."
            />
            <BreakdownSection
              title="Liabilities"
              items={liabilities}
              total={metrics.totalLiabilities}
              formatCurrency={formatCurrency}
              emptyMessage="No liabilities have been added to Portfolio."
            />
            <div className="flex justify-between border-t border-slate-700 pt-3 font-semibold text-white">
              <span>Assets − Liabilities</span>
              <span>{formatCurrency(metrics.netWorth)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownSection({ title, items, total, formatCurrency, emptyMessage }: any) {
  return (
    <section>
      <div className="mb-2 flex justify-between text-sm font-semibold text-white">
        <span>{title}</span>
        <span>{formatCurrency(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2 text-sm text-slate-300">
          {items.map((item: any) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>{item.name}</span>
              <span className="shrink-0">{formatCurrency(item.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}