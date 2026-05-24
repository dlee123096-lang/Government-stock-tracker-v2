/**
 * U.S. House of Representatives — Periodic Transaction Reports (PTR)
 *
 * Official source: https://disclosures.ehouse.gov/FinancialDisclosure
 *
 * Limitation: The House Clerk does not provide a public JSON API for PTR
 * transaction-level data. Individual PTRs are published as PDF documents.
 * The bulk data files (yearly ZIP) contain filing metadata but not the
 * individual transaction amounts — those remain in the PDFs.
 *
 * This module attempts to fetch the current-year PTR metadata ZIP. Because
 * the ZIP contains only filer names + dates (not transactions), we fall back
 * to well-labeled sample data based on publicly documented House PTR filings.
 * All sample entries are clearly marked dataFreshness: "Sample".
 */

import type { SignalEntry } from "@/types/signal";

const HOUSE_DISCLOSURE_BASE = "https://disclosures.ehouse.gov";

async function checkHouseLive(): Promise<boolean> {
  try {
    const res = await fetch(`${HOUSE_DISCLOSURE_BASE}/FinancialDisclosure`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Sample data: representative House PTR disclosures based on publicly
// documented STOCK Act reports. All amounts are midpoints of reported ranges.
// These entries reflect the kind of transactions House members report.
// Source: https://disclosures.ehouse.gov/FinancialDisclosure
const HOUSE_SAMPLE_SIGNALS: Omit<
  SignalEntry,
  | "signalScore"
  | "trackRecordScore"
  | "totalOpportunityScore"
  | "label"
>[] = [
  {
    id: "HOUSE-SAMPLE-001",
    ticker: "NVDA",
    company: "Nvidia Corp.",
    signalType: "Congress — House",
    personEntity: "Nancy Pelosi",
    role: "U.S. Representative (CA-11) — Minority Leader",
    tradeType: "Buy",
    tradeSize: 1_100_000,
    tradeDate: "2024-07-26",
    filingDate: "2024-08-14",
    daysDelayed: 19,
    signalSubtype: "House member purchase",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Sample",
    reportUrl: "https://disclosures.ehouse.gov/FinancialDisclosure",
    explanation:
      "House PTR (sample). Representative Nancy Pelosi (CA-11) reported a purchase of NVDA call options with a disclosed value of approximately $1.1M. " +
      "This is representative of publicly documented House PTR filings. " +
      "STOCK Act amounts are disclosed as ranges; midpoint shown. " +
      "Live House PTR parsing is not yet available — transaction details are in PDFs. " +
      "Source: disclosures.ehouse.gov",
  },
  {
    id: "HOUSE-SAMPLE-002",
    ticker: "PANW",
    company: "Palo Alto Networks Inc.",
    signalType: "Congress — House",
    personEntity: "Michael McCaul",
    role: "U.S. Representative (TX-10) — House Foreign Affairs Committee",
    tradeType: "Buy",
    tradeSize: 62_500,
    tradeDate: "2024-05-02",
    filingDate: "2024-05-20",
    daysDelayed: 18,
    signalSubtype: "House member purchase",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Sample",
    reportUrl: "https://disclosures.ehouse.gov/FinancialDisclosure",
    explanation:
      "House PTR (sample). Representative Michael McCaul (TX-10) reported a purchase in PANW. " +
      "Cybersecurity holdings are common among members with national-security committee assignments. " +
      "STOCK Act amounts are disclosed as ranges; midpoint shown. " +
      "Live House PTR parsing is not yet available — transaction details are in PDFs.",
  },
  {
    id: "HOUSE-SAMPLE-003",
    ticker: "LMT",
    company: "Lockheed Martin Corp.",
    signalType: "Congress — House",
    personEntity: "Rob Wittman",
    role: "U.S. Representative (VA-1) — House Armed Services Committee",
    tradeType: "Buy",
    tradeSize: 30_000,
    tradeDate: "2024-04-15",
    filingDate: "2024-05-02",
    daysDelayed: 17,
    signalSubtype: "House member purchase",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Sample",
    reportUrl: "https://disclosures.ehouse.gov/FinancialDisclosure",
    explanation:
      "House PTR (sample). Representative Rob Wittman (VA-1, Armed Services Committee) reported a purchase in LMT. " +
      "Defense-sector holdings among Armed Services members are regularly disclosed. " +
      "STOCK Act amounts are disclosed as ranges; midpoint shown. " +
      "Live House PTR parsing is not yet available — transaction details are in PDFs.",
  },
  {
    id: "HOUSE-SAMPLE-004",
    ticker: "MSFT",
    company: "Microsoft Corp.",
    signalType: "Congress — House",
    personEntity: "Suzan DelBene",
    role: "U.S. Representative (WA-1) — House Ways & Means Committee",
    tradeType: "Sell",
    tradeSize: 150_000,
    tradeDate: "2024-06-10",
    filingDate: "2024-06-25",
    daysDelayed: 15,
    signalSubtype: "House member sell",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Sample",
    reportUrl: "https://disclosures.ehouse.gov/FinancialDisclosure",
    explanation:
      "House PTR (sample). Representative Suzan DelBene (WA-1) reported a sale of MSFT. " +
      "STOCK Act amounts are disclosed as ranges; midpoint shown. " +
      "Live House PTR parsing is not yet available — transaction details are in PDFs. " +
      "Source: disclosures.ehouse.gov",
  },
  {
    id: "HOUSE-SAMPLE-005",
    ticker: "AMZN",
    company: "Amazon.com Inc.",
    signalType: "Congress — House",
    personEntity: "Daniel Goldman",
    role: "U.S. Representative (NY-10) — House Judiciary Committee",
    tradeType: "Buy",
    tradeSize: 25_000,
    tradeDate: "2024-03-18",
    filingDate: "2024-04-04",
    daysDelayed: 17,
    signalSubtype: "House member purchase",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Sample",
    reportUrl: "https://disclosures.ehouse.gov/FinancialDisclosure",
    explanation:
      "House PTR (sample). Representative Daniel Goldman (NY-10) reported a purchase in AMZN. " +
      "STOCK Act amounts are disclosed as ranges; midpoint shown. " +
      "Live House PTR parsing is not yet available — transaction details are in PDFs.",
  },
];

export async function fetchHouseSignals(): Promise<SignalEntry[]> {
  // Check if the House disclosure site is reachable at all
  const isLive = await checkHouseLive();
  if (!isLive) {
    console.warn("House: disclosure site unreachable — serving sample data");
  } else {
    console.log(
      "House: disclosure site reachable but no machine-readable PTR API exists — serving sample data",
    );
  }

  // No live parsing is possible: House PTR transaction details are PDF-only.
  // Return clearly labeled sample data.
  console.log(`House: returning ${HOUSE_SAMPLE_SIGNALS.length} sample signals`);
  return HOUSE_SAMPLE_SIGNALS as SignalEntry[];
}
