"use client";

import { useState } from "react";
import Link from "next/link";
import DirectVsRegularMigrator from "@/components/investments/DirectVsRegularMigrator";

export default function InvestmentsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Mutual Fund & Investment Analytics</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Track all mutual funds, simulate monthly SIP unit accumulation, audit commission leakage, and plan zero-tax conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portfolio"
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-mono font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
          >
            Manage Raw Assets →
          </Link>
        </div>
      </div>

      {/* THE COMPLETE MULTI-FUND BUCKET & ZERO-TAX ENGINE */}
      <DirectVsRegularMigrator />
    </main>
  );
}
