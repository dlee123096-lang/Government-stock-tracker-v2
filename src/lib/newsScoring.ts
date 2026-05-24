/**
 * News scoring utilities for the Daily Alpha Picks pipeline.
 *
 * Two exports:
 *   computeArticleRelevanceScore — scores how relevant a single article is
 *     to a specific ticker/company on a 0–100 scale.
 *
 *   computeNewsCatalystScore — aggregates a set of articles into a single
 *     0–100 News Catalyst Score used as an input to the Daily Alpha formula.
 *
 * All functions are pure (no I/O, no side effects).
 */

import type { SupportingArticle } from "@/types/dailyAlpha";

// Domains known to be financial/business sources.
// Used to award the +20 "financial source" relevance bonus.
const FINANCIAL_DOMAINS = new Set([
  "reuters.com",
  "apnews.com",
  "cnbc.com",
  "marketwatch.com",
  "wsj.com",
  "barrons.com",
  "bloomberg.com",
  "finance.yahoo.com",
  "yahoo.com",
  "nasdaq.com",
  "nyse.com",
  "morningstar.com",
  "zacks.com",
  "investing.com",
  "businesswire.com",
  "prnewswire.com",
  "globenewswire.com",
  "ft.com",
  "thestreet.com",
  "fool.com",
  "seekingalpha.com",
  "benzinga.com",
]);

interface RelevanceInput {
  title: string;
  sourceDomain: string;
  publishedDate: string; // ISO YYYY-MM-DD
  ticker: string;
  company: string;
}

/**
 * Score 0–100: how relevant this article is to the given ticker/company.
 *
 * Scoring breakdown:
 *   +40  Company name appears in headline
 *   +30  Ticker symbol appears in headline (e.g. "NVDA" or "$NVDA")
 *   +20  Source is a known financial/business domain
 *   +10  Article published within the last 24 hours
 *   +5   Article published within the last 48 hours (exclusive with 24h bonus)
 */
