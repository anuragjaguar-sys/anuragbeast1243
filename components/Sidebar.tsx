"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/monthly-entry", label: "Monthly Entry", icon: "📅" },
  { href: "/spending-analytics", label: "Spending Analytics", icon: "💳" },
  { href: "/investments", label: "Investments", icon: "📈" },
  { href: "/home-loan", label: "Home Loan", icon: "🏦" },
  { href: "/goals", label: "Goals", icon: "🎯" },
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

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl">
      {/* Logo */}
      <div className="border-b border-zinc-800/60 px-5 py-6">
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
      </div>

      {/* Navigation */}
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

      {/* Footer */}
      <div className="border-t border-zinc-800/60 px-5 py-4">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-3 py-3">
          <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
            Portfolio Status
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400">On track for FIRE</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
