/**
 * Performance enrichment — replaces synthetic Track Record defaults with real
 * post-filing returns derived from Yahoo Finance, and computes per-entry
 * price/alpha data shown in the dashboard expanded rows.
 *
 * Single pass: price history is fetched once per unique ticker and reused for
 * both filer-level aggregation and per-entry return computation.
 *
 * No paid APIs. No accumulated history file. Pure read-only at build time.
 */

import type { RecentPerformance, SignalEntry } from "@/types/signal";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const USER_AGENT =
  "Mozilla/5.0 (compatible; SignalAlphaStock/7.0; +https://signal-alpha-stock.vercel.app)";

interface PricePoint {
  ts: number; // unix seconds
  close: number;
}

export interface FilerPerformance {
  alpha: number;
  winRate: number;
  tradeCount: number;
  recent: RecentPerformance;
}

/** Per-entry post-filing return data, attached to ComputedSignal. */
export interface EntryReturn {
  returnSinceFiling: number;
  sp500ReturnSinceFiling: number;
  alphaSinceFiling: number;
}

/** Combined output of a single price-data pass. */
export interface PerformanceBuildResult {
  /** Filer-level aggregates (require ≥2 measurable trades). */
  filerMap: Map<string, FilerPerformance>;
  /** Per-entry returns, keyed by entry.id. */
  entryReturns: Map<string, EntryReturn>;
}

async function fetchYahooChart(ticker: string): Promise<PricePoint[] | null> {
  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(ticker)}?range=1y&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 }, // 24-hour cache
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
): PricePoint | null {
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

function closestPriceAtTarget(
  points: PricePoint[],
  targetSec: number,
): PricePoint | null {
  let best: PricePoint | null = null;
  let bestDiff = Infinity;
  for (const p of points) {
    const d = Math.abs(p.ts - targetSec);
    if (d < bestDiff) {
      bestDiff = d;
      best = p;
    }
  }
  return best;
}

function bucketRecent(avgReturn: number): RecentPerformance {
  if (avgReturn >= 8) return "Strong recent outperformance";
  if (avgReturn >= 2) return "Moderate recent outperformance";
  if (avgReturn >= -2) return "Neutral recent performance";
  return "Poor recent performance";
}

/**
 * Single-pass build of both filer-level performance aggregates and per-entry
 * return data. Price history is fetched once per unique ticker.
 */
export async function buildPerformanceData(
  entries: SignalEntry[],
): Promise<PerformanceBuildResult> {
  // Skip OGE annual disclosures and House sample data
  const measurable = entries.filter(
    (e) =>
      e.tradeSize > 0 &&
      e.signalType !== "Executive Branch" &&
      e.dataFreshness !== "Sample" &&
      !!e.tradeDate,
  );

  const uniqueTickers = Array.from(
    new Set([...measurable.map((e) => e.ticker), "SPY"]),
  ).filter((t) => t && t !== "—");

  // Bulk-fetch price history — concurrency cap of 6
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

  const spyPrices = tickerPrices.get("SPY") ?? null;

  const filerReturns = new Map<string, number[]>();
  const entryReturns = new Map<string, EntryReturn>();

  const nowSec = Math.floor(Date.now() / 1000);
  const horizonSec = 30 * 86_400;

  for (const e of measurable) {
    const prices = tickerPrices.get(e.ticker);
    if (!prices) continue;

    const entryPt = closestPriceAt(prices, e.tradeDate);
    if (!entryPt) continue;

    const exitTarget = Math.min(entryPt.ts + horizonSec, nowSec);
    if (exitTarget <= entryPt.ts + 86_400) continue;

    const exitPt = closestPriceAtTarget(prices, exitTarget);
    if (!exitPt) continue;

    const rawPct = ((exitPt.close - entryPt.close) / entryPt.close) * 100;
    const signed = e.tradeType === "Sell" ? -rawPct : rawPct;

    // Filer-level tracking
    const arr = filerReturns.get(e.personEntity) ?? [];
    arr.push(signed);
    filerReturns.set(e.personEntity, arr);

    // Per-entry tracking (stock vs SPY over same window)
    let sp500Pct = 0;
    if (spyPrices) {
      const spyEntry = closestPriceAt(spyPrices, e.tradeDate);
      const spyExit = spyEntry
        ? closestPriceAtTarget(spyPrices, exitTarget)
        : null;
      if (spyEntry && spyExit) {
        sp500Pct =
          ((spyExit.close - spyEntry.close) / spyEntry.close) * 100;
      }
    }

    entryReturns.set(e.id, {
      returnSinceFiling: Number(rawPct.toFixed(1)),
      sp500ReturnSinceFiling: Number(sp500Pct.toFixed(1)),
      alphaSinceFiling: Number((rawPct - sp500Pct).toFixed(1)),
    });
  }

  // Aggregate filer-level (require ≥2 measurable trades)
  const filerMap = new Map<string, FilerPerformance>();
  for (const [filer, returns] of filerReturns) {
    if (returns.length < 2) continue;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const wins = returns.filter((r) => r > 0).length;
    filerMap.set(filer, {
      alpha: Number(avg.toFixed(1)),
      winRate: Math.round((wins / returns.length) * 100),
      tradeCount: returns.length,
      recent: bucketRecent(avg),
    });
  }

  return { filerMap, entryReturns };
}

/**
 * Apply the filer-performance map to entries, replacing neutral track-record
 * defaults with measured values where available.
 */
export function applyFilerPerformance(
  entries: SignalEntry[],
  filerMap: Map<string, FilerPerformance>,
): SignalEntry[] {
  return entries.map((e) => {
    const p = filerMap.get(e.personEntity);
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

/** Legacy single-return wrapper kept for callers that only need filer data. */
export async function buildFilerPerformance(
  entries: SignalEntry[],
): Promise<Map<string, FilerPerformance>> {
  const { filerMap } = await buildPerformanceData(entries);
  return filerMap;
}
