"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SpendingAnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new Wealth Allocation page
    router.replace("/wealth-allocation");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] text-zinc-100">
      <p className="text-zinc-500">Redirecting to Wealth Allocation...</p>
    </div>
  );
}
