interface PieChartProps {
  categories: {
    category: string;
    amount: number;
    color: string;
  }[];
  size?: number;
}

interface SliceData {
  category: string;
  amount: number;
  color: string;
  endAngle: number;
  path: string;
  percent: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function PieChart({ categories, size = 200 }: PieChartProps) {
  const total = categories.reduce((sum, c) => sum + c.amount, 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;

  const slices = categories.reduce<SliceData[]>((acc, cat) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const sliceAngle = total > 0 ? (cat.amount / total) * 360 : 0;
    const startAngle = prevEnd;
    const endAngle = prevEnd + sliceAngle;

    acc.push({
      ...cat,
      endAngle,
      path: sliceAngle > 0 ? describeSlice(cx, cy, radius, startAngle, endAngle) : "",
      percent: total > 0 ? Math.round((cat.amount / total) * 1000) / 10 : 0,
    });
    return acc;
  }, []);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-dashed border-zinc-700 font-mono text-xs text-zinc-600"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s) =>
          s.path ? (
            <path
              key={s.category}
              d={s.path}
              fill={s.color}
              stroke="#0a0a0c"
              strokeWidth={1.5}
              className="transition-opacity hover:opacity-80"
            />
          ) : null
        )}
      </svg>
    </div>
  );
}
