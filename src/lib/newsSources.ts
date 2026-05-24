/**
 * Trusted news source registry.
 *
 * Every supporting article is assigned a trustScore (0–100). The score is a
 * transparent heuristic — higher = more authoritative. It does NOT imply
 * endorsement of any source, nor that high-trust outlets are always correct.
 *
 * Buckets:
 *   95–100 = primary source (SEC, OGE, company IR, major exchanges)
 *    80–94 = top-tier wire / major financial journalism
 *    70–79 = secondary business / data outlets
 *    50–69 = aggregators, PR wires, mainstream non-finance
 *    20–49 = commentary, unknown blogs
 *     0–19 = promotional / penny-stock / unverified
 *
 * IMPORTANT: We never reproduce article text. Only headline, source, date,
 * link, and a short ORIGINAL summary are displayed (see SupportingArticle).
 */

interface SourceTier {
  score: number;
  notes: string;
}

// ── Source name → trust score ──────────────────────────────────────────────
const SOURCE_TIERS: Record<string, SourceTier> = {
  // Primary sources (95–100)
  "SEC EDGAR":                   { score: 100, notes: "Filing source of record" },
  "Company Investor Relations":  { score: 100, notes: "Direct from the company" },
  "Company Press Release":       { score: 95,  notes: "Direct company statement" },
  "Federal Reserve":             { score: 100, notes: "Policy primary source" },
  "Office of Government Ethics": { score: 100, notes: "OGE filings" },
  Nasdaq:                        { score: 92,  notes: "Exchange-published news" },
  NYSE:                          { score: 92,  notes: "Exchange-published news" },

  // Top-tier wires / major financial journalism (80–94)
  Reuters:                       { score: 93, notes: "Global wire service" },
  AP:                            { score: 92, notes: "Associated Press wire" },
  "Associated Press":            { score: 92, notes: "Wire service" },
  "Financial Times":             { score: 90, notes: "Premium financial daily" },
  "The Wall Street Journal":     { score: 88, notes: "Major financial daily" },
  WSJ:                           { score: 88, notes: "Major financial daily" },
  Bloomberg:                     { score: 85, notes: "Headlines/links only; paywall for full text" },
  "Barron's":                    { score: 83, notes: "Business weekly" },
  Barrons:                       { score: 83, notes: "Business weekly" },
  CNBC:                          { score: 82, notes: "Business news network" },
  MarketWatch:                   { score: 82, notes: "Financial news outlet" },

  // Secondary business / data outlets (70–79)
  "Yahoo Finance":               { score: 75, notes: "Aggregated finance portal" },
  Morningstar:                   { score: 78, notes: "Independent research firm" },
  Zacks:                         { score: 70, notes: "Quant research firm" },
  "The Motley Fool":             { score: 70, notes: "Retail investor-focused" },
  TheStreet:                     { score: 72, notes: "Finance news & analysis" },

  // Aggregators / PR wires (50–69)
  "Business Wire":               { score: 62, notes: "PR distribution" },
  "PR Newswire":                 { score: 62, notes: "PR distribution" },
  "Investing.com":               { score: 58, notes: "Aggregator" },
  "Benzinga":                    { score: 55, notes: "Trader-focused aggregator" },
  "Benzinga (headline only)":    { score: 55, notes: "Trader-focused aggregator" },

  // Commentary / independent blogs (20–49)
  "Generic blog":                { score: 30, notes: "Independent commentary" },
  Substack:                      { score: 30, notes: "Independent newsletter" },
  Medium:                        { score: 25, notes: "Independent platform" },
  "Seeking Alpha":               { score: 45, notes: "Crowd-sourced analysis; contributor quality varies" },

  // Promotional / unverified (0–19)
  "Promotional newsletter":      { score: 10, notes: "Likely paid promotion — treat with caution" },
  "Penny stock site":            { score: 5,  notes: "High promotion risk" },
  "Unverified social media":     { score: 5,  notes: "Unattributed claim" },
};

// ── Domain → trust score (used by GDELT adapter) ──────────────────────────
// GDELT returns raw domains (e.g. "reuters.com"). Map them to trust scores
// without requiring exact name matching.
const DOMAIN_SCORES: Record<string, number> = {
  // Primary / exchanges
  "sec.gov":            100,
  "oge.gov":            100,
  "nasdaq.com":         92,
  "nyse.com":           92,
  "ir.example.com":     95, // placeholder for company IR domains

  // Top-tier wires
  "reuters.com":        93,
  "apnews.com":         92,
  "ft.com":             90,
  "wsj.com":            88,
  "bloomberg.com":      85,
  "barrons.com":        83,
  "cnbc.com":           82,
  "marketwatch.com":    82,

  // Secondary business
  "finance.yahoo.com":  75,
  "yahoo.com":          72,
  "morningstar.com":    78,
  "zacks.com":          70,
  "fool.com":           70,
  "thestreet.com":      72,

  // Aggregators / PR
  "businesswire.com":   62,
  "prnewswire.com":     62,
  "globenewswire.com":  60,
  "investing.com":      58,
  "benzinga.com":       55,
  "seekingalpha.com":   45,

  // Commentary
  "substack.com":       30,
  "medium.com":         25,
};

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Look up trust score by source name (exact match or case-insensitive fallback).
 * Unknown sources default to 30 (low-trust aggregator).
 */
export function getSourceTrustScore(sourceName: string): number {
  if (!sourceName) return 30;
  const direct = SOURCE_TIERS[sourceName];
  if (direct) return direct.score;
  const lower = sourceName.toLowerCase();
  for (const [name, tier] of Object.entries(SOURCE_TIERS)) {
    if (name.toLowerCase() === lower) return tier.score;
  }
  return 30;
}

/**
 * Look up trust score by domain name (e.g. "reuters.com").
 * Used by the GDELT adapter which returns raw domains, not source names.
 * Unknown domains default to 30.
 */
export function getDomainTrustScore(domain: string): number {
  if (!domain) return 30;
  const lower = domain.toLowerCase().replace(/^www\./, "");
  const direct = DOMAIN_SCORES[lower];
  if (direct !== undefined) return direct;
  // Partial suffix match (e.g. "finance.yahoo.com" → "yahoo.com")
  for (const [d, score] of Object.entries(DOMAIN_SCORES)) {
    if (lower.endsWith("." + d) || lower === d) return score;
  }
  return 30;
}

export function describeSourceTrust(sourceName: string): {
  score: number;
  band: "Primary" | "High" | "Medium" | "Low" | "Caution";
  notes: string;
} {
  const score = getSourceTrustScore(sourceName);
  let band: "Primary" | "High" | "Medium" | "Low" | "Caution";
  if (score >= 95) band = "Primary";
  else if (score >= 80) band = "High";
  else if (score >= 60) band = "Medium";
  else if (score >= 30) band = "Low";
  else band = "Caution";
  return {
    score,
    band,
    notes: SOURCE_TIERS[sourceName]?.notes ?? "Source not in registry — treat with caution",
  };
}

/**
 * Classify a trust score into a human-readable band.
 * Used for articles where we have a pre-computed score (e.g. GDELT pipeline).
 */
export function trustBand(
  score: number,
): "Primary" | "High" | "Medium" | "Low" | "Caution" {
  if (score >= 95) return "Primary";
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  if (score >= 30) return "Low";
  return "Caution";
}

export const TRUSTED_SOURCE_NAMES: string[] = Object.keys(SOURCE_TIERS);
