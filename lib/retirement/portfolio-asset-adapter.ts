import type { FinancialProfile } from "@/lib/profile/profile.types";
import type { PortfolioItem } from "@/lib/investments/types";
import { loadMonthlyReview } from "@/lib/storage";

export interface ReconciledAssets {
  mutualFunds: number;
  stocks: number;
  ppf: number;
  epf: number;
  nps: number;
  property: number;
  savingsAccount: number;
  emergencyFund: number;
  homeLoanPrincipal: number;
  monthlyEMI: number;
  homeLoanInterestRate: number;
  homeLoanTenureMonths: number;
}

function parseNum(val: unknown): number {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Calculates EMI from principal, annual interest rate, and remaining months.
 */
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / tenureMonths);
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

/**
 * Pure dynamic extraction: 100% derived from live Portfolio entries, Monthly Statement, and FinancialProfile.
 * Includes Running Account (savingsAccount) and Emergency Account (emergencyFund).
 */
export function extractActiveAssets(
  profile: FinancialProfile | null,
  portfolio: PortfolioItem[] = []
): ReconciledAssets {
  let pMF = 0;
  let pStocks = 0;
  let pPPF = 0;
  let pEPF = 0;
  let pNPS = 0;
  let pProperty = 0;
  let pSavings = 0;
  let pEmergency = 0;
  let pHomeLoan = 0;
  let pHomeLoanEMI = 0;
  let pInterestRate = 8.5;
  let pTenureMonths = 126;

  for (const item of portfolio) {
    const val = Number(item.currentValue) || 0;
    const cat = (item.category || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const anyItem = item as any;

    if (item.type === "Liability") {
      if (cat.includes("home loan") || name.includes("home loan") || name.includes("mortgage")) {
        pHomeLoan += val;
        if (anyItem.monthlyPayment) pHomeLoanEMI = Number(anyItem.monthlyPayment);
        else if (anyItem.emi) pHomeLoanEMI = Number(anyItem.emi);
        if (anyItem.interestRate) pInterestRate = Number(anyItem.interestRate);
        if (anyItem.tenureMonths) pTenureMonths = Number(anyItem.tenureMonths);
      }
    } else {
      const isProperty =
        cat === "real estate" ||
        cat === "property" ||
        name.includes("flat") ||
        name.includes("dehradun") ||
        name.includes("house") ||
        name.includes("property") ||
        name.includes("real estate") ||
        name.includes("plot");

      if (isProperty) {
        pProperty += val;
      } else if (
        cat === "mutual fund" ||
        cat === "mutual funds" ||
        anyItem.isMutualFundSubItem ||
        name.includes("mutual fund") ||
        name.includes("flexi cap") ||
        name.includes("large cap") ||
        name.includes("mid cap") ||
        name.includes("small cap") ||
        name.includes("index fund") ||
        name.includes("mf") ||
        cat === "etf"
      ) {
        pMF += val;
      } else if (cat === "stocks" || name.includes("stock") || name.includes("shares") || name.includes("equity")) {
        pStocks += val;
      } else if (cat === "ppf" || name.includes("ppf") || name.includes("dsop") || name.includes("public provident")) {
        pPPF += val;
      } else if (cat === "epf" || name.includes("epf") || name.includes("employee provident")) {
        pEPF += val;
      } else if (cat === "nps" || name.includes("nps") || name.includes("national pension")) {
        pNPS += val;
      } else if (cat === "emergency fund" || name.includes("emergency")) {
        pEmergency += val;
      } else if (
        cat === "savings account" ||
        cat === "cash" ||
        name.includes("running") ||
        name.includes("savings") ||
        name.includes("bank")
      ) {
        pSavings += val;
      }
    }
  }

  const review = typeof window !== "undefined" ? loadMonthlyReview() : null;

  const mutualFunds = pMF > 0 ? pMF : Number(profile?.assets?.mutualFunds) || 0;
  const stocks = pStocks > 0 ? pStocks : Number(profile?.assets?.stocks) || 0;
  const ppf = pPPF > 0 ? pPPF : Number(profile?.assets?.ppf) || 0;
  const epf = pEPF > 0 ? pEPF : Number(profile?.assets?.epf) || 0;
  const nps = pNPS > 0 ? pNPS : Number(profile?.assets?.nps) || 0;
  const property = pProperty > 0 ? pProperty : Number(profile?.assets?.property) || 0;

  const savingsAccount =
    pSavings > 0
      ? pSavings
      : parseNum(review?.assets?.savingsAccount) ||
        parseNum(review?.cashAllocation?.savingsAccount) ||
        Number(profile?.assets?.cash) ||
        0;

  const emergencyFund =
    pEmergency > 0
      ? pEmergency
      : parseNum(review?.assets?.emergencyFund) ||
        parseNum(review?.cashAllocation?.emergencyFund) ||
        Number(profile?.assets?.emergencyFund) ||
        0;

  const homeLoanPrincipal =
    pHomeLoan > 0 ? pHomeLoan : Number(profile?.liabilities?.homeLoanOutstanding) || 0;

  const monthlyEMI =
    pHomeLoanEMI > 0
      ? pHomeLoanEMI
      : homeLoanPrincipal > 0
      ? calculateEMI(homeLoanPrincipal, pInterestRate, pTenureMonths)
      : 0;

  return {
    mutualFunds,
    stocks,
    ppf,
    epf,
    nps,
    property,
    savingsAccount,
    emergencyFund,
    homeLoanPrincipal,
    monthlyEMI,
    homeLoanInterestRate: pInterestRate,
    homeLoanTenureMonths: pTenureMonths,
  };
}
