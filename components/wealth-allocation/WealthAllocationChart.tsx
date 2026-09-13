import type { WealthBucket } from "@/lib/wealth-allocation-engine";

interface WealthAllocationChartProps {
  buckets: WealthBucket[];
}

interface ChartSegment {
  bucket: WealthBucket;
  path: string;
  percentage: number;
  endPercentage: number;
}

export default function WealthAllocationChart({ buckets }: WealthAllocationChartProps) {
  // Calculate SVG pie chart
  const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);

  const segments = buckets.reduce<ChartSegment[]>((acc, bucket) => {
    const startPercentage = acc.length > 0 ? acc[acc.length - 1].endPercentage : 0;
    const percentage = total > 0 ? (bucket.amount / total) * 100 : 0;
    const endPercentage = startPercentage + percentage;

    // Convert to radians
    const startAngle = (startPercentage / 100) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (endPercentage / 100) * 2 * Math.PI - Math.PI / 2;

    // Calculate coordinates
    const x1 = 50 + 40 * Math.cos(startAngle);
    const y1 = 50 + 40 * Math.sin(startAngle);
    const x2 = 50 + 40 * Math.cos(endAngle);
    const y2 = 50 + 40 * Math.sin(endAngle);

    // Determine if arc should be large
    const largeArcFlag = percentage > 50 ? 1 : 0;

    // Create path
    const path = percentage === 100
      ? `M 50 50 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0`
      : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    acc.push({
      bucket,
      path,
      percentage,
      endPercentage,
    });

    return acc;
  }, []);

  const colorMap: Record<string, string> = {
    "Wealth Creation": "#10b981",
    "Essential Living": "#3b82f6",
    "Lifestyle": "#8b5cf6",
    "Safety": "#f59e0b",
    "Unallocated": "#71717a",
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Allocation Breakdown</h3>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          5-bucket wealth framework
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Pie Chart */}
        <div className="relative h-48 w-48 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.path}
                fill={colorMap[segment.bucket.name] || "#71717a"}
                stroke="#18181b"
                strokeWidth="0.5"
                className="transition-opacity duration-200 hover:opacity-80"
              />
            ))}
          </svg>
          {/* Center hole for donut effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-zinc-900/90" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {buckets.map((bucket) => (
            <div key={bucket.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colorMap[bucket.name] || "#71717a" }}
                />
                <span className="text-sm text-zinc-300">{bucket.name}</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm text-white">{bucket.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
