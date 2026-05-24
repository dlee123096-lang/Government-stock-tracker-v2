/**
 * Daily Alpha Picks — type contracts.
 *
 * Every field here describes RESEARCH METADATA only. None of it represents a
 * buy/sell recommendation, a prediction, or financial advice. Scores are
 * derived from public data, mock data, or delayed sources and may be wrong.
 */

export type Sector =
  | "Technology"
  | "Healthcare"
  | "Financials"
  | "Consumer Discretionary"
  | "Consumer Staples"
  | "Energy"
  | "Industrials"
  | "Materials"
  | "Utilities"
  | "Real Estate"
  | "Communication Services";

export type MarketCapCategory =
  | "Mega Cap"
  | "Large Cap"
  | "Mid Cap"
  | "Small Cap";

export type RiskLevel = "Low" | "Moderate" | "Elevated" | "High";

export type ArticleSentiment = "Bullish" | "Neutral" | "Bearish";

export type DailyAlphaSignalType =
  | "Government Disclosure"
  | "Insider Buy"
  | "Insider Sell"
  | "Institutional Buy"
  | "Activist Stake"
  | "Earnings Beat"
  | "Earnings Miss"
  | "Analyst Upgrade"
  | "Analyst Downgrade"
  | "Product Launch"
  | "Macro Tailwind"
  | "Macro Headwind";

export type DailyAlphaLabel =
  | "Exceptional Candidate"
  | "High-Conviction Candidate"
  | "Strong Research Candidate"
  | "Watchlist Candidate"
  | "Low Priority";

export interface SupportingArticle {
  title: string;
  source: string;
  publishedDate: string; // ISO YYYY-MM-DD
  url: string;
  sentiment: ArticleSentiment;
  trustScore: number; // 0-100, derived from src/lib/newsSources.ts
  /** Short original summary written for this mock dataset. Never copies full article text. */
  summary: string;
}

export interface DailyAlphaPickInput {
  id: string;
  ticker: string;
  company: string;
  sector: Sector;
  marketCapCategory: MarketCapCategory;
  mainCatalyst: string;
  signalTypes: DailyAlphaSignalType[];

  // Disclosure overlap flags — link back to the existing SignalAlpha disclosure pipeline
  hasGovernmentDisclosureOverlap: boolean;
  hasEdgarInsiderOverlap: boolean;
  hasInstitutionalOverlap: boolean;
  hasActivistOverlap: boolean;

  // Raw 0–100 sub-scores (will be combined by computeDailyAlphaScore)
  newsCatalystScore: number;
  disclosureSignalScore: number;
  momentumScore: number;
  fundamentalQualityScore: number;
  valuationScore: number;
  earningsRevisionScore: number;
  freshnessScore: number;
  trackRecordScore: number;
  riskPenalty: number;

  riskLevel: RiskLevel;
  supportingArticles: SupportingArticle[];

  bullCase: string;
  bearCase: string;
  riskFlags: string[];

  // Hypothetical performance since the pick was published
  returnSincePick: number; // percentage
  sp500ReturnSincePick: number; // percentage
  alphaVsSp500: number; // returnSincePick - sp500ReturnSincePick

  strongerIf: string[];
  weakerIf: string[];

  /** ISO date the candidate first appeared on the daily list. */
  pickedOn: string;
}

export interface DailyAlphaPick extends DailyAlphaPickInput {
  dailyAlphaScore: number;
  scoreLabel: DailyAlphaLabel;
}

export type DailyAlphaSortKey =
  | "dailyAlphaScore"
  | "newsCatalystScore"
  | "disclosureSignalScore"
  | "momentumScore"
  | "alphaVsSp500"
  | "freshnessScore"
  | "riskPenalty";

export interface DailyAlphaFilterState {
  sector: Sector | "All";
  signalType: DailyAlphaSignalType | "All";
  label: DailyAlphaLabel | "All";
  newsSentiment: ArticleSentiment | "All";
  riskLevel: RiskLevel | "All";
  hasGovernmentOverlap: boolean;
  hasEdgarOverlap: boolean;
  search: string;
}

export const DEFAULT_DAILY_ALPHA_FILTERS: DailyAlphaFilterState = {
  sector: "All",
  signalType: "All",
  label: "All",
  newsSentiment: "All",
  riskLevel: "All",
  hasGovernmentOverlap: false,
  hasEdgarOverlap: false,
  search: "",
};
