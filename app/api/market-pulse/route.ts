import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache market data for 1 hour

export interface MarketPulseData {
  indexName: string;
  currentPrice: number;
  changePercent: number;
  high52w: number;
  dropFromHighPct: number;
  dma200: number;
  distanceFrom200DMAPct: number;
  estimatedPE: number;
  valuationZone: "OPPORTUNITY" | "FAIR_VALUE" | "OVERHEATED";
  headline: string;
  recommendation: {
    equityAction: string;
    prepayAction: string;
    summary: string;
  };
  lastUpdated: string;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1y",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const closes: number[] = (result?.indicators?.quote?.[0]?.close || []).filter(
      (c: any): c is number => typeof c === "number" && !isNaN(c)
    );

    if (closes.length === 0) throw new Error("No close prices found");

    const currentPrice = Math.round(closes[closes.length - 1]);
    const prevClose = Math.round(closes[closes.length - 2] || currentPrice);
    const changePercent = Number((((currentPrice - prevClose) / prevClose) * 100).toFixed(2));

    const high52w = Math.round(Math.max(...closes));
    const dropFromHighPct = Number((((high52w - currentPrice) / high52w) * 100).toFixed(1));

    const last200 = closes.slice(-200);
    const dma200 = Math.round(last200.reduce((sum, p) => sum + p, 0) / last200.length);
    const distanceFrom200DMAPct = Number((((currentPrice - dma200) / dma200) * 100).toFixed(1));

    const estimatedPE = Number((21.5 * (1 + distanceFrom200DMAPct / 100)).toFixed(1));

    let valuationZone: "OPPORTUNITY" | "FAIR_VALUE" | "OVERHEATED" = "FAIR_VALUE";
    let headline = "Fair Value Range";
    let equityAction = "Maintain baseline systematic monthly SIP pace.";
    let prepayAction = "Continue scheduled monthly loan prepayments.";
    let summary = "Nifty 50 is trading in fair-value territory. Maintain balanced execution.";

    if (dropFromHighPct >= 7 || distanceFrom200DMAPct <= -2) {
      valuationZone = "OPPORTUNITY";
      headline = "Market Dip / High Opportunity Zone";
      equityAction = `Market is down ${dropFromHighPct}% from high. Accelerate equity SIP (+20%) using surplus cash while units are discounted.`;
      prepayAction = "Maintain regular loan EMI; prioritize equity accumulation over extra prepayments.";
      summary = "Equity valuations are attractive. Higher expected compounding on investments deployed in this window.";
    } else if (distanceFrom200DMAPct >= 10 || estimatedPE >= 24) {
      valuationZone = "OVERHEATED";
      headline = "Market Stretched / Bull Run Peak";
      equityAction = "Keep regular SIPs active, but avoid fresh unallocated lump-sum equity entries.";
      prepayAction = "Channel extra monthly surplus into Home Loan Prepayment (guaranteed 8.5% risk-free return).";
      summary = "Equity valuations are extended. Prepaying loan principal yields higher guaranteed risk-adjusted returns.";
    }

    const payload: MarketPulseData = {
      indexName: "Nifty 50",
      currentPrice,
      changePercent,
      high52w,
      dropFromHighPct,
      dma200,
      distanceFrom200DMAPct,
      estimatedPE,
      valuationZone,
      headline,
      recommendation: { equityAction, prepayAction, summary },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (_err) {
    // Robust fallback if external network is unavailable
    const fallback: MarketPulseData = {
      indexName: "Nifty 50",
      currentPrice: 24850,
      changePercent: 0.2,
      high52w: 26277,
      dropFromHighPct: 5.4,
      dma200: 23600,
      distanceFrom200DMAPct: 5.3,
      estimatedPE: 22.4,
      valuationZone: "FAIR_VALUE",
      headline: "Fair Value Equilibrium",
      recommendation: {
        equityAction: "Maintain baseline systematic monthly SIP pace.",
        prepayAction: "Continue scheduled monthly home loan prepayment.",
        summary: "Market is within historical fair-value band. Stick to disciplined monthly execution.",
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(fallback);
  }
}
