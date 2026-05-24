import type { Metadata } from "next";
import { OFFICIALS } from "@/data/committees";
import { getSignals } from "@/data/liveSignals";
import OfficialsLeaderboard from "@/components/OfficialsLeaderboard";
import type { OfficialStats } from "@/types/officials";

export const metadata: Metadata = {
  title: "Officials Leaderboard — Signal Alpha Stock",
  description:
    "Leaderboard of U.S. senators and representatives tracked for STOCK Act disclosures. Compare track records, win rates, alpha, activity, and committee relevance.",
};

export default async function OfficialsPage() {
  const { signals } = await getSignals();

  // Build per-official stats
  const stats: OfficialStats[] = Object.entries(OFFICIALS).map(
    ([name, info]) => {
      const officialSignals = signals.filter((s) => s.personEntity === name);

      const disclosureCount = officialSignals.length;
      const buyCount = officialSignals.filter((s) => s.tradeType === "Buy").length;
      const sellCount = officialSignals.filter((s) => s.tradeType === "Sell").length;

      const avgAlpha =
        disclosureCount > 0
          ? Number(
              (
                officialSignals.reduce((sum, s) => sum + s.historicalAlpha, 0) /
                disclosureCount
              ).toFixed(1),
            )
          : 0;

      const avgWinRate =
        disclosureCount > 0
          ? Math.round(
              officialSignals.reduce((sum, s) => sum + s.historicalWinRate, 0) /
                disclosureCount,
            )
          : 0;

      const bestSignal = officialSignals.reduce<(typeof signals)[0] | null>(
        (best, s) =>
          !best || s.totalOpportunityScore > best.totalOpportunityScore
            ? s
            : best,
        null,
      );

      const totalTradeValue = officialSignals.reduce(
        (sum, s) => sum + s.tradeSize,
        0,
      );
      const largestTrade = officialSignals.reduce(
        (max, s) => Math.max(max, s.tradeSize),
        0,
      );

      const committeeRelevanceCount = officialSignals.filter((s) =>
        s.contextTags.some(
          (t) =>
            t.toLowerCase().includes("committee") ||
            t.toLowerCase().includes("relevant"),
        ),
      ).length;

      const committeeRelevanceScore =
        disclosureCount > 0
          ? Math.round((committeeRelevanceCount / disclosureCount) * 100)
          : 0;

      const latestFilingDate = officialSignals.reduce((latest, s) => {
        return s.filingDate > latest ? s.filingDate : latest;
      }, "");

      const recentTickers = Array.from(
        new Set(
          [...officialSignals]
            .sort((a, b) => b.filingDate.localeCompare(a.filingDate))
            .slice(0, 5)
            .map((s) => s.ticker)
            .filter((t) => t && t !== "—"),
        ),
      );

      return {
        name,
        chamber: info.chamber,
        title: info.title,
        committees: info.committees,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        disclosureCount,
        buyCount,
        sellCount,
        avgAlpha,
        avgWinRate,
        bestTicker: bestSignal?.ticker ?? "—",
        totalTradeValue,
        largestTrade,
        committeeRelevanceCount,
        committeeRelevanceScore,
        latestFilingDate,
        recentTickers,
      };
    },
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Officials Leaderboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {Object.keys(OFFICIALS).length} senators and representatives · ranked
          by track record, activity, committee relevance, and trade size
        </p>
      </div>

      <OfficialsLeaderboard officials={stats} />

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900">
        <span className="font-semibold">Note:</span> Track record data (alpha,
        win rate) is derived from real post-filing Yahoo Finance price data
        where ≥2 measurable disclosures exist for a filer; otherwise synthetic
        neutral defaults are shown. Committee assignments are from public
        congressional records. This is an educational tool — not financial
        advice.
      </div>
    </div>
  );
}
