/**
 * Daily Alpha Picks — data service layer.
 *
 * Responsibilities:
 *   1. Load mock pick inputs from src/data/mockDailyAlphaPicks.ts
 *   2. Score them with computeFullDailyAlphaPick
 *   3. Sort by dailyAlphaScore (desc)
 *   4. Expose top 10 and top 20 helpers
 *
 * Structured so that later versions can:
 *   - Merge real news from src/lib/newsAdapters.ts
 *   - Pull real price/momentum from Yahoo (see src/lib/performance.ts)
 *   - Cross-reference existing disclosure data from src/data/liveSignals.ts
 *     to compute disclosureSignalScore from real EDGAR/Congress/13F data
 *
 * All functions are pure and side-effect free. No paid APIs, no DB.
 */

import { mockDailyAlphaPicks } from "@/data/mockDailyAlphaPicks";
import { computeFullDailyAlphaPick } from "@/lib/dailyAlphaScoring";
import type { DailyAlphaPick } from "@/types/dailyAlpha";

export interface DailyAlphaPicksResult {
  all: DailyAlphaPick[];
  top10: DailyAlphaPick[];
  top20: DailyAlphaPick[];
  generatedAt: string;
}

let cached: DailyAlphaPicksResult | null = null;

export function getDailyAlphaPicks(): DailyAlphaPicksResult {
  if (cached) return cached;

  const scored = mockDailyAlphaPicks.map(computeFullDailyAlphaPick);
  const sorted = [...scored].sort(
    (a, b) => b.dailyAlphaScore - a.dailyAlphaScore,
  );

  cached = {
    all: sorted,
    top10: sorted.slice(0, 10),
    top20: sorted.slice(0, 20),
    generatedAt: new Date().toISOString(),
  };

  return cached;
}

/**
 * Look up a single pick by ticker (case-insensitive).
 * Returns undefined if no pick matches.
 */
export function getDailyAlphaPickByTicker(
  ticker: string,
): DailyAlphaPick | undefined {
  const upper = ticker.toUpperCase();
  return getDailyAlphaPicks().all.find((p) => p.ticker.toUpperCase() === upper);
}

/**
 * Aggregate dashboard metrics for the hero summary cards.
 */
export interface DailyAlphaSummary {
  topPick: DailyAlphaPick | null;
  averageScore: number;
  highConvictionCount: number;
  averageAlphaVsSp500: number;
  trustedArticleCount: number;
  stocksScreened: number;
}

export function getDailyAlphaSummary(): DailyAlphaSummary {
  const { all } = getDailyAlphaPicks();
  if (all.length === 0) {
    return {
      topPick: null,
      averageScore: 0,
      highConvictionCount: 0,
      averageAlphaVsSp500: 0,
      trustedArticleCount: 0,
      stocksScreened: 0,
    };
  }
  const averageScore = Math.round(
    all.reduce((sum, p) => sum + p.dailyAlphaScore, 0) / all.length,
  );
  const highConvictionCount = all.filter(
    (p) =>
      p.scoreLabel === "Exceptional Candidate" ||
      p.scoreLabel === "High-Conviction Candidate",
  ).length;
  const averageAlphaVsSp500 =
    Math.round(
      (all.reduce((sum, p) => sum + p.alphaVsSp500, 0) / all.length) * 10,
    ) / 10;
  const trustedArticleCount = all.reduce(
    (sum, p) =>
      sum + p.supportingArticles.filter((a) => a.trustScore >= 60).length,
    0,
  );

  return {
    topPick: all[0],
    averageScore,
    highConvictionCount,
    averageAlphaVsSp500,
    trustedArticleCount,
    stocksScreened: all.length,
  };
}

// Reset cache helper — used only in tests / dev hot reload.
export function _resetDailyAlphaCache(): void {
  cached = null;
}
