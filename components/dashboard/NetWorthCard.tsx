"use client";

import { getWealthMetrics } from "@/lib/wealth/wealth-engine";

export default function NetWorthCard() {
  const metrics = getWealthMetrics();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          💰 Net Worth
        </h2>

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
      </div>
    </div>
  );
}