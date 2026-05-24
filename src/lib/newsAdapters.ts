/**
 * Optional news adapters — free API integrations that are DISABLED by
 * default. Each function returns an empty array when its environment
 * variable is missing, so the build never fails because of a missing key.
 *
 * To enable any of these later:
 *   1. Sign up for the provider (all are free tiers)
 *   2. Add the corresponding env var to .env.local locally and to your
 *      Vercel project settings for production
 *   3. Replace the mock supportingArticles in src/data/mockDailyAlphaPicks.ts
 *      with calls to these functions inside getDailyAlphaPicks.ts
 *
 * IMPORTANT cost-control rules (see COST_CONTROL.md):
 *   - Always cache results (use Next's `fetch(..., { next: { revalidate } })`)
 *   - Never call these on every page load — call at build/ISR time only
 *   - Respect each provider's free-tier rate limit
 *   - Never store raw article text long-term — only headline, source, date, URL
 */

import type { SupportingArticle } from "@/types/dailyAlpha";
import { getSourceTrustScore } from "@/lib/newsSources";
import { normalizeGdeltArticle, type GdeltRawArticle } from "@/lib/newsNormalizer";

const TIMEOUT_MS = 8000;

async function safeFetchJson(url: string): Promise<unknown | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        next: { revalidate: 21_600 }, // 6h cache
      });
      if (!res.ok) return null;
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────
// GDELT — free, no API key required, very high coverage
// Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
// Activation: set USE_GDELT_NEWS=1 — no key needed
// Only called for top-20 picks to keep request count low.
// ───────────────────────────────────────────────────────────────────────
export async function fetchGdeltNewsForTicker(
  ticker: string,
  company: string,
  daysBack = 3,
  maxArticles = 5,
): Promise<SupportingArticle[]> {
  if (process.env.USE_GDELT_NEWS !== "1") return [];

  // Use both company name and ticker for best recall.
  const query = `"${company}" OR "${ticker}" stock`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&format=JSON&maxrecords=25&sort=DateDesc&sourcelang=English`;

  const json = await safeFetchJson(url);
  if (!json || typeof json !== "object") return [];

  const raw = (json as { articles?: unknown[] }).articles;
  if (!Array.isArray(raw)) return [];

  const cutoffMs = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  const normalized: SupportingArticle[] = [];
  const seenUrls = new Set<string>();
  const seenPrefixes = new Set<string>();

  for (const item of raw) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("title" in item) ||
      !("url" in item)
    )
      continue;

    const raw_item = item as GdeltRawArticle;
    if (!raw_item.title || !raw_item.url) continue;

    // Deduplicate by URL.
    if (seenUrls.has(raw_item.url)) continue;
    seenUrls.add(raw_item.url);

    // Near-duplicate headline dedup on first 50 chars.
    const prefix = raw_item.title.slice(0, 50).toLowerCase();
    if (seenPrefixes.has(prefix)) continue;
    seenPrefixes.add(prefix);

    const article = normalizeGdeltArticle(raw_item, ticker, company);

    // Date freshness filter — skip anything older than daysBack.
    if (article.publishedDate) {
      const pubMs = new Date(article.publishedDate + "T12:00:00Z").getTime();
      if (!Number.isNaN(pubMs) && pubMs < cutoffMs) continue;
    }

    // Trust filter — only high-quality sources influence the score.
    if (article.trustScore < 70) continue;

    normalized.push(article);
  }

  // Sort: highest relevance first, break ties by trust.
  normalized.sort((a, b) => {
    const relDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    return relDiff !== 0 ? relDiff : (b.trustScore ?? 0) - (a.trustScore ?? 0);
  });

  return normalized.slice(0, maxArticles);
}

// ───────────────────────────────────────────────────────────────────────
// Alpha Vantage — free tier 25 calls/day
// Docs: https://www.alphavantage.co/documentation/#news-sentiment
// Activation: set ALPHA_VANTAGE_KEY=<your key>
// ───────────────────────────────────────────────────────────────────────
export async function fetchAlphaVantageNewsForTicker(
  ticker: string,
): Promise<SupportingArticle[]> {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return [];
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(ticker)}&limit=5&apikey=${encodeURIComponent(key)}`;
  const json = await safeFetchJson(url);
  if (!json || typeof json !== "object") return [];
  const feed = (json as { feed?: unknown[] }).feed;
  if (!Array.isArray(feed)) return [];
  return feed.slice(0, 5).map((a) => {
    const item = a as {
      title?: string;
      url?: string;
      source?: string;
      time_published?: string;
      overall_sentiment_label?: string;
      summary?: string;
    };
    const sentiment =
      item.overall_sentiment_label === "Bullish" ||
      item.overall_sentiment_label === "Somewhat-Bullish"
        ? ("Bullish" as const)
        : item.overall_sentiment_label === "Bearish" ||
            item.overall_sentiment_label === "Somewhat-Bearish"
          ? ("Bearish" as const)
          : ("Neutral" as const);
    return {
      title: item.title ?? "(no title)",
      source: item.source ?? "Alpha Vantage",
      publishedDate: (item.time_published ?? "").slice(0, 4) + "-" +
        (item.time_published ?? "").slice(4, 6) + "-" +
        (item.time_published ?? "").slice(6, 8),
      url: item.url ?? "#",
      sentiment,
      trustScore: getSourceTrustScore(item.source ?? ""),
      // Free-tier returns a paragraph; we keep only a short hint to respect
      // copyright. Replace with a custom rewrite if you want a longer summary.
      summary:
        (item.summary ?? "")
          .split(" ")
          .slice(0, 25)
          .join(" ")
          .replace(/\s+\S*$/, "") + "…",
    };
  });
}

