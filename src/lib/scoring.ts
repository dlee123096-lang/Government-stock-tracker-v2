import type {
  ComputedSignal,
  ScoreLabel,
  SignalEntry,
  RecentPerformance,
} from "@/types/signal";

const SIGNAL_STRENGTH_MAP: Record<string, number> = {
  "CEO open-market buy": 40,
  "CFO open-market buy": 38,
  "Director open-market buy": 30,
  "Cluster insider buying": 40,
  "Insider sell": 10,
  "Relevant committee trade": 35,
  "Large congressional purchase": 30,
  "Multiple officials buying same sector": 35,
  "Spouse/advisor trade": 15,
  "Government official sell": 10,
  "High-performing fund new position": 35,
  "Major position increase": 30,
  "Multiple respected funds buying": 35,
  "Generic 13F holding": 15,
  "New 13D activist filing": 40,
  "Activist increasing stake": 35,
  "Clear activist campaign": 38,
  "Passive 13G filing": 15,
};

const CONTEXT_BONUS_MAP: Record<string, number> = {
  "Stock down more than 30% before buy": 5,
  "Small/mid-cap undercovered": 4,
  "Multiple signals overlap": 5,
  "Sector relevance to committee": 4,
  "Activist has clear plan to unlock value": 5,
  "Strong fundamentals": 3,
};

const RISK_PENALTY_MAP: Record<string, number> = {
  "High debt": 5,
  "Negative earnings": 5,
  "Major lawsuit/regulatory investigation": 8,
  "Illiquid penny stock": 8,
  "Stale filing": 4,
  "Stock already surged after disclosure": 5,
  "Heavy insider selling": 6,
  "Dilution risk": 5,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function computeSignalStrength(entry: SignalEntry): number {
  const raw = SIGNAL_STRENGTH_MAP[entry.signalSubtype] ?? 0;
  return clamp(raw, 0, 40);
}

export function computeTradeConviction(tradeSize: number): number {
  if (tradeSize >= 1_000_000) return 20;
  if (tradeSize >= 500_000) return 16;
  if (tradeSize >= 100_000) return 12;
  if (tradeSize >= 50_000) return 8;
  return 4;
}

export function computeFilingFreshness(daysDelayed: number): number {
  if (daysDelayed <= 2) return 15;
  if (daysDelayed <= 7) return 12;
  if (daysDelayed <= 14) return 8;
  if (daysDelayed <= 30) return 5;
  return 1;
}

export function computeContextBonus(contextTags: string[]): number {
  const sum = contextTags.reduce(
    (acc, tag) => acc + (CONTEXT_BONUS_MAP[tag] ?? 0),
    0,
  );
  return clamp(sum, 0, 15);
}

export function computeRiskPenalty(riskFlags: string[]): number {
  const sum = riskFlags.reduce(
    (acc, flag) => acc + (RISK_PENALTY_MAP[flag] ?? 0),
    0,
  );
  return clamp(sum, 0, 20);
}

export function computeSignalScore(entry: SignalEntry): number {
  const strength = computeSignalStrength(entry);
  const conviction = computeTradeConviction(entry.tradeSize);
  const freshness = computeFilingFreshness(entry.daysDelayed);
  const bonus = computeContextBonus(entry.contextTags);
  const penalty = computeRiskPenalty(entry.riskFlags);
  return clamp(strength + conviction + freshness + bonus - penalty, 0, 100);
}

export function computeHistoricalAlphaScore(alpha: number): number {
  if (alpha > 20) return 40;
  if (alpha >= 10) return 32;
  if (alpha >= 5) return 24;
  if (alpha >= 0) return 16;
  return 5;
}

export function computeWinRateScore(winRate: number): number {
  if (winRate >= 70) return 25;
  if (winRate >= 60) return 20;
  if (winRate >= 50) return 15;
  if (winRate >= 40) return 8;
  return 3;
}

export function computeSampleSizeConfidence(tradeCount: number): number {
  if (tradeCount >= 30) return 20;
  if (tradeCount >= 15) return 16;
  if (tradeCount >= 8) return 12;
  if (tradeCount >= 3) return 7;
  return 3;
}

export function computeRecencyBonus(recent: RecentPerformance): number {
  switch (recent) {
    case "Strong recent outperformance":
      return 15;
    case "Moderate recent outperformance":
      return 10;
    case "Neutral recent performance":
      return 5;
    case "Poor recent performance":
      return 0;
  }
}

export function computeTrackRecordScore(entry: SignalEntry): number {
  const alpha = computeHistoricalAlphaScore(entry.historicalAlpha);
  const winRate = computeWinRateScore(entry.historicalWinRate);
  const sample = computeSampleSizeConfidence(entry.historicalTradeCount);
  const recency = computeRecencyBonus(entry.recentPerformance);
  return clamp(alpha + winRate + sample + recency, 0, 100);
}

export function computeTotalOpportunityScore(
  signalScore: number,
  trackRecordScore: number,
): number {
  return Math.round(0.65 * signalScore + 0.35 * trackRecordScore);
}

export function computeLabel(totalScore: number): ScoreLabel {
  if (totalScore >= 90) return "Exceptional Signal";
  if (totalScore >= 75) return "Very Strong Signal";
  if (totalScore >= 60) return "Strong Signal";
  if (totalScore >= 40) return "Watchlist Signal";
  return "Weak Signal";
}

export function computeFullSignal(entry: SignalEntry): ComputedSignal {
  const signalScore = computeSignalScore(entry);
  const trackRecordScore = computeTrackRecordScore(entry);
  const totalOpportunityScore = computeTotalOpportunityScore(
    signalScore,
    trackRecordScore,
  );
  const label = computeLabel(totalOpportunityScore);
  return {
    ...entry,
    signalScore,
    trackRecordScore,
    totalOpportunityScore,
    label,
  };
}

export interface SignalScoreBreakdown {
  strength: number;
  conviction: number;
  freshness: number;
  bonus: number;
  penalty: number;
  total: number;
}

export interface TrackRecordBreakdown {
  alpha: number;
  winRate: number;
  sample: number;
  recency: number;
  total: number;
}

export function getSignalScoreBreakdown(
  entry: SignalEntry,
): SignalScoreBreakdown {
  const strength = computeSignalStrength(entry);
  const conviction = computeTradeConviction(entry.tradeSize);
  const freshness = computeFilingFreshness(entry.daysDelayed);
  const bonus = computeContextBonus(entry.contextTags);
  const penalty = computeRiskPenalty(entry.riskFlags);
  const total = clamp(strength + conviction + freshness + bonus - penalty, 0, 100);
  return { strength, conviction, freshness, bonus, penalty, total };
}

export function getTrackRecordBreakdown(
  entry: SignalEntry,
): TrackRecordBreakdown {
  const alpha = computeHistoricalAlphaScore(entry.historicalAlpha);
  const winRate = computeWinRateScore(entry.historicalWinRate);
  const sample = computeSampleSizeConfidence(entry.historicalTradeCount);
  const recency = computeRecencyBonus(entry.recentPerformance);
  const total = clamp(alpha + winRate + sample + recency, 0, 100);
  return { alpha, winRate, sample, recency, total };
}
