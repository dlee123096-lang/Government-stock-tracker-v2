export interface OfficialStats {
  name: string;
  chamber: "Senate" | "House";
  title: string;
  committees: string[];
  slug: string;

  disclosureCount: number;
  buyCount: number;
  sellCount: number;

  avgAlpha: number;
  avgWinRate: number;

  bestTicker: string;
  totalTradeValue: number;
  largestTrade: number;

  committeeRelevanceCount: number;
  /** committeeRelevanceCount / disclosureCount * 100, rounded */
  committeeRelevanceScore: number;

  latestFilingDate: string;
  recentTickers: string[];
}
