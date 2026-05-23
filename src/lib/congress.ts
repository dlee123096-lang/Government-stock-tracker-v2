import type { SignalEntry } from "@/types/signal";
import {
  getCommitteeRelevance,
  officialSubtype,
  OFFICIALS,
} from "@/data/committees";

const SENATE_EFD = "https://efts.senate.gov/v1";
const USER_AGENT =
  "SignalAlpha/3.0 (Educational research tool; https://github.com/dlee123096-lang/Government-stock-tracker-v2)";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// STOCK Act disclosures report trade amounts as ranges — use midpoint
function parseStockActAmount(amountStr: string): number {
  if (!amountStr) return 0;
  if (amountStr.toLowerCase().includes("over")) return 1_250_000;
  const nums = amountStr.match(/[\d,]+/g);
  if (!nums || nums.length < 2) return 0;
  const lo = parseInt(nums[0].replace(/,/g, ""), 10);
  const hi = parseInt(nums[1].replace(/,/g, ""), 10);
  if (isNaN(lo) || isNaN(hi)) return 0;
  return Math.round((lo + hi) / 2);
}

// Senate eFD often includes ticker in parentheses: "Apple Inc. (AAPL)"
function extractTicker(assetDescription: string): string {
  const match = assetDescription.match(/\(([A-Z]{1,5})\)/);
  return match?.[1] ?? "";
}

function cleanCompanyName(assetDescription: string): string {
  return assetDescription.replace(/\s*\([A-Z]{1,5}\)\s*$/, "").trim();
}

// -- Senate eFD API types -------------------------------------------------

interface SenateFilingListResult {
  count: number;
  results: Array<{
    id: string;
    first_name: string;
    last_name: string;
    office: string;
    filing_type: string;
    date_filed: string;
    report_start_date?: string;
  }>;
}

interface SenateTransaction {
  asset_description?: string;
  transaction_type?: string;
  amount?: string;
  transaction_date?: string;
  asset_type?: string;
}

interface SenateFilingDetail {
  transactions?: SenateTransaction[];
}

// -- Network helpers ------------------------------------------------------

async function senateFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 0 },
  });
}

// -- Main export ----------------------------------------------------------

export async function fetchCongressSignals(): Promise<SignalEntry[]> {
  const results: SignalEntry[] = [];

  // STOCK Act allows 30–45 days before disclosure; look back 60 days to catch recent trades
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  let filings: SenateFilingListResult["results"] = [];
  try {
    const res = await senateFetch(
      `${SENATE_EFD}/filings?filing_type=PT&limit=100&date_fld_from=${cutoffStr}`,
    );
    if (!res.ok) return [];
    const data: SenateFilingListResult = await res.json();
    filings = data.results ?? [];
  } catch {
    return [];
  }

  // Cap at 15 filings to stay within reasonable build time
  for (const filing of filings.slice(0, 15)) {
    await delay(150);
    try {
      const detailRes = await senateFetch(`${SENATE_EFD}/filings/${filing.id}`);
      if (!detailRes.ok) continue;
      const detail: SenateFilingDetail = await detailRes.json();
      const transactions = detail.transactions ?? [];

      const fullName = `${filing.first_name} ${filing.last_name}`;
      const officialInfo = OFFICIALS[fullName];
      const role =
        officialInfo?.title ?? `U.S. Senator (${filing.office})`;

      for (const tx of transactions) {
        if (!tx.asset_description || !tx.amount) continue;
        // Only process equity trades, not mutual funds / bonds
        if (
          tx.asset_type &&
          !tx.asset_type.toLowerCase().includes("stock") &&
          !tx.asset_type.toLowerCase().includes("equity") &&
          !tx.asset_type.toLowerCase().includes("common")
        ) {
          continue;
        }

        const ticker = extractTicker(tx.asset_description);
        if (!ticker) continue; // can't score without an identifiable ticker

        const tradeType: "Buy" | "Sell" = (tx.transaction_type ?? "")
          .toLowerCase()
          .includes("sale")
          ? "Sell"
          : "Buy";

        const tradeSize = parseStockActAmount(tx.amount);
        if (tradeSize < 1_000) continue;

        const tradeDate =
          tx.transaction_date ??
          filing.report_start_date ??
          filing.date_filed;
        const filingDate = filing.date_filed;

        const filingDateObj = new Date(filingDate);
        const tradeDateObj = new Date(tradeDate);
        const daysDelayed = Math.max(
          0,
          Math.round(
            (filingDateObj.getTime() - tradeDateObj.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );

        const contextTags = getCommitteeRelevance(fullName, ticker);
        const signalSubtype = officialSubtype(fullName, ticker, tradeType);
        const uniqueId = `CONG-${filing.id.replace(/-/g, "").slice(-10)}-${ticker}`;

        results.push({
          id: uniqueId,
          ticker,
          company: cleanCompanyName(tx.asset_description),
          signalType: "Government Official",
          personEntity: fullName,
          role,
          tradeType,
          tradeSize,
          tradeDate,
          filingDate,
          daysDelayed,
          signalSubtype,
          contextTags,
          riskFlags: [],
          historicalAlpha: 5.0,
          historicalWinRate: 52,
          historicalTradeCount: 5,
          recentPerformance: "Neutral recent performance",
          explanation:
            `STOCK Act disclosure. ${tradeType} of $${tradeSize.toLocaleString()} in ${ticker} by ${fullName} (${role}). ` +
            `Filed ${daysDelayed} day${daysDelayed === 1 ? "" : "s"} after the trade date.` +
            (contextTags.includes("Sector relevance to committee")
              ? " This official serves on a committee with direct oversight of this sector."
              : "") +
            " Track record scores use neutral defaults — historical performance data planned for Version 4.",
        });
      }
    } catch {
      continue;
    }
  }

  return results;
}
