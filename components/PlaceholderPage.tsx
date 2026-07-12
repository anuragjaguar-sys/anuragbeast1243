type FeatureCard = {
  title: string;
  description: string;
  icon: string;
};

type PlaceholderPageProps = {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  features: FeatureCard[];
  accent?: "emerald" | "blue" | "violet" | "amber" | "rose";
};

const accentStyles = {
  emerald: {
    glow: "bg-emerald-500/[0.04]",
    badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    icon: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    border: "border-emerald-500/20",
  },
  blue: {
    glow: "bg-blue-500/[0.04]",
    badge: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    icon: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    border: "border-blue-500/20",
  },
  violet: {
    glow: "bg-violet-500/[0.04]",
    badge: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    icon: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    border: "border-violet-500/20",
  },
  amber: {
    glow: "bg-amber-500/[0.04]",
    badge: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    icon: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    border: "border-amber-500/20",
  },
  rose: {
    glow: "bg-rose-500/[0.04]",
    badge: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    icon: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    border: "border-rose-500/20",
  },
};

export default function PlaceholderPage({
  icon,
  title,
  subtitle,
  description,
  features,
  accent = "emerald",
}: PlaceholderPageProps) {
  const styles = accentStyles[accent];

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full ${styles.glow} blur-[120px]`} />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[400px] rounded-full bg-zinc-500/[0.02] blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Header */}
        <header className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ring-1 ${styles.icon}`}
            >
              {icon}
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.25em] text-zinc-500 uppercase">
                {subtitle}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-400">{description}</p>
        </header>

        {/* Coming soon banner */}
        <div
          className={`mb-10 flex items-center gap-4 rounded-2xl border bg-zinc-900/40 p-5 backdrop-blur-sm ${styles.border}`}
        >
          <div className={`rounded-full px-3 py-1 font-mono text-[11px] tracking-wider uppercase ring-1 ${styles.badge}`}>
            Coming Soon
          </div>
          <p className="text-sm text-zinc-400">
            This module is under development. Preview the planned capabilities below.
          </p>
        </div>

        {/* Feature grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/80 hover:bg-zinc-900/60"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 text-lg transition-transform group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </section>

        {/* Skeleton preview */}
        <section className="mt-10 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-sm">
          <p className="mb-5 font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
            Interface Preview
          </p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-800/80" />
              <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-800/60" />
              <div className="ml-auto h-8 w-20 animate-pulse rounded-lg bg-zinc-800/40" />
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-zinc-800/40" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 animate-pulse rounded-xl bg-zinc-800/30" />
              <div className="h-20 animate-pulse rounded-xl bg-zinc-800/30" />
              <div className="h-20 animate-pulse rounded-xl bg-zinc-800/30" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
