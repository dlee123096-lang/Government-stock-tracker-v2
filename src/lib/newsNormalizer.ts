/**
 * Normalises raw GDELT API articles into the SupportingArticle shape.
 * Pure functions — no I/O, no side effects.
 */

import type { SupportingArticle } from "@/types/dailyAlpha";
import { getDomainTrustScore } from "@/lib/newsSources";
import { computeArticleRelevanceScore } from "@/lib/newsScoring";

/** Raw shape returned by GDELT DOC API v2. */
export interface GdeltRawArticle {
  url: string;
  title: string;
  seendate?: string;   // "20240115T120000Z"
  domain?: string;     // "reuters.com"
  sourcecountry?: string;
  language?: string;
}

/** Parse GDELT's compact date format into ISO YYYY-MM-DD. */
function parseGdeltDate(seendate?: string): string {
  if (!seendate || seendate.length < 8) return "";
  return `${seendate.slice(0, 4)}-${seendate.slice(4, 6)}-${seendate.slice(6, 8)}`;
}

/** Extract hostname from a URL, stripping www. */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const DOMAIN_TO_SOURCE: Record<string, string> = {
  "reuters.com": "Reuters",
  "apnews.com": "AP",
  "ft.com": "Financial Times",
  "wsj.com": "The Wall Street Journal",
  "bloomberg.com": "Bloomberg",
  "barrons.com": "Barron's",
  "cnbc.com": "CNBC",
  "marketwatch.com": "MarketWatch",
  "finance.yahoo.com": "Yahoo Finance",
  "yahoo.com": "Yahoo Finance",
  "morningstar.com": "Morningstar",
  "zacks.com": "Zacks",
  "fool.com": "The Motley Fool",
  "thestreet.com": "TheStreet",
  "businesswire.com": "Business Wire",
  "prnewswire.com": "PR Newswire",
  "globenewswire.com": "GlobeNewswire",
  "investing.com": "Investing.com",
  "benzinga.com": "Benzinga",
  "seekingalpha.com": "Seeking Alpha",
  "nasdaq.com": "Nasdaq",
  "nyse.com": "NYSE",
};

export function normalizeGdeltArticle(
  raw: GdeltRawArticle,
  ticker: string,
  company: string,
): SupportingArticle {
  const domain =
    (raw.domain ?? "").toLowerCase().replace(/^www\./, "") ||
    extractDomain(raw.url);
  const publishedDate = parseGdeltDate(raw.seendate);
  const trustScore = getDomainTrustScore(domain);
  const relevanceScore = computeArticleRelevanceScore({
    title: raw.title,
    sourceDomain: domain,
    publishedDate,
    ticker,
    company,
  });

  return {
    title: raw.title,
    source: DOMAIN_TO_SOURCE[domain] ?? (domain || "GDELT"),
    sourceDomain: domain || undefined,
    publishedDate,
    url: raw.url,
    sentiment: "Neutral",
    trustScore,
    relevanceScore,
    summary: "Headline indexed via GDELT.",
    dataSource: "GDELT",
  };
}
