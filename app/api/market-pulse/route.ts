import { NextResponse } from "next/server";

export const revalidate = 3600;

type DataStatus = "LIVE" | "UNAVAILABLE";
type MarketContext = "PULLBACK" | "NEAR_HIGH" | "NEUTRAL" | "UNAVAILABLE";

export interface MarketPulseData {
  dataStatus: DataStatus;
  indexName: string;
  currentPrice: number | null;
  changePercent: number | null;
  high52w: number | null;
  dropFromHighPct: number | null;
  dma200: number | null;
  distanceFrom200DMAPct: number | null;
  marketContext: MarketContext;
  headline: string;
  scenario: { equity: string; debt: string; summary: string };
  source: { name: string; observedAt: string | null; retrievedAt: string };
  methodology: string;
  disclaimer: string;
}

function unavailableResponse(): MarketPulseData {
  return {
    dataStatus: "UNAVAILABLE", indexName: "Nifty 50", currentPrice: null,
    changePercent: null, high52w: null, dropFromHighPct: null, dma200: null,
    distanceFrom200DMAPct: null, marketContext: "UNAVAILABLE",
    headline: "Market data is currently unavailable",
    scenario: {
      equity: "Use your written asset-allocation plan rather than reacting to an unavailable market signal.",
      debt: "Compare any loan prepayment with your cash reserve, loan terms, tax position, and financial goals.",
      summary: "No market-based scenario is being shown until a current source response is available.",
    },
    source: { name: "Yahoo Finance chart endpoint", observedAt: null, retrievedAt: new Date().toISOString() },
    methodology: "No data was available. The app intentionally does not substitute historical sample values for live market information.",
    disclaimer: "Educational information only; not investment, tax, or lending advice.",
  };
}

export async function GET() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1y",
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const closes: number[] = (result?.indicators?.quote?.[0]?.close || []).filter(
      (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)
    );
    if (closes.length < 2) throw new Error("Insufficient close prices");

    const currentPrice = Math.round(closes.at(-1) as number);
    const prevClose = Math.round(closes.at(-2) as number);
    const changePercent = Number((((currentPrice - prevClose) / prevClose) * 100).toFixed(2));
    const high52w = Math.round(Math.max(...closes));
    const dropFromHighPct = Number((((high52w - currentPrice) / high52w) * 100).toFixed(1));
    const last200 = closes.slice(-200);
    const dma200 = Math.round(last200.reduce((sum, price) => sum + price, 0) / last200.length);
    const distanceFrom200DMAPct = Number((((currentPrice - dma200) / dma200) * 100).toFixed(1));

    let marketContext: MarketContext = "NEUTRAL";
    let headline = "Technical context: within its recent range";
    let equity = "Scenario to consider: continue the asset allocation and SIP amount already documented in your plan.";
    let debt = "Scenario to consider: evaluate loan prepayment separately using your actual interest rate, liquidity needs, and tax treatment.";
    let summary = "Technical indicators are context, not a forecast or a timing instruction.";

    if (dropFromHighPct >= 7 || distanceFrom200DMAPct <= -2) {
      marketContext = "PULLBACK";
      headline = "Technical context: recent pullback";
      equity = "Scenario to consider: compare a pre-planned rebalancing contribution with maintaining your normal SIP; do not use emergency reserves.";
      debt = "Keep debt servicing on schedule while comparing any optional prepayment against your written liquidity target.";
      summary = "Prices are below a recent reference point; this does not establish future returns or suitability.";
    } else if (distanceFrom200DMAPct >= 10) {
      marketContext = "NEAR_HIGH";
      headline = "Technical context: elevated versus 200-day average";
      equity = "Scenario to consider: check whether your equity allocation exceeds its target before adding unplanned lump-sum exposure.";
      debt = "Compare prepayment and investment options only after preserving your cash reserve and reviewing the loan’s prepayment terms.";
      summary = "A technical level above its moving average is not a sell signal or a return forecast.";
    }

    const timestamp = result?.timestamp?.at(-1);
    const observedAt = typeof timestamp === "number" ? new Date(timestamp * 1000).toISOString() : null;

    return NextResponse.json({
      dataStatus: "LIVE", indexName: "Nifty 50", currentPrice, changePercent, high52w,
      dropFromHighPct, dma200, distanceFrom200DMAPct, marketContext, headline,
      scenario: { equity, debt, summary },
      source: { name: "Yahoo Finance chart endpoint", observedAt, retrievedAt: new Date().toISOString() },
      methodology: "Context uses the latest available close, the highest close in the returned one-year series, and a simple 200-observation moving average. It does not estimate valuation or expected returns.",
      disclaimer: "Educational information only; not investment, tax, or lending advice.",
    } satisfies MarketPulseData);
  } catch {
    return NextResponse.json(unavailableResponse());
  }
}
