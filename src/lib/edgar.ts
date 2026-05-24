import type { SignalEntry } from "@/types/signal";

const EDGAR_SUBMISSIONS = "https://data.sec.gov/submissions";
const EDGAR_ARCHIVES = "https://www.sec.gov/Archives/edgar/data";
// SEC policy requires a descriptive User-Agent on every request
const USER_AGENT =
  "SignalAlphaStock/2.0 (Educational research tool; https://signal-alpha-stock.vercel.app)";

interface WatchedCompany {
  ticker: string;
  cik: string;
  company: string;
}

// Companies to watch for open-market insider Form 4 filings.
// Mix of mega-cap tech (heavy on sells) + energy, financials, healthcare,
// defense, and consumer (more likely to show insider buys).
// CIK lookup: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=TICKER
export const WATCHED_COMPANIES: WatchedCompany[] = [
  // --- Tech ---
  { ticker: "NVDA", cik: "0001045810", company: "NVIDIA Corp." },
  { ticker: "AMD",  cik: "0000002488", company: "Advanced Micro Devices Inc." },
  { ticker: "AAPL", cik: "0000320193", company: "Apple Inc." },
  { ticker: "MSFT", cik: "0000789019", company: "Microsoft Corp." },
  { ticker: "META", cik: "0001326801", company: "Meta Platforms Inc." },
  { ticker: "AMZN", cik: "0001018724", company: "Amazon.com Inc." },
  { ticker: "GOOGL",cik: "0001652044", company: "Alphabet Inc." },
  { ticker: "PLTR", cik: "0001321655", company: "Palantir Technologies Inc." },
  { ticker: "AVGO", cik: "0001730168", company: "Broadcom Inc." },
  { ticker: "QCOM", cik: "0000804328", company: "Qualcomm Inc." },
  { ticker: "TSLA", cik: "0001318605", company: "Tesla Inc." },
  { ticker: "SMCI", cik: "0001375365", company: "Super Micro Computer Inc." },
  { ticker: "DELL", cik: "0000826083", company: "Dell Technologies Inc." },
  { ticker: "CRM",  cik: "0001108524", company: "Salesforce Inc." },
  { ticker: "INTC", cik: "0000050863", company: "Intel Corp." },
  // --- Financials ---
  { ticker: "JPM",  cik: "0000019617", company: "JPMorgan Chase & Co." },
  { ticker: "WFC",  cik: "0000072971", company: "Wells Fargo & Co." },
  { ticker: "GS",   cik: "0000886982", company: "Goldman Sachs Group Inc." },
  { ticker: "MS",   cik: "0000895421", company: "Morgan Stanley" },
  // BRK.B — EDGAR uses dot notation; the CIK mismatch guard normalises it
  { ticker: "BRK.B",cik: "0001067983", company: "Berkshire Hathaway Inc." },
  // --- Energy ---
  { ticker: "CVX",  cik: "0000093410", company: "Chevron Corp." },
  { ticker: "OXY",  cik: "0000797468", company: "Occidental Petroleum Corp." },
  // --- Healthcare ---
  { ticker: "JNJ",  cik: "0000200406", company: "Johnson & Johnson" },
  { ticker: "UNH",  cik: "0000731766", company: "UnitedHealth Group Inc." },
  { ticker: "PFE",  cik: "0000078003", company: "Pfizer Inc." },
  { ticker: "ABT",  cik: "0000001800", company: "Abbott Laboratories" },
  // --- Defense ---
  { ticker: "LMT",  cik: "0000936468", company: "Lockheed Martin Corp." },
  { ticker: "RTX",  cik: "0000101829", company: "RTX Corp." },
  // --- Consumer / Retail ---
  { ticker: "WMT",  cik: "0000104169", company: "Walmart Inc." },
  { ticker: "HD",   cik: "0000354950", company: "Home Depot Inc." },
];

// -- XML helpers ----------------------------------------------------------

/**
 * Extract a scalar value from EDGAR Form 4 XML.
 *
 * EDGAR uses two formats depending on whether a footnote is present:
 *   Simple:   <tag>VALUE</tag>
 *   Wrapped:  <tag>
 *               <value>VALUE</value>
 *               <footnoteId id="F1"/>   ← optional
 *             </tag>
 *
 * The original single-line regex failed on the wrapped format because
 * whitespace and sibling elements break both the direct and <value> patterns.
 * This version extracts the full block between <tag> and </tag> first, then
 * looks for <value> inside it, falling back to plain text content.
 */
