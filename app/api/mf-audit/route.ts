import { NextResponse } from "next/server";

const CATEGORY_BENCHMARKS: Record<string, { regularTER: number; directTER: number; avgCAGR: number }> = {
  flexicap: { regularTER: 1.70, directTER: 0.65, avgCAGR: 14.8 },
  largecap: { regularTER: 1.65, directTER: 0.70, avgCAGR: 13.2 },
  midcap: { regularTER: 1.85, directTER: 0.75, avgCAGR: 16.2 },
  smallcap: { regularTER: 1.95, directTER: 0.70, avgCAGR: 17.8 },
  index: { regularTER: 0.60, directTER: 0.15, avgCAGR: 13.0 },
  hybrid: { regularTER: 1.60, directTER: 0.55, avgCAGR: 11.8 },
  default: { regularTER: 1.75, directTER: 0.65, avgCAGR: 14.5 },
};

function getBenchmarks(query: string) {
  const qLower = query.toLowerCase();
  if (qLower.includes("index") || qLower.includes("nifty")) return CATEGORY_BENCHMARKS.index;
  if (qLower.includes("small")) return CATEGORY_BENCHMARKS.smallcap;
  if (qLower.includes("mid")) return CATEGORY_BENCHMARKS.midcap;
  if (qLower.includes("large") || qLower.includes("bluechip")) return CATEGORY_BENCHMARKS.largecap;
  if (qLower.includes("flexi") || qLower.includes("multi")) return CATEGORY_BENCHMARKS.flexicap;
  if (qLower.includes("hybrid") || qLower.includes("balanced")) return CATEGORY_BENCHMARKS.hybrid;
  return CATEGORY_BENCHMARKS.default;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "search";
  const query = searchParams.get("q") || "";
  const schemeCode = searchParams.get("code") || "";

  // Action 1: Fetch live NAV for a specific AMFI schemeCode
  if (action === "nav" && schemeCode) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}/latest`, {
        next: { revalidate: 1800 },
      });
      if (res.ok) {
        const data = await res.json();
        const latest = data?.data?.[0];
        const nav = latest ? parseFloat(latest.nav) : null;
        const date = latest?.date || "";
        const schemeName = data?.meta?.scheme_name || query;
        const benchmarks = getBenchmarks(schemeName);
        return NextResponse.json({
          schemeCode,
          schemeName,
          nav: nav && !isNaN(nav) ? nav : null,
          date,
          benchmarks,
        });
      }
    } catch (e) {}

    // Fallback to full endpoint if /latest is unavailable
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`, {
        next: { revalidate: 1800 },
      });
      if (res.ok) {
        const data = await res.json();
        const latest = data?.data?.[0];
        const nav = latest ? parseFloat(latest.nav) : null;
        const date = latest?.date || "";
        const schemeName = data?.meta?.scheme_name || query;
        const benchmarks = getBenchmarks(schemeName);
        return NextResponse.json({
          schemeCode,
          schemeName,
          nav: nav && !isNaN(nav) ? nav : null,
          date,
          benchmarks,
        });
      }
    } catch (e) {}

    return NextResponse.json({ schemeCode, nav: null, date: "" });
  }

  // Action 2: Search schemes by name
  const benchmarks = getBenchmarks(query);
  let schemes: any[] = [];
  if (query.length >= 3) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        schemes = (data || []).slice(0, 12);
      }
    } catch (e) {}
  }

  return NextResponse.json({
    query,
    schemes,
    benchmarks,
  });
}
