import { NextResponse } from "next/server";

// Typical expense ratio benchmarks across Indian mutual fund categories
const CATEGORY_BENCHMARKS: Record<string, { regularTER: number; directTER: number }> = {
  flexicap: { regularTER: 1.70, directTER: 0.65 },
  largecap: { regularTER: 1.65, directTER: 0.70 },
  midcap: { regularTER: 1.85, directTER: 0.75 },
  smallcap: { regularTER: 1.95, directTER: 0.70 },
  index: { regularTER: 0.60, directTER: 0.15 },
  hybrid: { regularTER: 1.60, directTER: 0.55 },
  default: { regularTER: 1.75, directTER: 0.70 },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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

  // Query public Indian MF directory if query is provided
  let schemes = [];
  if (query.length >= 3) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        schemes = (data || []).slice(0, 8);
      }
    } catch (e) {
      // Graceful fallback to offline benchmarks
    }
  }

  return NextResponse.json({
    query,
    schemes,
    benchmarks: {
      regularTER: benchmarks.regularTER,
      directTER: benchmarks.directTER,
      terDifference: Number((benchmarks.regularTER - benchmarks.directTER).toFixed(2)),
    },
  });
}
