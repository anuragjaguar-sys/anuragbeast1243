import type { ExpenseCategory } from "@/lib/spending-analytics";

type PieChartProps = {
  categories: ExpenseCategory[];
  size?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function PieChart({ categories, size = 220 }: PieChartProps) {
  const total = categories.reduce((sum, c) => sum + c.amount, 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;

  let currentAngle = 0;
  const slices = categories.map((cat) => {
    const sliceAngle = total > 0 ? (cat.amount / total) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      ...cat,
      path: sliceAngle > 0 ? describeSlice(cx, cy, radius, startAngle, endAngle) : "",
      percent: total > 0 ? Math.round((cat.amount / total) * 1000) / 10 : 0,
    };
  });

  return (
    <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
          {slices.map((slice) =>
            slice.path ? (
              <path
                key={slice.id}
                d={slice.path}
                fill={slice.color}
                className="transition-opacity duration-200 hover:opacity-80"
              />
            ) : null
          )}
          <circle cx={cx} cy={cy} r={radius * 0.55} fill="#0a0a0c" />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-zinc-500 font-mono text-[9px] uppercase"
            style={{ fontSize: 9 }}
          >
            Total
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            className="fill-white font-semibold"
            style={{ fontSize: 14 }}
          >
            {total >= 100_000 ? `₹${(total / 100_000).toFixed(1)}L` : `₹${(total / 1000).toFixed(0)}k`}
          </text>
        </svg>
      </div>

      <ul className="grid w-full max-w-xs grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-sm lg:grid-cols-1">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-300">{slice.category}</p>
              <p className="font-mono text-xs text-zinc-500">{slice.percent}%</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
