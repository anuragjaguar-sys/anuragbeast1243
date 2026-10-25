"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InvestmentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/portfolio");
  }, [router]);

  return (
    <main className="mx-auto max-w-4xl p-12 text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">
        Mutual Funds &amp; Investment Analytics Moved to Portfolio
      </h1>
      <p className="text-sm text-zinc-400">
        Your Portfolio is now the single source of truth for all Mutual Funds, live AMFI NAVs, brokerage audits, and Section 112A switch plans.
      </p>
      <Link
        href="/portfolio"
        className="inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition"
      >
        Go to Portfolio →
      </Link>
    </main>
  );
}