// ───────────────────────────────────────────────────────────────────────
// Finnhub — free tier 60 calls/min
// Docs: https://finnhub.io/docs/api/company-news
// Activation: set FINNHUB_KEY=<your key>
// ───────────────────────────────────────────────────────────────────────
export async function fetchFinnhubNewsForTicker(
  ticker: string,
): Promise<SupportingArticle[]> {
  const key = process.env.FINNHUB_KEY;
  if (!key) return [];
  const today = new Date();
  const from = new Date(today.getTime() - 7 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${iso(from)}&to=${iso(today)}&token=${encodeURIComponent(key)}`;
  const json = await safeFetchJson(url);
  if (!Array.isArray(json)) return [];
  return json.slice(0, 5).map((a) => {
    const item = a as {
      headline?: string;
      source?: string;
      datetime?: number;
      url?: string;
      summary?: string;
    };
    return {
      title: item.headline ?? "(no title)",
      source: item.source ?? "Finnhub",
      publishedDate: item.datetime
        ? new Date(item.datetime * 1000).toISOString().slice(0, 10)
        : "",
      url: item.url ?? "#",
      sentiment: "Neutral" as const,
      trustScore: getSourceTrustScore(item.source ?? ""),
      summary: (item.summary ?? "Click through for full article.")
        .split(" ")
        .slice(0, 25)
        .join(" "),
    };
  });
}

// ───────────────────────────────────────────────────────────────────────
// Financial Modeling Prep — free tier 250 calls/day
// Docs: https://site.financialmodelingprep.com/developer/docs/stock-news-api
// Activation: set FMP_KEY=<your key>
// ───────────────────────────────────────────────────────────────────────
export async function fetchFmpNewsForTicker(
  ticker: string,
): Promise<SupportingArticle[]> {
  const key = process.env.FMP_KEY;
  if (!key) return [];
  const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${encodeURIComponent(ticker)}&limit=5&apikey=${encodeURIComponent(key)}`;
  const json = await safeFetchJson(url);
  if (!Array.isArray(json)) return [];
  return json.slice(0, 5).map((a) => {
    const item = a as {
      title?: string;
      site?: string;
      publishedDate?: string;
      url?: string;
      text?: string;
    };
    return {
      title: item.title ?? "(no title)",
      source: item.site ?? "Financial Modeling Prep",
      publishedDate: (item.publishedDate ?? "").slice(0, 10),
      url: item.url ?? "#",
      sentiment: "Neutral" as const,
      trustScore: getSourceTrustScore(item.site ?? ""),
      summary: (item.text ?? "")
        .split(" ")
        .slice(0, 25)
        .join(" ")
        .replace(/\s+\S*$/, "") + "…",
    };
  });
}
