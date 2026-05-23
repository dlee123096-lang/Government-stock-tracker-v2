export type SignalType =
  | "Corporate Insider"
  | "Government Official"
  | "Hedge Fund"
  | "Activist Investor";

export type TradeType = "Buy" | "Sell";

export type RecentPerformance =
  | "Strong recent outperformance"
  | "Moderate recent outperformance"
  | "Neutral recent performance"
  | "Poor recent performance";

export type ScoreLabel =
  | "Exceptional Signal"
  | "Very Strong Signal"
  | "Strong Signal"
  | "Watchlist Signal"
  | "Weak Signal";

export interface SignalEntry {
  id: string;
  ticker: string;
  company: string;
  signalType: SignalType;
  personEntity: string;
  role: string;
  tradeType: TradeType;
  tradeSize: number;
  tradeDate: string;
  filingDate: string;
  daysDelayed: number;
  signalSubtype: string;
  contextTags: string[];
  riskFlags: string[];
  historicalAlpha: number;
  historicalWinRate: number;
  historicalTradeCount: number;
  recentPerformance: RecentPerformance;
  explanation?: string;
}

export interface ComputedSignal extends SignalEntry {
  signalScore: number;
  trackRecordScore: number;
  totalOpportunityScore: number;
  label: ScoreLabel;
}
