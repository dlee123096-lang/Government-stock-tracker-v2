"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComputedSignal } from "@/types/signal";
import type { SortDirection, SortKey } from "@/lib/utils";
import { formatCurrency, formatDate, sortSignals } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";

interface SignalTableProps {
  signals: ComputedSignal[];
}

interface Column {
  key: SortKey | "static";
  label: string;
  sortable: boolean;
  align?: "left" | "right";
}

const COLUMNS: Column[] = [
  { key: "static", label: "Rank", sortable: false },
  { key: "static", label: "Ticker / Company", sortable: false },
  { key: "static", label: "Signal", sortable: false },
  { key: "static", label: "Person / Role", sortable: false },
  { key: "static", label: "Trade", sortable: false },
  { key: "tradeSize", label: "Size", sortable: true, align: "right" },
  { key: "filingDate", label: "Filed", sortable: true },
  { key: "signalScore", label: "Signal", sortable: true, align: "right" },
  {
    key: "trackRecordScore",
    label: "Track Rec.",
    sortable: true,
    align: "right",
  },
  {
    key: "totalOpportunityScore",
    label: "Total",
    sortable: true,
    align: "right",
  },
  { key: "static", label: "Label", sortable: false },
];

export default function SignalTable({ signals }: SignalTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalOpportunityScore");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const sorted = useMemo(
    () => sortSignals(signals, sortKey, sortDir),
    [signals, sortKey, sortDir],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (signals.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
        No signals match your filters.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className={`px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key as SortKey)}
                      className="inline-flex items-center gap-1 hover:text-gray-900"
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span aria-hidden>
                          {sortDir === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((s, idx) => (
              <tr
                key={s.id}
                className="hover:bg-blue-50 transition-colors"
              >
                <td className="px-3 py-3 text-gray-500 font-medium">
                  {idx + 1}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/signal/${s.id}`}
                    className="block hover:text-blue-600"
                  >
                    <div className="font-semibold text-gray-900">{s.ticker}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[180px]">
                      {s.company}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3 text-gray-700 text-xs">
                  {s.signalType}
                </td>
                <td className="px-3 py-3">
                  <div className="text-gray-900">{s.personEntity}</div>
                  <div className="text-xs text-gray-500">{s.role}</div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.tradeType === "Buy"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {s.tradeType}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-gray-900 font-medium tabular-nums">
                  {formatCurrency(s.tradeSize)}
                </td>
                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                  {formatDate(s.filingDate)}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-gray-900 tabular-nums">
                  {s.signalScore}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-gray-900 tabular-nums">
                  {s.trackRecordScore}
                </td>
                <td className="px-3 py-3 text-right font-bold text-gray-900 tabular-nums">
                  {s.totalOpportunityScore}
                </td>
                <td className="px-3 py-3">
                  <ScoreBadge label={s.label} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((s, idx) => (
          <Link
            key={s.id}
            href={`/signal/${s.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-blue-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                  <span className="font-bold text-gray-900">{s.ticker}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{s.company}</div>
              </div>
              <ScoreBadge label={s.label} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-gray-500">Signal</div>
                <div className="font-semibold text-gray-900">
                  {s.signalScore}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Track Rec.</div>
                <div className="font-semibold text-gray-900">
                  {s.trackRecordScore}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="font-bold text-gray-900">
                  {s.totalOpportunityScore}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 flex justify-between">
              <span>
                {s.tradeType} • {formatCurrency(s.tradeSize)}
              </span>
              <span>{formatDate(s.filingDate)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
