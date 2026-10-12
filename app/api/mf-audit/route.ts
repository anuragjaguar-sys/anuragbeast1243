import { NextResponse } from "next/server";

const CATEGORY_BENCHMARKS: Record<string, { regularTER: number; directTER: number; avgCAGR: number }> = {
  flexicap: { regularTER: 1.70, directTER: 0.65, avgCAGR: 14.5 },
  largecap: { regularTER: 1.65, directTER: 0.70, avgCAGR: 12.8 },
  midcap: { regularTER: 1.85, directTER: 0.75, avgCAGR: 16.2 },
  smallcap: { regularTER: 1.95, directTER: 0.70, avgCAGR: 18.0 },
  index: { regularTER: 0.60, directTER: 0.15, avgCAGR: 13.0 },
  hybrid: { regularTER: 1.60, directTER: 0.55, avgCAGR: 11.5 },
  default: { regularTER: 1.75, directTER: 0.70, avgCAGR: 13.5 },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "search";
  const query = searchParams.get("q") || "";

  let benchmarks = CATEGORY_BENCHMARKS.default;
  const qLower = query.toLowerCase();

  if (qLower.includes("index") || qLower.includes("nifty")) {
    benchmarks = CATEGORY_BENCHMARKS.index;
  } else if (qLower.includes("small")) {
    benchmarks = CATEGORY_BENCHMARKS.smallcap;
  } else if (qLower.includes("mid")) {
    benchmarks = CATEGORY_BENCHMARKS.midcap;
  } else if (qLower.includes("large") || qLower.includes("bluechip")) {
    benchmarks = CATEGORY_BENCHMARKS.largecap;
  } else if (qLower.includes("flexi") || qLower.includes("multi")) {
    benchmarks = CATEGORY_BENCHMARKS.flexicap;
  } else if (qLower.includes("hybrid") || qLower.includes("balanced")) {
    benchmarks = CATEGORY_BENCHMARKS.hybrid;
  }

  // 1. Search schemes
  let schemes = [];
  if (query.length >= 3) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        schemes = (data || []).slice(0, 10);
      }
    } catch (e) {}
  }

  return NextResponse.json({
    query,
    schemes,
    benchmarks,
  });
}
