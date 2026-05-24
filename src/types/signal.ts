export type SignalType =
  | "Corporate Insider"   // SEC Form 4
  | "Congress — Senate"   // Senate eFD PTR (STOCK Act)
  | "Congress — House"    // House Clerk PTR (STOCK Act)
  | "Fund Manager / 13F"  // SEC Form 13F — quarterly institutional holdings
  | "Executive Branch"    // OGE Form 278e / 278-T — annual/transaction disclosure
  | "Activist Investor";  // SEC 13D / 13G

export type TradeType = "Buy" | "Sell";

/**
 * How fresh this record is.
 * Used for UI labelling and disclaimer display.
 */
export type DataFreshness =
  | "Live"              // fetched from an API at build time
  | "Quarterly"         // SEC 13F — 45 days after quarter-end by law
  | "Sample"            // representative data; live fetch not yet available
  | "Manual document";  // sourced from a public PDF / official document

export type RecentPerformance =
  | "Strong recent outperformance"
  | "Moderate recent outperformance"
  | "Neutral recent performance"
  | "Poor recent performance";

export type ScoreLabel =
  | "Exceptional"
  | "Very Strong"
  | "Strong"
  | "Moderate"
  | "Low";

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
  /** How fresh this data is — shown as a label in the UI */
  dataFreshness?: DataFreshness;
  /** Link to the official public disclosure document or source page */
  reportUrl?: string;
}

export interface ComputedSignal extends SignalEntry {
  signalScore: number;
  trackRecordScore: number;
  totalOpportunityScore: number;
  label: ScoreLabel;
  /** % price change from filing date to today (30-day cap). Live signals only. */
  returnSinceFiling?: number;
  /** SPY % change over the same window. */
  sp500ReturnSinceFiling?: number;
  /** returnSinceFiling − sp500ReturnSinceFiling */
  alphaSinceFiling?: number;
}
