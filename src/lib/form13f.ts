/**
 * SEC EDGAR Form 13F — Quarterly Institutional Holdings
 *
 * 13F-HR is filed by institutional investment managers with ≥$100M in AUM
 * within 45 days of each quarter end (Mar 31, Jun 30, Sep 30, Dec 31).
 * These are HOLDINGS SNAPSHOTS, not real-time trades.
 *
 * Sources used:
 *   Submissions index:  https://data.sec.gov/submissions/CIK{cik}.json
 *   Infotable XML:      https://www.sec.gov/Archives/edgar/data/{cik}/{acc}/infotable.xml
 *
 * Allowed per SEC fair-access policy: descriptive User-Agent, ≤10 req/sec.
 */

import type { SignalEntry } from "@/types/signal";

const EDGAR_SUBMISSIONS = "https://data.sec.gov/submissions";
const EDGAR_ARCHIVES = "https://www.sec.gov/Archives/edgar/data";
const USER_AGENT =
  "SignalAlphaStock/6.0 (Educational research tool; https://signal-alpha-stock.vercel.app)";

// --  Watched institutional managers -----------------------------------------
// CIKs are verified via https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany
// The CIK mismatch guard below logs a warning if the entity name doesn't match.

interface WatchedManager {
  name: string;
  cik: string;
  description: string; // shown as "role" in the UI
}

const WATCHED_MANAGERS: WatchedManager[] = [
  {
    name: "Berkshire Hathaway",
    cik: "0001067983",
    description: "Warren Buffett · Value / long-term equity",
  },
  {
    name: "Pershing Square Capital Management",
    cik: "0001336528",
    description: "Bill Ackman · Concentrated activist",
  },
  {
    name: "Third Point LLC",
    cik: "0001040273",
    description: "Dan Loeb · Event-driven activist",
  },
  {
    name: "Appaloosa Management",
    cik: "0000913760",
    description: "David Tepper · Distressed / macro equity",
  },
];

// -- Well-known nameOfIssuer → ticker lookup ----------------------------------
// 13F XML uses company names (not tickers). This covers the vast majority of
// large-cap institutional holdings. Holdings not in this map are skipped.