export function computeArticleRelevanceScore(input: RelevanceInput): number {
  let score = 0;
  const titleLower = input.title.toLowerCase();
  const tickerLower = input.ticker.toLowerCase();
  const companyLower = input.company.toLowerCase();

  // Company name in headline — award partial credit for any significant word match
  const companyWords = companyLower
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["corp", "inc.", "llc", "ltd", "company"].includes(w));
  if (companyWords.some((w) => titleLower.includes(w))) {
    // Full credit if the first 12 chars of the company name appear verbatim
    score +=
      companyLower.length >= 4 && titleLower.includes(companyLower.slice(0, 12))
        ? 40
        : 25;
  }

  // Ticker symbol in headline
  if (
    titleLower.includes(tickerLower) ||
    titleLower.includes("$" + tickerLower)
  ) {
    score += 30;
  }

  // Financial/business source
  const domain = input.sourceDomain.toLowerCase().replace(/^www\./, "");
  if (FINANCIAL_DOMAINS.has(domain)) {
    score += 20;
  }

  // Freshness bonus
  if (input.publishedDate) {
    try {
      const pubMs = new Date(input.publishedDate + "T12:00:00Z").getTime();
      const ageHours = (Date.now() - pubMs) / (1000 * 60 * 60);
      if (ageHours <= 24) score += 10;
      else if (ageHours <= 48) score += 5;
    } catch {
      // Unparseable date — no bonus
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Aggregate a set of articles into a single News Catalyst Score (0–100).
 *
 * Considers:
 *   - Number of trusted (trustScore ≥ 70) articles          (max 25 pts)
 *   - Average trust score of trusted articles               (max 25 pts)
 *   - Average relevance score of trusted articles           (max 20 pts)
 *   - Dominant sentiment across trusted articles            (max 15 pts)
 *   - Multi-source confirmation (distinct domains)          (max 15 pts)
 *
 * Returns 20 (neutral baseline) when no trusted articles exist, so the
 * Daily Alpha Score degrades gracefully rather than dropping to zero.
 */
export function computeNewsCatalystScore(articles: SupportingArticle[]): number {
  const trusted = articles.filter((a) => (a.trustScore ?? 0) >= 70);
  if (trusted.length === 0) return 20;

  // Article count factor (0–25)
  const countScore = Math.min(25, trusted.length * 8);

  // Average trust score, normalized from the 70–100 band to 0–25
  const avgTrust =
    trusted.reduce((s, a) => s + (a.trustScore ?? 0), 0) / trusted.length;
  const trustScore = ((avgTrust - 70) / 30) * 25;

  // Average relevance, normalized to 0–20
  const withRelevance = trusted.filter((a) => typeof a.relevanceScore === "number");
  const avgRelevance =
    withRelevance.length > 0
      ? withRelevance.reduce((s, a) => s + (a.relevanceScore ?? 0), 0) / withRelevance.length
      : 50; // neutral if no relevance data
  const relevanceScore = (avgRelevance / 100) * 20;

  // Dominant sentiment (0–15)
  const sentimentCounts = { Bullish: 0, Neutral: 0, Bearish: 0 };
  for (const a of trusted) sentimentCounts[a.sentiment] = (sentimentCounts[a.sentiment] ?? 0) + 1;
  const sentimentBonus =
    sentimentCounts.Bullish >= 2
      ? 15
      : sentimentCounts.Bullish === 1
        ? 8
        : sentimentCounts.Bearish >= 2
          ? 0
          : 4; // neutral or single bearish → small baseline

  // Multi-source confirmation: count distinct domains / source names (0–15)
  const uniqueSources = new Set(
    trusted.map((a) => (a.sourceDomain ?? a.source).toLowerCase()),
  );
  const multiSourceBonus =
    uniqueSources.size >= 3 ? 15 : uniqueSources.size >= 2 ? 8 : 0;

  const total = countScore + trustScore + relevanceScore + sentimentBonus + multiSourceBonus;
  return Math.round(Math.min(100, Math.max(0, total)));
}

/**
 * Summarise why a pick scored the way it did, for the "Why this ranked today"
 * UI section. Returns a list of short bullet-point strings.
 */
export function buildRankingReasons(pick: {
  dailyAlphaScore: number;
  newsCatalystScore: number;
  disclosureSignalScore: number;
  momentumScore: number;
  fundamentalQualityScore: number;
  valuationScore: number;
  earningsRevisionScore: number;
  riskPenalty: number;
  hasGovernmentDisclosureOverlap: boolean;
  hasEdgarInsiderOverlap: boolean;
  hasInstitutionalOverlap: boolean;
  hasActivistOverlap: boolean;
  supportingArticles: SupportingArticle[];
  newsSource?: string;
}): string[] {
  const reasons: string[] = [];

  // News catalyst
  if (pick.newsCatalystScore >= 70) {
    const gdelt = pick.newsSource === "Live GDELT";
    const trusted = pick.supportingArticles.filter((a) => (a.trustScore ?? 0) >= 70);
    reasons.push(
      `Strong news catalyst (${pick.newsCatalystScore}/100): ${trusted.length} trusted article${trusted.length !== 1 ? "s" : ""} ${gdelt ? "via live GDELT" : "in dataset"}`,
    );
  } else if (pick.newsCatalystScore >= 40) {
    reasons.push(`Moderate news catalyst (${pick.newsCatalystScore}/100)`);
  }

  // Disclosure overlaps
  const disclosureLines: string[] = [];
  if (pick.hasGovernmentDisclosureOverlap) disclosureLines.push("government filing");
  if (pick.hasEdgarInsiderOverlap) disclosureLines.push("EDGAR insider buy");
  if (pick.hasInstitutionalOverlap) disclosureLines.push("institutional 13F position");
  if (pick.hasActivistOverlap) disclosureLines.push("activist stake");
  if (disclosureLines.length > 0) {
    reasons.push(`Disclosure overlap: ${disclosureLines.join(" + ")}`);
  }

  // Momentum
  if (pick.momentumScore >= 70) {
    reasons.push(`Above-average price momentum (${pick.momentumScore}/100)`);
  }

  // Fundamentals
  if (pick.fundamentalQualityScore >= 70) {
    reasons.push(`Strong fundamental quality score (${pick.fundamentalQualityScore}/100)`);
  }

  // Valuation
  if (pick.valuationScore >= 70) {
    reasons.push(`Attractive valuation (${pick.valuationScore}/100)`);
  }

  // Earnings revision
  if (pick.earningsRevisionScore >= 70) {
    reasons.push(`Positive earnings estimate revisions (${pick.earningsRevisionScore}/100)`);
  }

  // Risk drag
  if (pick.riskPenalty >= 10) {
    reasons.push(`Risk penalty applied (−${pick.riskPenalty} pts) — check risk flags below`);
  }

  if (reasons.length === 0) {
    reasons.push("Combination of moderate scores across multiple factors");
  }

  return reasons;
}
