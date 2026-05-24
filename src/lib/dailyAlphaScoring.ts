/**
 * Daily Alpha Score — pure scoring functions.
 *
 * Formula:
 *   Daily Alpha Score =
 *       20% News Catalyst
 *     + 20% Disclosure Signal
 *     + 15% Momentum
 *     + 15% Fundamental Quality
 *     + 10% Valuation
 *     + 10% Earnings Revision
 *     +  5% Freshness
 *     +  5% Track Record
 *     − Risk Penalty
 *
 * Result is clamped to 0–100 and rounded to the nearest whole number.
 *
 * Labels:
 *   90–100 = Exceptional Candidate
 *   80–89  = High-Conviction Candidate
 *   70–79  = Strong Research Candidate
 *   60–69  = Watchlist Candidate
 *   <60    = Low Priority
 *
 * IMPORTANT: This is a research ranking score, not a buy/sell recommendation.
 */

import type {
  DailyAlphaPick,
  DailyAlphaPickInput,
  DailyAlphaLabel,
} from "@/types/dailyAlpha";

const WEIGHTS = {
  newsCatalyst: 0.2,
  disclosureSignal: 0.2,
  momentum: 0.15,
  fundamentalQuality: 0.15,
  valuation: 0.1,
  earningsRevision: 0.1,
  freshness: 0.05,
  trackRecord: 0.05,
} as const;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export interface DailyAlphaScoreBreakdown {
  newsCatalyst: number;
  disclosureSignal: number;
  momentum: number;
  fundamentalQuality: number;
  valuation: number;
  earningsRevision: number;
  freshness: number;
  trackRecord: number;
  riskPenalty: number;
  total: number;
}

export function getDailyAlphaScoreBreakdown(
  input: DailyAlphaPickInput,
): DailyAlphaScoreBreakdown {
  const newsCatalyst = WEIGHTS.newsCatalyst * input.newsCatalystScore;
  const disclosureSignal = WEIGHTS.disclosureSignal * input.disclosureSignalScore;
  const momentum = WEIGHTS.momentum * input.momentumScore;
  const fundamentalQuality =
    WEIGHTS.fundamentalQuality * input.fundamentalQualityScore;
  const valuation = WEIGHTS.valuation * input.valuationScore;
  const earningsRevision = WEIGHTS.earningsRevision * input.earningsRevisionScore;
  const freshness = WEIGHTS.freshness * input.freshnessScore;
  const trackRecord = WEIGHTS.trackRecord * input.trackRecordScore;

  const total = clamp(
    newsCatalyst +
      disclosureSignal +
      momentum +
      fundamentalQuality +
      valuation +
      earningsRevision +
      freshness +
      trackRecord -
      input.riskPenalty,
    0,
    100,
  );

  return {
    newsCatalyst,
    disclosureSignal,
    momentum,
    fundamentalQuality,
    valuation,
    earningsRevision,
    freshness,
    trackRecord,
    riskPenalty: input.riskPenalty,
    total,
  };
}

export function computeDailyAlphaScore(input: DailyAlphaPickInput): number {
  return Math.round(getDailyAlphaScoreBreakdown(input).total);
}

export function computeDailyAlphaLabel(score: number): DailyAlphaLabel {
  if (score >= 90) return "Exceptional Candidate";
  if (score >= 80) return "High-Conviction Candidate";
  if (score >= 70) return "Strong Research Candidate";
  if (score >= 60) return "Watchlist Candidate";
  return "Low Priority";
}

export function computeFullDailyAlphaPick(
  input: DailyAlphaPickInput,
): DailyAlphaPick {
  const dailyAlphaScore = computeDailyAlphaScore(input);
  const scoreLabel = computeDailyAlphaLabel(dailyAlphaScore);
  return {
    ...input,
    dailyAlphaScore,
    scoreLabel,
  };
}

/**
 * Returns the weights used by the formula so the UI can render a transparent
 * legend without duplicating constants.
 */
export function getDailyAlphaWeights(): typeof WEIGHTS {
  return WEIGHTS;
}

// UI styling lookup — full static class strings only (Tailwind purge-safe)
export const DAILY_ALPHA_LABEL_STYLES: Record<DailyAlphaLabel, string> = {
  "Exceptional Candidate":
    "bg-purple-100 text-purple-800 ring-1 ring-purple-300",
  "High-Conviction Candidate":
    "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
  "Strong Research Candidate":
    "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
  "Watchlist Candidate":
    "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  "Low Priority": "bg-slate-100 text-slate-600 ring-1 ring-slate-300",
};
