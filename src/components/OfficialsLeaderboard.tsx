"use client";

import Link from "next/link";
import { useState } from "react";
import type { OfficialStats } from "@/types/officials";

type Tab =
  | "track-records"
  | "most-active"
  | "committee-relevance"
  | "recent-filers"
  | "largest-trades";

const TABS: { id: Tab; label: string }[] = [
  { id: "track-records", label: "Best Track Records" },
  { id: "most-active", label: "Most Active" },
  { id: "committee-relevance", label: "Committee Relevance" },
  { id: "recent-filers", label: "Recent Filers" },
  { id: "largest-trades", label: "Largest Trades" },
];

const CHAMBER_STYLES = {
  Senate: "bg-purple-100 text-purple-800 ring-1 ring-purple-200",
  House: "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200",
};

function fmt(n: number, decimals = 1): string {
  return (n >= 0 ? "+" : "") + n.toFixed(decimals);
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortOfficials(officials: OfficialStats[], tab: Tab): OfficialStats[] {
  const copy = [...officials];
  switch (tab) {
    case "track-records":
      return copy
        .filter((o) => o.disclosureCount > 0)
        .sort((a, b) => b.avgAlpha - a.avgAlpha || b.avgWinRate - a.avgWinRate);
    case "most-active":
      return copy.sort(
        (a, b) => b.disclosureCount - a.disclosureCount || b.totalTradeValue - a.totalTradeValue,
      );
    case "committee-relevance":
      return copy.sort(
        (a, b) =>
          b.committeeRelevanceScore - a.committeeRelevanceScore ||
          b.disclosureCount - a.disclosureCount,
      );
    case "recent-filers":
      return copy
        .filter((o) => o.latestFilingDate)
        .sort((a, b) => b.latestFilingDate.localeCompare(a.latestFilingDate));
    case "largest-trades":
      return copy.sort((a, b) => b.largestTrade - a.largestTrade);
  }
}

export default function OfficialsLeaderboard({
  officials,
}: {
  officials: OfficialStats[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("track-records");
  const sorted = sortOfficials(officials, activeTab);

  return (
    <>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard table — desktop */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Official
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Disclosures
              </th>
              {activeTab === "track-records" && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Avg Alpha vs S&P
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Win Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Best Ticker
                  </th>
                </>
              )}
              {activeTab === "most-active" && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Buys / Sells
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Total Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Recent Tickers
                  </th>
                </>
              )}
              {activeTab === "committee-relevance" && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Relevance Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Relevant Trades
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Committees
                  </th>
                </>
              )}
              {activeTab === "recent-filers" && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Latest Filing
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Avg Alpha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Recent Tickers
                  </th>
                </>
              )}
              {activeTab === "largest-trades" && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Largest Trade
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Total Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Best Ticker
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((o, idx) => (
              <tr key={o.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 text-gray-400 font-medium text-xs">
                  {idx + 1}
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/official/${o.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                      {o.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {o.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${CHAMBER_STYLES[o.chamber]}`}
                        >
                          {o.chamber}
                        </span>
                        <span className="text-xs text-gray-400">{o.title}</span>
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-gray-800">
                  {o.disclosureCount}
                </td>

                {activeTab === "track-records" && (
                  <>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold">
                      <span
                        className={
                          o.avgAlpha >= 0 ? "text-emerald-700" : "text-rose-700"
                        }
                      >
                        {o.disclosureCount > 0 ? fmt(o.avgAlpha) + "%" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">
                      {o.disclosureCount > 0 ? o.avgWinRate + "%" : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      {o.bestTicker !== "—" ? (
                        <Link
                          href={`/ticker/${encodeURIComponent(o.bestTicker)}`}
                          className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {o.bestTicker}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </>
                )}

                {activeTab === "most-active" && (
                  <>
                    <td className="px-4 py-3.5 text-right text-gray-700 tabular-nums">
                      <span className="text-blue-600 font-medium">
                        {o.buyCount}B
                      </span>{" "}
                      /{" "}
                      <span className="text-gray-500">{o.sellCount}S</span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-gray-800">
                      {o.totalTradeValue > 0
                        ? formatCurrency(o.totalTradeValue)
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {o.recentTickers.slice(0, 4).map((t) => (
                          <Link
                            key={t}
                            href={`/ticker/${encodeURIComponent(t)}`}
                            className="font-mono text-xs text-blue-600 hover:underline"
                          >
                            {t}
                          </Link>
                        ))}
                        {o.recentTickers.length === 0 && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </>
                )}

                {activeTab === "committee-relevance" && (
                  <>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      <span
                        className={`font-bold ${
                          o.committeeRelevanceScore >= 50
                            ? "text-emerald-700"
                            : o.committeeRelevanceScore > 0
                              ? "text-amber-700"
                              : "text-gray-400"
                        }`}
                      >
                        {o.committeeRelevanceScore}
                      </span>
                      <span className="text-gray-400 text-xs">/100</span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">
                      {o.committeeRelevanceCount} / {o.disclosureCount}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {o.committees.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            className="inline-block px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
                          >
                            {c.replace("Senate ", "").replace("House ", "")}
                          </span>
                        ))}
                        {o.committees.length > 2 && (
                          <span className="inline-block px-2 py-0.5 text-[10px] bg-gray-100 text-gray-400 rounded">
                            +{o.committees.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                )}

                {activeTab === "recent-filers" && (
                  <>
                    <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                      {formatDate(o.latestFilingDate)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      <span
                        className={
                          o.avgAlpha >= 0 ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"
                        }
                      >
                        {o.disclosureCount > 0 ? fmt(o.avgAlpha) + "%" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {o.recentTickers.slice(0, 4).map((t) => (
                          <Link
                            key={t}
                            href={`/ticker/${encodeURIComponent(t)}`}
                            className="font-mono text-xs text-blue-600 hover:underline"
                          >
                            {t}
                          </Link>
                        ))}
                        {o.recentTickers.length === 0 && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </>
                )}

                {activeTab === "largest-trades" && (
                  <>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-gray-800">
                      {o.largestTrade > 0 ? formatCurrency(o.largestTrade) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">
                      {o.totalTradeValue > 0
                        ? formatCurrency(o.totalTradeValue)
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      {o.bestTicker !== "—" ? (
                        <Link
                          href={`/ticker/${encodeURIComponent(o.bestTicker)}`}
                          className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {o.bestTicker}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((o, idx) => (
          <Link
            key={o.name}
            href={`/official/${o.slug}`}
            className="block bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-xs text-gray-400 font-medium w-5 text-center">
                {idx + 1}
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                {o.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {o.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${CHAMBER_STYLES[o.chamber]}`}
                  >
                    {o.chamber}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate">
                    {o.title}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-gray-400">Disclosures</div>
                <div className="font-semibold text-gray-800">{o.disclosureCount}</div>
              </div>
              <div>
                <div className="text-gray-400">Avg Alpha</div>
                <div
                  className={`font-semibold ${o.avgAlpha >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                >
                  {o.disclosureCount > 0 ? fmt(o.avgAlpha) + "%" : "—"}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Win Rate</div>
                <div className="font-semibold text-gray-800">
                  {o.disclosureCount > 0 ? o.avgWinRate + "%" : "—"}
                </div>
              </div>
            </div>

            {o.recentTickers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                {o.recentTickers.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