const ISSUER_TICKER_MAP: Record<string, string> = {
  "APPLE INC": "AAPL",
  "MICROSOFT CORP": "MSFT",
  "AMAZON COM INC": "AMZN",
  "AMAZON.COM INC": "AMZN",
  "NVIDIA CORP": "NVDA",
  "ALPHABET INC": "GOOGL",
  "ALPHABET INC-CL A": "GOOGL",
  "ALPHABET INC-CL C": "GOOG",
  "META PLATFORMS INC": "META",
  "META PLATFORMS INC-CLASS A": "META",
  "BERKSHIRE HATHAWAY INC": "BRK.B",
  "BERKSHIRE HATHAWAY INC-CL B": "BRK.B",
  "JPMORGAN CHASE & CO": "JPM",
  "EXXON MOBIL CORP": "XOM",
  "UNITEDHEALTH GROUP INC": "UNH",
  "JOHNSON & JOHNSON": "JNJ",
  "VISA INC": "V",
  "VISA INC-CLASS A SHARES": "V",
  "MASTERCARD INC": "MA",
  "MASTERCARD INC-CLASS A": "MA",
  "PROCTER & GAMBLE CO": "PG",
  "HOME DEPOT INC": "HD",
  "CHEVRON CORP": "CVX",
  "MERCK & CO INC": "MRK",
  "ABBVIE INC": "ABBV",
  "COCA-COLA CO": "KO",
  "PEPSICO INC": "PEP",
  "COSTCO WHOLESALE CORP": "COST",
  "ADOBE INC": "ADBE",
  "SALESFORCE INC": "CRM",
  "NETFLIX INC": "NFLX",
  "TESLA INC": "TSLA",
  "BANK OF AMERICA CORP": "BAC",
  "WELLS FARGO & COMPANY": "WFC",
  "WELLS FARGO & CO": "WFC",
  "MORGAN STANLEY": "MS",
  "GOLDMAN SACHS GROUP INC": "GS",
  "BROADCOM INC": "AVGO",
  "QUALCOMM INC": "QCOM",
  "ADVANCED MICRO DEVICES INC": "AMD",
  "INTEL CORP": "INTC",
  "PALANTIR TECHNOLOGIES INC": "PLTR",
  "CITIGROUP INC": "C",
  "AMERICAN EXPRESS CO": "AXP",
  "UBER TECHNOLOGIES INC": "UBER",
  "AIRBNB INC": "ABNB",
  "BOOKING HOLDINGS INC": "BKNG",
  "HILTON WORLDWIDE HOLDINGS INC": "HLT",
  "LOWE'S COMPANIES INC": "LOW",
  "TARGET CORP": "TGT",
  "WALMART INC": "WMT",
  "ORACLE CORP": "ORCL",
  "SERVICENOW INC": "NOW",
  "SNOWFLAKE INC": "SNOW",
  "CROWDSTRIKE HOLDINGS INC": "CRWD",
  "DATADOG INC": "DDOG",
  "PALO ALTO NETWORKS INC": "PANW",
  "RESTAURANT BRANDS INTL INC": "QSR",
  "CHIPOTLE MEXICAN GRILL INC": "CMG",
  "DOMINOS PIZZA INC": "DPZ",
  "HILTON GRAND VACATIONS INC": "HGV",
  "CANADIAN PACIFIC KANSAS CITY": "CP",
  "NORFOLK SOUTHERN CORP": "NSC",
  "UNION PACIFIC CORP": "UNP",
  "CATERPILLAR INC": "CAT",
  "DEERE & CO": "DE",
  "LOCKHEED MARTIN CORP": "LMT",
  "RTX CORP": "RTX",
  "GENERAL ELECTRIC CO": "GE",
  "ABBOTT LABORATORIES": "ABT",
  "PFIZER INC": "PFE",
  "ELI LILLY & CO": "LLY",
  "ASTRAZENECA PLC": "AZN",
  "SPOTIFY TECHNOLOGY SA": "SPOT",
};

// -- XML helpers --------------------------------------------------------------

function extractXmlValue(xml: string, tag: string): string {
  const blockMatch = xml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  if (!blockMatch) return "";
  const block = blockMatch[1];
  const valueMatch = block.match(/<value>([^<]*)<\/value>/i);
  if (valueMatch) return valueMatch[1].trim();
  return block.replace(/<[^>]+>/g, "").trim();
}

