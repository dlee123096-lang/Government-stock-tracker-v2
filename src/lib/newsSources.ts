/**
 * Trusted news source registry.
 *
 * Every supporting article in the Daily Alpha Picks dataset is assigned a
 * trustScore. The score is a transparent heuristic — higher = more
 * authoritative, lower = treat with caution. It does NOT imply endorsement
 * of any source, nor that high-trust outlets are always correct.
 *
 * Buckets:
 *   100 = primary source (SEC filings, company IR direct)
 *    90 = top-tier wire / business journalism
 *    80 = major financial outlet
 *    70 = secondary business / data outlet
 *    50 = mainstream but lower-context outlet
 *    30 = aggregator / commentary
 *    10 = unverified / promotional / unknown
 *
 * IMPORTANT: We never reproduce article text. Only headline, source, date,
 * link, and a short ORIGINAL summary are displayed (see SupportingArticle).
 */

interface SourceTier {
  score: number;
  notes: string;
}

const TIERS: Record<string, SourceTier> = {
  // ── Primary sources (100) ─────────────────────────────────────────────
  "SEC EDGAR": { score: 100, notes: "Filing source of record" },
  "Company Investor Relations": {
    score: 100,
    notes: "Direct from the company",
  },
  "Company Press Release": { score: 95, notes: "Direct company statement" },
  "Federal Reserve": { score: 100, notes: "Policy primary source" },
  "Office of Government Ethics": { score: 100, notes: "OGE filings" },

  // ── Top-tier wires / business journalism (90) ─────────────────────────
  Reuters: { score: 90, notes: "Global wire" },
  AP: { score: 90, notes: "Associated Press wire" },
  "Associated Press": { score: 90, notes: "Wire service" },

  // ── Major financial outlets (80) ──────────────────────────────────────
  "The Wall Street Journal": { score: 85, notes: "Major financial daily" },
  WSJ: { score: 85, notes: "Major financial daily" },
  Barrons: { score: 80, notes: "Business weekly" },
  "Barron's": { score: 80, notes: "Business weekly" },
  CNBC: { score: 80, notes: "Business news network" },
  MarketWatch: { score: 80, notes: "Financial news outlet" },
  Bloomberg: {
    score: 80,
    notes: "Headlines/links only; full text behind paywall",
  },

  // ── Secondary business / data outlets (70) ────────────────────────────
  "Yahoo Finance": { score: 70, notes: "Aggregated finance portal" },
  Nasdaq: { score: 70, notes: "Exchange-published news" },
  NYSE: { score: 70, notes: "Exchange-published news" },
  Morningstar: { score: 75, notes: "Independent research firm" },
  Zacks: { score: 65, notes: "Quant research firm" },
  Reuters_Markets: { score: 85, notes: "Reuters markets desk" },

  // ── Mainstream lower-context outlets (50) ─────────────────────────────
  "Investing.com": { score: 55, notes: "Aggregator" },
  "Benzinga (headline only)": {
    score: 50,
    notes: "Trader-focused aggregator",
  },
  "Business Wire": { score: 60, notes: "PR distribution" },
  "PR Newswire": { score: 60, notes: "PR distribution" },

  // ── Aggregators / commentary (30) ─────────────────────────────────────
  "Generic blog": { score: 30, notes: "Independent commentary" },
  Substack: { score: 30, notes: "Independent newsletter" },
  Medium: { score: 25, notes: "Independent platform" },

  // ── Unverified / promotional (10) ─────────────────────────────────────
  "Promotional newsletter": {
    score: 10,
    notes: "Likely paid promotion — caution",
  },
  "Penny stock site": { score: 10, notes: "High promotion risk" },
  "Unverified social media": { score: 10, notes: "Unattributed claim" },
};

/**
 * Look up the trust score for a source name. Unknown sources default to 30
 * (treated as low-trust aggregator) — the UI should make this visible so
 * the user can scrutinize unfamiliar names.
 */
export function getSourceTrustScore(sourceName: string): number {
  const direct = TIERS[sourceName];
  if (direct) return direct.score;
  // Case-insensitive fallback for common variants
  const lower = sourceName.toLowerCase();
  for (const [name, tier] of Object.entries(TIERS)) {
    if (name.toLowerCase() === lower) return tier.score;
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
    notes: TIERS[sourceName]?.notes ?? "Source not in registry",
  };
}

export const TRUSTED_SOURCE_NAMES: string[] = Object.keys(TIERS);
