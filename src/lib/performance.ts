/**
 * Performance enrichment — replaces synthetic Track Record defaults with real
 * post-filing returns derived from Yahoo Finance.
 *
 * Strategy
 *   1. Collect every unique ticker in the live signal set.
 *   2. Fetch one 1-year daily chart from Yahoo per ticker (cached 24 h).
 *   3. For every signal whose filingDate falls inside that window, compute
 *      the return from the filing date to "today" (or filingDate + 30 days,
 *      whichever is sooner). For sells we invert the sign — a price drop
 *      after a sell is a "win".
 *   4. Group by personEntity. A filer is only updated when they have at
 *      least 2 measurable disclosures; otherwise the synthetic baseline
 *      stays in place (and the UI shows the existing amber disclosure note).
 *
 * No paid APIs. No accumulated history file. Pure read-only at build time.
 */

import type {
  RecentPerformance,
  SignalEntry,
} from "@/types/signal";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const USER_AGENT =
  "Mozilla/5.0 (compatible; SignalAlphaStock/7.0; +https://signal-alpha-stock.vercel.app)";

interface PricePoint {
  ts: number; // unix seconds
  close: number;
}

interface FilerPerformance {
  alpha: number;
  winRate: number;
  tradeCount: number;
  recent: RecentPerformance;
}

async function fetchYahooChart(ticker: string): Promise<PricePoint[] | null> {
  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(ticker)}?range=1y&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      // 24-hour cache — daily GitHub Actions rebuild busts this anyway.
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart: {
        result?: Array<{
          timestamp: number[];
          indicators: { quote: Array<{ close: (number | null)[] }> };
        }>;
      };
    };
    const result = json.chart.result?.[0];
    if (!result) return null;
    const ts = result.timestamp ?? [];
    const closes = result.indicators?.quote?.[0]?.close ?? [];
    const points: PricePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c !== null && c !== undefined && !Number.isNaN(c)) {
        points.push({ ts: ts[i], close: c });
      }
    }
    return points.length > 1 ? points : null;
  } catch {
    return null;
  }
}

function closestPriceAt(
  points: PricePoint[],
  isoDate: string,
): { ts: number; close: number } | null {
  const target = new Date(isoDate + "T12:00:00Z").getTime() / 1000;
  let best: PricePoint | null = null;
  let bestDiff = Infinity;
  for (const p of points) {
    const d = Math.abs(p.ts - target);
    if (d < bestDiff) {
      bestDiff = d;
      best = p;
    }
  }
  // Only trust matches within 5 trading days
  if (!best || bestDiff > 5 * 86_400) return null;
  return best;
}

function bucketRecent(avgReturn: number): RecentPerformance {
  if (avgReturn >= 8) return "Strong recent outperformance";
  if (avgReturn >= 2) return "Moderate recent outperformance";
  if (avgReturn >= -2) return "Neutral recent performance";
  return "Poor recent performance";
}

/**
 * Build a per-filer performance map from live entries + price history.
 * Filers with fewer than 2 measurable trades are omitted (caller keeps
 * their synthetic defaults).
 */
export async function buildFilerPerformance(
  entries: SignalEntry[],
): Promise<Map<string, FilerPerformance>> {
  // Skip OGE annual disclosures (tradeDate is a year-end snapshot, not a real
  // entry point) and House sample data.
  const measurable = entries.filter(
    (e) =>
      e.tradeSize > 0 &&
      e.signalType !== "Executive Branch" &&
      e.dataFreshness !== "Sample" &&
      !!e.tradeDate,
  );

  const uniqueTickers = Array.from(
    new Set(measurable.map((e) => e.ticker)),
  ).filter((t) => t && t !== "—");

  // Bulk fetch — 1 Yahoo call per ticker. Concurrency cap of 6 keeps us
  // friendly to Yahoo and inside Vercel build's network budget.
  const tickerPrices = new Map<string, PricePoint[]>();
  const concurrency = 6;
  for (let i = 0; i < uniqueTickers.length; i += concurrency) {
    const slice = uniqueTickers.slice(i, i + concurrency);
    const results = await Promise.all(
      slice.map(async (t) => ({ t, points: await fetchYahooChart(t) })),
    );
    for (const { t, points } of results) {
      if (points) tickerPrices.set(t, points);
    }
  }

  // Group measurable returns by filer
  const filerReturns = new Map<string, number[]>();
  const nowSec = Math.floor(Date.now() / 1000);
  const horizonSec = 30 * 86_400;

  for (const e of measurable) {
    const prices = tickerPrices.get(e.ticker);
    if (!prices) continue;
    const entry = closestPriceAt(prices, e.tradeDate);
    if (!entry) continue;

    // Use trade_date + 30d if that's already in the past; otherwise today
    const exitTarget = Math.min(entry.ts + horizonSec, nowSec);
    if (exitTarget <= entry.ts + 86_400) continue; // need at least 1 day to evaluate
    let exit: PricePoint | null = null;
    let exitDiff = Infinity;
    for (const p of prices) {
      const d = Math.abs(p.ts - exitTarget);
      if (d < exitDiff) {
        exitDiff = d;
        exit = p;
      }
    }
    if (!exit) continue;

    const rawPct = ((exit.close - entry.close) / entry.close) * 100;
    // For sells, a price drop counts as a successful disclosure (the seller
    // got out before the decline).
    const signed = e.tradeType === "Sell" ? -rawPct : rawPct;
    const arr = filerReturns.get(e.personEntity) ?? [];
    arr.push(signed);
    filerReturns.set(e.personEntity, arr);
  }

  // Aggregate per filer (require ≥2 measurable disclosures)
  const out = new Map<string, FilerPerformance>();
  for (const [filer, returns] of filerReturns) {
    if (returns.length < 2) continue;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const wins = returns.filter((r) => r > 0).length;
    out.set(filer, {
      alpha: Number(avg.toFixed(1)),
      winRate: Math.round((wins / returns.length) * 100),
      tradeCount: returns.length,
      recent: bucketRecent(avg),
    });
  }

  return out;
}

/**
 * Apply the filer-performance map to a list of entries, replacing the
 * neutral track-record defaults with measured values where available.
 */
export function applyFilerPerformance(
  entries: SignalEntry[],
  perf: Map<string, FilerPerformance>,
): SignalEntry[] {
  return entries.map((e) => {
    const p = perf.get(e.personEntity);
    if (!p) return e;
    return {
      ...e,
      historicalAlpha: p.alpha,
      historicalWinRate: p.winRate,
      historicalTradeCount: p.tradeCount,
      recentPerformance: p.recent,
    };
  });
}
