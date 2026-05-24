"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DailyAlphaPick, DailyAlphaSortKey } from "@/types/dailyAlpha";
import { DAILY_ALPHA_LABEL_STYLES } from "@/lib/dailyAlphaScoring";

interface DailyAlphaPickTableProps {
  picks: DailyAlphaPick[];
}

interface Col {
  key: DailyAlphaSortKey | "static";
  label: string;
  sortable: boolean;
  align?: "left" | "right";
}

const COLUMNS: Col[] = [
  { key: "static", label: "#", sortable: false },
  { key: "static", label: "Ticker", sortable: false },
  { key: "static", label: "Sector", sortable: false },
  { key: "dailyAlphaScore", label: "Daily Alpha", sortable: true, align: "right" },
  { key: "newsCatalystScore", label: "News", sortable: true, align: "right" },
  {
    key: "disclosureSignalScore",
    label: "Disclosure",
    sortable: true,
    align: "right",
  },
  { key: "momentumScore", label: "Momentum", sortable: true, align: "right" },
  { key: "static", label: "Fund. Q.", sortable: false, align: "right" },
  { key: "static", label: "Valuation", sortable: false, align: "right" },
  { key: "freshnessScore", label: "Freshness", sortable: true, align: "right" },
  { key: "riskPenalty", label: "Risk", sortable: true, align: "right" },
  { key: "alphaVsSp500", label: "α vs S&P", sortable: true, align: "right" },
  { key: "static", label: "Label", sortable: false },
];

export default function DailyAlphaPickTable({ picks }: DailyAlphaPickTableProps) {
  const [sortKey, setSortKey] = useState<DailyAlphaSortKey>("dailyAlphaScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const factor = sortDir === "asc" ? 1 : -1;
    return [...picks].sort((a, b) => (a[sortKey] - b[sortKey]) * factor);
  }, [picks, sortKey, sortDir]);

  const onHeaderClick = (key: DailyAlphaSortKey) => {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (picks.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 shadow-sm">
        No candidates match the current filters.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr>
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className={`px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onHeaderClick(col.key as DailyAlphaSortKey)}
                      className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                    >
                      {col.label}
                      <span
                        aria-hidden
                        className={
                          sortKey === col.key ? "text-blue-500" : "opacity-0"
                        }
                      >
                        {sortDir === "desc" ? "↓" : "↑"}
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((p, idx) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-3 text-slate-400 font-medium text-xs tabular-nums">
                  {idx + 1}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/daily-alpha-picks/${encodeURIComponent(p.ticker)}`}
                    className="block group"
                  >
                    <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {p.ticker}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                      {p.company}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {p.sector}
                </td>
                <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">
                  {p.dailyAlphaScore}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                  {p.newsCatalystScore}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                  {p.disclosureSignalScore}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                  {p.momentumScore}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                  {p.fundamentalQualityScore}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                  {p.valuationScore}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                  {p.freshnessScore}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-rose-700 font-medium">
                  −{p.riskPenalty}
                </td>
                <td
                  className={`px-3 py-3 text-right tabular-nums font-medium ${
                    p.alphaVsSp500 >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {p.alphaVsSp500 > 0 ? "+" : ""}
                  {p.alphaVsSp500.toFixed(1)}%
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${DAILY_ALPHA_LABEL_STYLES[p.scoreLabel]}`}
                  >
                    {p.scoreLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile compact list */}
      <div className="md:hidden space-y-2.5">
        {sorted.map((p, idx) => (
          <Link
            href={`/daily-alpha-picks/${encodeURIComponent(p.ticker)}`}
            key={p.id}
            className="block bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-slate-400 tabular-nums">
                  #{idx + 1}
                </span>
                <span className="font-semibold text-slate-900">{p.ticker}</span>
                <span className="text-xs text-slate-500 truncate">
                  {p.sector}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tabular-nums">
                  {p.dailyAlphaScore}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ring-1 ${DAILY_ALPHA_LABEL_STYLES[p.scoreLabel]}`}
                >
                  {p.scoreLabel.replace(" Candidate", "")}
                </span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-slate-500">
              <div>
                News
                <div className="text-slate-800 tabular-nums font-semibold">
                  {p.newsCatalystScore}
                </div>
              </div>
              <div>
                Disc.
                <div className="text-slate-800 tabular-nums font-semibold">
                  {p.disclosureSignalScore}
                </div>
              </div>
              <div>
                Mom.
                <div className="text-slate-800 tabular-nums font-semibold">
                  {p.momentumScore}
                </div>
              </div>
              <div>
                α vs S&P
                <div
                  className={`tabular-nums font-semibold ${
                    p.alphaVsSp500 >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {p.alphaVsSp500 > 0 ? "+" : ""}
                  {p.alphaVsSp500.toFixed(1)}%
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