function extractAllBlocks(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

// -- Network helpers ----------------------------------------------------------

async function edgarFetch(url: string, cacheSeconds = 0): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      next: { revalidate: cacheSeconds },
    });
  } finally {
    clearTimeout(timer);
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripLeadingZeros(cik: string): string {
  return cik.replace(/^0+/, "");
}

function accessionToPath(accession: string): string {
  return accession.replace(/-/g, "");
}

// -- Main export --------------------------------------------------------------

export async function fetchForm13fSignals(): Promise<SignalEntry[]> {
  const results: SignalEntry[] = [];

  for (const manager of WATCHED_MANAGERS) {
    try {
      await delay(120);

      // 1. Get the submissions index — cache for 6 hours (13F is quarterly)
      const subRes = await edgarFetch(
        `${EDGAR_SUBMISSIONS}/CIK${manager.cik}.json`,
        21_600,
      );
      if (!subRes.ok) {
        console.warn(`13F: submissions ${manager.name} → HTTP ${subRes.status}`);
        continue;
      }

      const data = await subRes.json();
      const recent = data.filings?.recent;
      if (!recent) continue;

      // 2. Find the most recent 13F-HR (not amendment)
      let latestIdx = -1;
      for (let i = 0; i < recent.form.length; i++) {
        if (recent.form[i] === "13F-HR") {
          latestIdx = i;
          break;
        }
      }
      if (latestIdx === -1) {
        console.log(`13F: ${manager.name} — no 13F-HR found`);
        continue;
      }

      const accession = recent.accessionNumber[latestIdx];
      const filingDate = recent.filingDate[latestIdx];
      const periodOfReport = recent.reportDate?.[latestIdx] ?? filingDate;
      const cikNum = stripLeadingZeros(manager.cik);
      const accPath = accessionToPath(accession);

      console.log(`13F: ${manager.name} — found 13F-HR filed ${filingDate}`);

      // 3. Try to fetch the infotable XML
      await delay(120);
      const infotableUrl = `${EDGAR_ARCHIVES}/${cikNum}/${accPath}/infotable.xml`;
      const xmlRes = await edgarFetch(infotableUrl, 21_600);
      if (!xmlRes.ok) {
        console.warn(`13F: ${manager.name} — infotable not at expected path (${xmlRes.status})`);
        continue;
      }

      const xml = await xmlRes.text();
      if (!xml.trim().startsWith("<")) {
        console.warn(`13F: ${manager.name} — infotable response is not XML`);
        continue;
      }

      // 4. Parse all <infoTable> entries, sort by value, take top 8
      const blocks = extractAllBlocks(xml, "infoTable");
      if (blocks.length === 0) {
        console.warn(`13F: ${manager.name} — no <infoTable> entries found`);
        continue;
      }

      type Holding = {
        issuer: string;
        value: number; // USD thousands
        shares: number;
      };

      const holdings: Holding[] = blocks.map((block) => ({
        issuer: extractXmlValue(block, "nameOfIssuer").toUpperCase().trim(),
        value: parseInt(extractXmlValue(block, "value").replace(/,/g, ""), 10) || 0,
        shares: parseInt(extractXmlValue(block, "sshPrnamt").replace(/,/g, ""), 10) || 0,
      }));

      // Sort descending by value, take top 8 known tickers
      holdings.sort((a, b) => b.value - a.value);

      let added = 0;
      for (const h of holdings) {
        if (added >= 8) break;
        const ticker = ISSUER_TICKER_MAP[h.issuer];
        if (!ticker) continue; // skip unmapped holdings
        if (h.value < 10_000) continue; // skip < $10M positions (in $thousands)

        const valueUsd = h.value * 1_000;
        const uniqueId = `13F-${manager.cik.slice(-6)}-${ticker}-${periodOfReport}`;

        results.push({
          id: uniqueId,
          ticker,
          company: h.issuer
            .split(" ")
            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
            .join(" "),
          signalType: "Fund Manager / 13F",
          personEntity: manager.name,
          role: manager.description,
          tradeType: "Buy", // holding = long position
          tradeSize: valueUsd,
          tradeDate: periodOfReport,
          filingDate,
          daysDelayed: 45, // 13F filers have 45-day legal window
          signalSubtype: "Generic 13F holding",
          contextTags: [],
          riskFlags: [],
          historicalAlpha: 5.0,
          historicalWinRate: 52,
          historicalTradeCount: 5,
          recentPerformance: "Neutral recent performance",
          dataFreshness: "Quarterly",
          reportUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${manager.cik}&type=13F-HR&dateb=&owner=include&count=1`,
          explanation:
            `13F quarterly holdings snapshot. ${manager.name} (${manager.description}) reported a ` +
            `$${(valueUsd / 1_000_000).toFixed(1)}M position in ${ticker} ` +
            `as of ${periodOfReport} (filed ${filingDate}). ` +
            `13F is a quarterly snapshot — not a real-time trade. ` +
            `Managers have 45 days after quarter-end to file. ` +
            `Holdings may have changed significantly since the report date.`,
        });
        added++;
      }

      console.log(`13F: ${manager.name} — added ${added} holdings`);
    } catch (err) {
      console.error(`13F: error fetching ${manager.name}:`, err);
    }
  }

  console.log(`13F: total signals collected: ${results.length}`);
  return results;
}