function extractXmlValue(xml: string, tag: string): string {
  // Step 1 — extract the raw block between the opening and closing tag.
  // [\s\S]*? handles multi-line content and is safe on small Form 4 XMLs.
  const blockMatch = xml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  if (!blockMatch) return "";

  const block = blockMatch[1];

  // Step 2a — prefer <value>CONTENT</value> if present
  const valueMatch = block.match(/<value>([^<]*)<\/value>/i);
  if (valueMatch) return valueMatch[1].trim();

  // Step 2b — plain text: strip any stray child tags, return remaining text
  return block.replace(/<[^>]+>/g, "").trim();
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
  return "Director open-market buy";
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

function isHtmlContent(text: string): boolean {
  const head = text.trimStart().slice(0, 300).toLowerCase();
  return head.includes("<!doctype html") || head.startsWith("<html");
}

function parseForm4XML(xml: string): ParsedForm4 | null {
  const ticker = extractXmlValue(xml, "issuerTradingSymbol");
  const issuerName = extractXmlValue(xml, "issuerName");
  const rptOwnerName = extractXmlValue(xml, "rptOwnerName");
  const officerTitle = extractXmlValue(xml, "officerTitle");
  const isDirector = extractXmlValue(xml, "isDirector") === "1";

  // Only process open-market purchases (P) and sales (S)
  // Skip awards (A), option exercises (M), etc.
  const txCode = extractXmlValue(xml, "transactionCode").toUpperCase();
  if (!["P", "S"].includes(txCode)) return null;

  const shares = parseFloat(extractXmlValue(xml, "transactionShares")) || 0;
  const price =
    parseFloat(extractXmlValue(xml, "transactionPricePerShare")) || 0;
  const tradeSize = Math.round(shares * price);

  // Skip zero-price grants and trivially small trades
  if (price === 0 || tradeSize < 5_000) return null;
  if (!rptOwnerName || !ticker) return null;

  const tradeType: "Buy" | "Sell" = txCode === "P" ? "Buy" : "Sell";
  const role = officerTitle || (isDirector ? "Director" : "Officer");
  const tradeDateStr = extractXmlValue(xml, "transactionDate");

  return { ticker, issuerName, rptOwnerName, role, tradeType, tradeSize, tradeDateStr };
}

// -- Network helpers ------------------------------------------------------

/** Fetch from EDGAR with required User-Agent + 8-second abort timeout. */
async function edgarFetch(url: string, cacheSeconds = 0): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
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

/**
 * Attempt to retrieve the Form 4 XML text for a given accession.
 *
 * EDGAR's submissions API often returns primaryDocument with an XSLT viewer
 * prefix, e.g. "xslF345X06/wk-form4_12345.xml". That path serves the
 * HTML-rendered view. The actual machine-readable XML lives in the accession
 * root without the prefix. We strip any leading xsl…/ segment first.
 *
 * If the resolved document still returns HTML (some filers use .htm wrappers),
 * we also try substituting the .xml extension.
 */
async function fetchFilingXml(
  cikNum: string,
  accPath: string,
  primaryDoc: string,
): Promise<string | null> {
  const base = `${EDGAR_ARCHIVES}/${cikNum}/${accPath}`;

  // Strip EDGAR XSLT viewer prefix (e.g. "xslF345X06/") — the raw XML is
  // always in the accession root, not the xsl subdirectory.
  const stripped = primaryDoc.replace(/^xsl[A-Za-z0-9]+\//, "");

  // Build an ordered list of names to try
  const candidates: string[] = [stripped];

  if (/\.html?$/i.test(stripped)) {
    candidates.push(stripped.replace(/\.html?$/i, ".xml"));
    candidates.push("form4.xml");
  }

  for (const name of candidates) {
    try {
      const res = await edgarFetch(`${base}/${name}`);
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.trim().startsWith("<")) continue;
      if (isHtmlContent(text)) continue;
      return text; // valid XML
    } catch {
      // timeout or network error — try next candidate
    }
  }

  return null;
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
  cutoff.setDate(cutoff.getDate() - 60); // 60-day window increases buy coverage
  const cutoffStr = cutoff.toISOString().split("T")[0];

  for (const co of WATCHED_COMPANIES) {
    try {
      // Cache submissions index for 1 hour — it changes rarely
      const res = await edgarFetch(
        `${EDGAR_SUBMISSIONS}/CIK${co.cik}.json`,
        3600,
      );
      if (!res.ok) {
        console.warn(`EDGAR: submissions ${co.ticker} → HTTP ${res.status}`);
        continue;
      }

      const data: SubmissionsJSON = await res.json();
      const recent = data.filings.recent;

      // Collect indices of Form 4s filed within the lookback window
      const indices: number[] = [];
      for (let i = 0; i < recent.form.length; i++) {
        if (recent.form[i] === "4" && recent.filingDate[i] >= cutoffStr) {
          indices.push(i);
        }
      }

      if (indices.length === 0) {
        console.log(`EDGAR: ${co.ticker} — no Form 4s in last 30 days`);
        continue;
      }

      console.log(
        `EDGAR: ${co.ticker} — ${indices.length} Form 4(s) found, processing up to 5`,
      );

      // Process at most 5 most-recent Form 4s per company
      for (const idx of indices.slice(0, 5)) {
        await delay(110); // Stay well under SEC's 10 req/sec fair-access limit

        const cikNum = stripLeadingZeros(co.cik);
        const accPath = accessionToPath(recent.accessionNumber[idx]);
        const primaryDoc = recent.primaryDocument[idx];

        const xml = await fetchFilingXml(cikNum, accPath, primaryDoc);
        if (!xml) {
          console.log(
            `EDGAR: ${co.ticker} acc=${recent.accessionNumber[idx]} — no XML found (primaryDoc: ${primaryDoc})`,
          );
          continue;
        }

        let parsed: ParsedForm4 | null = null;
        try {
          parsed = parseForm4XML(xml);
        } catch (e) {
          console.warn(`EDGAR: XML parse error for ${co.ticker}:`, e);
          continue;
        }

        if (!parsed) {
          // Filtered out (non-P/S code, zero price, small trade, etc.)
          continue;
        }

        // Sanity-check: if the XML ticker doesn't match what we expected,
        // the CIK in WATCHED_COMPANIES is probably wrong. Log and skip rather
        // than attributing another company's trade to the wrong ticker.
        if (parsed.ticker && parsed.ticker.toUpperCase() !== co.ticker.toUpperCase()) {
          console.warn(
            `EDGAR: CIK ${co.cik} returned ticker ${parsed.ticker} (expected ${co.ticker}) — update WATCHED_COMPANIES`,
          );
          continue;
        }

        const filingDate = recent.filingDate[idx];
        const tradeDate = parsed.tradeDateStr || recent.reportDate[idx];
        const daysDelayed = Math.max(
          0,
          Math.round(
            (new Date(filingDate).getTime() - new Date(tradeDate).getTime()) /
              86_400_000,
          ),
        );

        const signalSubtype = officerTitleToSubtype(
          parsed.role,
          parsed.tradeType,
        );
        const uniqueId = `${parsed.ticker}-${recent.accessionNumber[idx]
          .replace(/-/g, "")
          .slice(-8)}`;

        results.push({
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
          historicalAlpha: 5.0,
          historicalWinRate: 52,
          historicalTradeCount: 5,
          recentPerformance: "Neutral recent performance",
          explanation:
            `Live SEC EDGAR Form 4 filing. ${parsed.tradeType} of ` +
            `$${parsed.tradeSize.toLocaleString()} in ${parsed.ticker || co.ticker} ` +
            `by ${parsed.rptOwnerName} (${parsed.role}). ` +
            `Filed ${daysDelayed} day${daysDelayed === 1 ? "" : "s"} after the trade date. ` +
            `Track record scores use neutral defaults — historical ` +
            `performance data planned for a future version.`,
        });

        console.log(
          `EDGAR: ✓ ${co.ticker} — ${parsed.tradeType} $${parsed.tradeSize.toLocaleString()} by ${parsed.rptOwnerName}`,
        );
      }
    } catch (err) {
      // Log but never crash — site always falls back to sample data
      console.error(`EDGAR: error fetching ${co.ticker}:`, err);
    }
  }

  console.log(`EDGAR: total signals collected: ${results.length}`);
  return results;
}
