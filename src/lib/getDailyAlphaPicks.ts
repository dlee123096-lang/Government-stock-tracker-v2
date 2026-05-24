/**
 * Daily Alpha Picks — data service layer.
 *
 * On each build (or ISR revalidation):
 *   1. Load mock pick inputs from src/data/mockDailyAlphaPicks.ts
 *   2. Score them with computeFullDailyAlphaPick
 *   3. Sort by initial score; fetch GDELT only for the top 20
 *   4. Recalculate newsCatalystScore + dailyAlphaScore for GDELT-enriched picks
 *   5. Re-sort all picks by final score
 *
 * Result is cached via unstable_cache (6-hour TTL).
 */

import { unstable_cache } from "next/cache";
import { mockDailyAlphaPicks } from "@/data/mockDailyAlphaPicks";
import {
  computeFullDailyAlphaPick,
  computeDailyAlphaScore,
  computeDailyAlphaLabel,
} from "@/lib/dailyAlphaScoring";
import { fetchGdeltNewsForTicker } from "@/lib/newsAdapters";
import { computeNewsCatalystScore } from "@/lib/newsScoring";
import type { DailyAlphaPick, NewsSource } from "@/types/dailyAlpha";

export interface DailyAlphaPicksResult {
  all: DailyAlphaPick[];
  top10: DailyAlphaPick[];
  top20: DailyAlphaPick[];
  generatedAt: string;
  newsSource: NewsSource; // representative source across picks
}

const fetchDailyAlphaPicksRaw = unstable_cache(
  async (): Promise<DailyAlphaPicksResult> => {
    // Initial scoring pass with mock data.
    const initialScored = mockDailyAlphaPicks.map(computeFullDailyAlphaPick);
    const initialSorted = [...initialScored].sort(
      (a, b) => b.dailyAlphaScore - a.dailyAlphaScore,
    );

    const gdeltEnabled = process.env.USE_GDELT_NEWS === "1";
    let anyLive = false;

    const enriched: DailyAlphaPick[] = [];

    if (gdeltEnabled) {
      // Only enrich the top 20 with GDELT — keeps request count low.
      const top20 = initialSorted.slice(0, 20);
      const rest = initialSorted.slice(20);

      const BATCH = 5;
      for (let i = 0; i < top20.length; i += BATCH) {
        const slice = top20.slice(i, i + BATCH);
        const results = await Promise.all(
          slice.map(async (pick): Promise<DailyAlphaPick> => {
            const articles = await fetchGdeltNewsForTicker(
              pick.ticker,
              pick.company,
            );

            if (articles.length > 0) {
              anyLive = true;
              // Recalculate newsCatalystScore from live articles.
              const newsCatalystScore = computeNewsCatalystScore(articles);
              const updatedInput = { ...pick, newsCatalystScore, supportingArticles: articles };
              const dailyAlphaScore = computeDailyAlphaScore(updatedInput);
              const scoreLabel = computeDailyAlphaLabel(dailyAlphaScore);
              return {
                ...pick,
                newsCatalystScore,
                supportingArticles: articles,
                dailyAlphaScore,
                scoreLabel,
                newsSource: "Live GDELT",
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

      // Remaining picks keep their mock data unchanged.
      for (const pick of rest) {
        const ns: NewsSource =
          pick.supportingArticles.length > 0
            ? "Mock fallback"
            : "No articles found";
        enriched.push({ ...pick, newsSource: ns });
      }

      // Re-sort by final scores now that top-20 may have changed.
      enriched.sort((a, b) => b.dailyAlphaScore - a.dailyAlphaScore);
    } else {
      for (const pick of initialSorted) {
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
  ["signal-alpha-daily-alpha-picks-v3"],
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
      sum + p.supportingArticles.filter((a) => a.trustScore >= 70).length,
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
