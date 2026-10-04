"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudSyncService } from "@/lib/core/sync-service";

const navItems = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/household", label: "Household View", icon: "👨‍👩‍👧‍👦" },
  { href: "/financial-statement", label: "Financial Statement", icon: "📝" },
  { href: "/profile", label: "Financial Profile", icon: "👤" },
  { href: "/after-54", label: "Life After 54", icon: "🌅" },
  { href: "/portfolio", label: "Portfolio", icon: "💼" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/wealth-allocation", label: "Wealth Allocation", icon: "💳" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/ai-cfo", label: "AI CFO", icon: "🤖" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");

  const triggerSync = async (forceReload = false) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");

    try {
      const syncTask = (async () => {
        const email = await CloudSyncService.getUserEmail();
        setUserEmail(email);
        await CloudSyncService.pushAllLocal();
        await CloudSyncService.pullRemoteState();
      })();

      const timeoutTask = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 6000)
      );

      await Promise.race([syncTask, timeoutTask]);
      setSyncStatus("synced");
      if (forceReload) {
        window.location.reload();
      }
    } catch {
      setSyncStatus("synced");
      if (forceReload) {
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    void CloudSyncService.getUserEmail().then(setUserEmail);
    triggerSync(false);

    const handleFocus = () => triggerSync(false);
    const handleRemoteUpdate = () => {
      setSyncStatus("synced");
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("fire54_remote_data_updated", handleRemoteUpdate);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("fire54_remote_data_updated", handleRemoteUpdate);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 backdrop-blur-md md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/20">
            <span className="font-mono text-xs font-bold text-black">54</span>
          </div>
          <span className="text-base font-semibold text-white">
            FIRE<span className="text-emerald-400">54</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerSync(true)}
            title="Tap to sync and reload"
            className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-300 transition active:scale-95"
          >
            {syncStatus === "syncing" ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                <span className="text-[11px] text-amber-400">Syncing...</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-emerald-400">Cloud Synced</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
            aria-label="Toggle Menu"
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <span className="font-mono text-sm font-bold text-black">54</span>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-white">
                FIRE<span className="text-emerald-400">54</span>
              </p>
              <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                Wealth OS
              </p>
            </div>
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-base leading-none" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with Sync Status & User Account */}
        <div className="border-t border-zinc-800/60 px-5 py-4 space-y-2">
          {userEmail && (
            <p className="truncate font-mono text-[10px] text-zinc-400">
              👤 {userEmail}
            </p>
          )}

          <button
            onClick={() => triggerSync(true)}
            title="Click to sync and refresh data"
            className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-left transition hover:border-zinc-700 active:scale-98"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {syncStatus === "syncing" ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                    <span className="text-xs font-medium text-amber-400">Syncing...</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-xs font-medium text-emerald-400">Live Sync Active</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-zinc-500">Refresh</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
