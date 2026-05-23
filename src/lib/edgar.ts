import type { SignalEntry } from "@/types/signal";

const EDGAR_SUBMISSIONS = "https://data.sec.gov/submissions";
const EDGAR_ARCHIVES = "https://www.sec.gov/Archives/edgar/data";
// SEC requires a User-Agent header identifying your app and contact info
const USER_AGENT =
  "SignalAlpha/2.0 (Educational research tool; https://github.com/dlee123096-lang/Government-stock-tracker-v2)";

interface WatchedCompany {
  ticker: string;
  cik: string;
  company: string;
}

// Top AI / tech / finance companies to watch for insider Form 4 filings
export const WATCHED_COMPANIES: WatchedCompany[] = [
  { ticker: "NVDA", cik: "0001045810", company: "NVIDIA Corp." },
  { ticker: "AMD", cik: "0000002488", company: "Advanced Micro Devices Inc." },
  { ticker: "AAPL", cik: "0000320193", company: "Apple Inc." },
  { ticker: "MSFT", cik: "0000789019", company: "Microsoft Corp." },
  { ticker: "META", cik: "0001326801", company: "Meta Platforms Inc." },
  { ticker: "AMZN", cik: "0001018724", company: "Amazon.com Inc." },
  { ticker: "GOOGL", cik: "0001652044", company: "Alphabet Inc." },
  { ticker: "PLTR", cik: "0001321655", company: "Palantir Technologies Inc." },
  { ticker: "AVGO", cik: "0001730168", company: "Broadcom Inc." },
  { ticker: "QCOM", cik: "0000804328", company: "Qualcomm Inc." },
  { ticker: "TSLA", cik: "0001318605", company: "Tesla Inc." },
  { ticker: "JPM", cik: "0000019617", company: "JPMorgan Chase & Co." },
  { ticker: "SMCI", cik: "0000310764", company: "Super Micro Computer Inc." },
  { ticker: "DELL", cik: "0000826083", company: "Dell Technologies Inc." },
  { ticker: "CRM", cik: "0001108524", company: "Salesforce Inc." },
  { ticker: "INTC", cik: "0000050863", company: "Intel Corp." },
];

// -- XML helpers ----------------------------------------------------------

function extractXmlValue(xml: string, tag: string): string {
  // EDGAR XML wraps values in <tag><value>...</value></tag> or just <tag>...</tag>
  const withValue = new RegExp(
    `<${tag}><value>([^<]*)<\\/value><\\/${tag}>`,
    "i",
  );
  const plain = new RegExp(`<${tag}>([^<]*)<\\/${tag}>`, "i");
  return (
    xml.match(withValue)?.[1]?.trim() ??
    xml.match(plain)?.[1]?.trim() ??
    ""
  );
}

function officerTitleToSubtype(
  title: string,
  tradeType: "Buy" | "Sell",
): string {
  if (tradeType === "Sell") return "Insider sell";
  const t = title.toLowerCase();
  if (
    t.includes("chief executive") ||
    t === "ceo" ||
    t.includes("president and ceo") ||
    t.includes("ceo and president") ||
    t.includes("president & ceo")
  )
    return "CEO open-market buy";
  if (t.includes("chief financial") || t === "cfo")
    return "CFO open-market buy";
  return "Director open-market buy"; // default for directors / other officers
}

interface ParsedForm4 {
  ticker: string;
  issuerName: string;
  rptOwnerName: string;
  role: string;
  tradeType: "Buy" | "Sell";
  tradeSize: number;
  tradeDateStr: string;
}

function parseForm4XML(xml: string): ParsedForm4 | null {
  const ticker = extractXmlValue(xml, "issuerTradingSymbol");
  const issuerName = extractXmlValue(xml, "issuerName");
  const rptOwnerName = extractXmlValue(xml, "rptOwnerName");
  const officerTitle = extractXmlValue(xml, "officerTitle");
  const isDirector = extractXmlValue(xml, "isDirector") === "1";

  // Transaction code: P = open-market purchase, S = sale
  // We skip A (award), M (option exercise), etc.
  const txCodeMatch = xml.match(/<transactionCode>([^<]+)<\/transactionCode>/i);
  const txCode = txCodeMatch?.[1]?.trim().toUpperCase() ?? "";
  if (!["P", "S"].includes(txCode)) return null;

  const shares = parseFloat(extractXmlValue(xml, "transactionShares")) || 0;
  const price =
    parseFloat(extractXmlValue(xml, "transactionPricePerShare")) || 0;
  const tradeSize = Math.round(shares * price);

  // Skip zero-price grants and trivially small trades
  if (price === 0 || tradeSize < 5_000) return null;
  if (!rptOwnerName || !ticker) return null;

  const tradeType: "Buy" | "Sell" = txCode === "P" ? "Buy" : "Sell";
  const role =
    officerTitle ||
    (isDirector ? "Director" : "Officer");
  const tradeDateStr = extractXmlValue(xml, "transactionDate");

  return { ticker, issuerName, rptOwnerName, role, tradeType, tradeSize, tradeDateStr };
}

