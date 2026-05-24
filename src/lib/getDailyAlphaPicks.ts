/**
 * Daily Alpha Picks — data service layer.
 *
 * On each build (or ISR revalidation):
 *   1. Load mock pick inputs from src/data/mockDailyAlphaPicks.ts
 *   2. Score them with computeFullDailyAlphaPick
 *   3. Attempt GDELT news enrichment per ticker (USE_GDELT_NEWS=1 activates)
 *   4. Set newsSource badge per pick
 *   5. Sort by dailyAlphaScore (desc)
 *
 * Result is cached via unstable_cache (6-hour TTL).
 * All functions are async to support live news adapters cleanly.
 */

import { unstable_cache } from "next/cache";
import { mockDailyAlphaPicks } from "@/data/mockDailyAlphaPicks";
import { computeFullDailyAlphaPick } from "@/lib/dailyAlphaScoring";
import { fetchGdeltNewsForTicker } from "@/lib/newsAdapters";
import type { DailyAlphaPick, NewsSource } from "@/types/dailyAlpha";

export interface DailyAlphaPicksResult {
  all: DailyAlphaPick[];
  top10: DailyAlphaPick[];
  top20: DailyAlphaPick[];
  generatedAt: string;
  newsSource: NewsSource; // representative source used across picks
}

const fetchDailyAlphaPicksRaw = unstable_cache(
  async (): Promise<DailyAlphaPicksResult> => {
    const scored = mockDailyAlphaPicks.map(computeFullDailyAlphaPick);
    const sorted = [...scored].sort(
      (a, b) => b.dailyAlphaScore - a.dailyAlphaScore,
    );

    const gdeltEnabled = process.env.USE_GDELT_NEWS === "1";

    // Enrich with GDELT news in batches of 5 to be friendly to the API
    const enriched: DailyAlphaPick[] = [];
    let anyLive = false;

    if (gdeltEnabled) {
      const BATCH = 5;
      for (let i = 0; i < sorted.length; i += BATCH) {
        const slice = sorted.slice(i, i + BATCH);
        const results = await Promise.all(
          slice.map(async (pick) => {
            const articles = await fetchGdeltNewsForTicker(pick.ticker);
            if (articles.length > 0) {
              anyLive = true;
              return {
                ...pick,
                supportingArticles: articles,
                newsSource: "Live GDELT" as NewsSource,
              };
            }
            const ns: NewsSource =
              pick.supportingArticles.length > 0
                ? "Mock fallback"
                : "No articles found";
            return { ...pick, newsSource: ns };
          }),
        );
        enriched.push(...results);
      }
    } else {
      for (const pick of sorted) {
        const ns: NewsSource =
          pick.supportingArticles.length > 0
            ? "Mock fallback"
            : "No articles found";
        enriched.push({ ...pick, newsSource: ns });
      }
    }

    const representativeSource: NewsSource = anyLive
      ? "Live GDELT"
      : enriched.some((p) => p.supportingArticles.length > 0)
        ? "Mock fallback"
        : "No articles found";

    return {
      all: enriched,
      top10: enriched.slice(0, 10),
      top20: enriched.slice(0, 20),
      generatedAt: new Date().toISOString(),
      newsSource: representativeSource,
    };
  },
  ["signal-alpha-daily-alpha-picks-v2"],
  { revalidate: 21_600 }, // 6-hour cache
);

export async function getDailyAlphaPicks(): Promise<DailyAlphaPicksResult> {
  return fetchDailyAlphaPicksRaw();
}

/**
 * Look up a single pick by ticker (case-insensitive).
 */
export async function getDailyAlphaPickByTicker(
  ticker: string,
): Promise<DailyAlphaPick | undefined> {
  const upper = ticker.toUpperCase();
  const { all } = await getDailyAlphaPicks();
  return all.find((p) => p.ticker.toUpperCase() === upper);
}

export interface DailyAlphaSummary {
  topPick: DailyAlphaPick | null;
  averageScore: number;
  highConvictionCount: number;
  averageAlphaVsSp500: number;
  trustedArticleCount: number;
  stocksScreened: number;
  newsSource: NewsSource;
}

export async function getDailyAlphaSummary(): Promise<DailyAlphaSummary> {
  const { all, newsSource } = await getDailyAlphaPicks();
  if (all.length === 0) {
    return {
      topPick: null,
      averageScore: 0,
      highConvictionCount: 0,
      averageAlphaVsSp500: 0,
      trustedArticleCount: 0,
      stocksScreened: 0,
      newsSource,
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
    newsSource,
  };
}
