interface MonthlyWealthScoreProps {
  score: number;
}

export default function MonthlyWealthScore({ score }: MonthlyWealthScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-emerald-500";
    if (score >= 60) return "stroke-blue-500";
    if (score >= 40) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Monthly Wealth Score</h3>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          Allocation quality assessment
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative h-48 w-48">
          <svg className="h-48 w-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-zinc-800"
            />
            <circle
              cx="96"
              cy="96"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${getScoreRingColor(score)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-400">Out of 100</p>
      </div>
    </div>
  );
}