// -- Network helpers ------------------------------------------------------

async function edgarFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 0 },
  });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripLeadingZeros(cik: string): string {
  return cik.replace(/^0+/, "");
}

function accessionToPath(accession: string): string {
  return accession.replace(/-/g, "");
}

// -- Submissions API types ------------------------------------------------

interface RecentFilings {
  accessionNumber: string[];
  form: string[];
  filingDate: string[];
  reportDate: string[];
  primaryDocument: string[];
}

interface SubmissionsJSON {
  filings: { recent: RecentFilings };
}

// -- Main export ----------------------------------------------------------

export async function fetchEdgarSignals(): Promise<SignalEntry[]> {
  const results: SignalEntry[] = [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  for (const co of WATCHED_COMPANIES) {
    try {
      const res = await edgarFetch(
        `${EDGAR_SUBMISSIONS}/CIK${co.cik}.json`,
      );
      if (!res.ok) continue;

      const data: SubmissionsJSON = await res.json();
      const recent = data.filings.recent;

      // Find indices of Form 4s filed in the last 30 days
      const indices: number[] = [];
      for (let i = 0; i < recent.form.length; i++) {
        if (recent.form[i] === "4" && recent.filingDate[i] >= cutoffStr) {
          indices.push(i);
        }
      }

      // Process up to 3 most recent Form 4s per company
      for (const idx of indices.slice(0, 3)) {
        await delay(110); // Stay well under SEC's 10 req/sec limit

        const cikNum = stripLeadingZeros(co.cik);
        const accPath = accessionToPath(recent.accessionNumber[idx]);
        const docUrl = `${EDGAR_ARCHIVES}/${cikNum}/${accPath}/${recent.primaryDocument[idx]}`;

        const docRes = await edgarFetch(docUrl);
        if (!docRes.ok) continue;

        const xml = await docRes.text();

        // Skip HTML responses (some primaryDocuments are .htm wrappers)
        if (!xml.trim().startsWith("<") || xml.includes("<!DOCTYPE html")) {
          continue;
        }

        const parsed = parseForm4XML(xml);
        if (!parsed) continue;

        const filingDate = recent.filingDate[idx];
        const tradeDate = parsed.tradeDateStr || recent.reportDate[idx];
        const filingDateObj = new Date(filingDate);
        const tradeDateObj = new Date(tradeDate);
        const daysDelayed = Math.max(
          0,
          Math.round(
            (filingDateObj.getTime() - tradeDateObj.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );

        const signalSubtype = officerTitleToSubtype(parsed.role, parsed.tradeType);
        const uniqueId = `${parsed.ticker}-${recent.accessionNumber[idx].replace(/-/g, "").slice(-8)}`;

        const entry: SignalEntry = {
          id: uniqueId,
          ticker: parsed.ticker || co.ticker,
          company: parsed.issuerName || co.company,
          signalType: "Corporate Insider",
          personEntity: parsed.rptOwnerName,
          role: parsed.role,
          tradeType: parsed.tradeType,
          tradeSize: parsed.tradeSize,
          tradeDate,
          filingDate,
          daysDelayed,
          signalSubtype,
          contextTags: [],
          riskFlags: [],
          // Track record defaults — historical performance data requires a
          // separate data source (Yahoo Finance, etc.) which is planned for V3.
          historicalAlpha: 5.0,
          historicalWinRate: 52,
          historicalTradeCount: 5,
          recentPerformance: "Neutral recent performance",
          explanation: `Real SEC EDGAR Form 4 filing. ${parsed.tradeType} of $${parsed.tradeSize.toLocaleString()} by ${parsed.rptOwnerName} (${parsed.role}). Track record scores use neutral defaults until historical performance data is connected in Version 3.`,
        };

        results.push(entry);
      }
    } catch (err) {
      // Log but never crash — site always shows data
      console.error(`EDGAR: skipping ${co.ticker}:`, err);
    }
  }

  return results;
}
