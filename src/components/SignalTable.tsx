"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import type { ComputedSignal } from "@/types/signal";
import type { SortDirection, SortKey } from "@/lib/utils";
import { formatCurrency, formatDate, sortSignals } from "@/lib/utils";
import { getSignalScoreBreakdown } from "@/lib/scoring";
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
  { key: "static", label: "#", sortable: false },
  { key: "static", label: "Ticker / Company", sortable: false },
  { key: "static", label: "Source", sortable: false },
  { key: "static", label: "Person / Role", sortable: false },
  { key: "static", label: "Action", sortable: false },
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
    label: "Score",
    sortable: true,
    align: "right",
  },
  { key: "static", label: "Rating", sortable: false },
];

// Stable fallback explanation built from signal data
function buildExplanation(s: ComputedSignal): string {
  return (
    `${s.tradeType} of ${formatCurrency(s.tradeSize)} in ${s.ticker} by ${s.personEntity} (${s.role}). ` +
    `Signal subtype "${s.signalSubtype}" scored ${s.signalScore}/100 for signal strength; ` +
    `track record scored ${s.trackRecordScore}/100. ` +
    `Filing was ${s.daysDelayed} day${s.daysDelayed === 1 ? "" : "s"} after the trade date.` +
    (s.contextTags.length > 0
      ? ` Context bonuses: ${s.contextTags.join(", ")}.`
      : "") +
    (s.riskFlags.length > 0
      ? ` Risk flags: ${s.riskFlags.join(", ")}.`
      : "")
  );
}

export default function SignalTable({ signals }: SignalTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalOpportunityScore");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (signals.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
        No disclosures match your filters.
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
                      onClick={() => handleSort(col.key as SortKey)}
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
              {/* Expand column header */}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((s, idx) => (
              <Fragment key={s.id}>
                <tr
                  className={`hover:bg-slate-50 transition-colors ${
                    expandedId === s.id ? "bg-slate-50" : ""
                  }`}
                >
                  <td className="px-3 py-3.5 text-slate-400 font-medium text-xs">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-3.5">
                    <Link
                      href={`/signal/${s.id}`}
                      className="block group"
                    >
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {s.ticker}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[160px] mt-0.5">
                        {s.company}
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                    {s.signalType}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="text-slate-800 text-sm">{s.personEntity}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.role}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
                        s.tradeType === "Buy"
                          ? "bg-blue-50 text-blue-700 ring-blue-100"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {s.tradeType}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right text-slate-800 font-medium tabular-nums text-sm">
                    {formatCurrency(s.tradeSize)}
                  </td>
                  <td className="px-3 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                    {formatDate(s.filingDate)}
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-slate-700 font-medium text-sm">
                    {s.signalScore}
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-slate-700 font-medium text-sm">
                    {s.trackRecordScore}
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums font-bold text-slate-900 text-sm">
                    {s.totalOpportunityScore}
                  </td>
                  <td className="px-3 py-3.5">
                    <ScoreBadge label={s.label} />
                  </td>
                  {/* Expand toggle */}
                  <td className="px-2 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleExpand(s.id)}
                      aria-label={
                        expandedId === s.id ? "Collapse" : "View details"
                      }
                      className="text-slate-300 hover:text-blue-500 transition-colors text-xs leading-none px-1"
                    >
                      {expandedId === s.id ? "▲" : "▾"}
                    </button>
                  </td>
                </tr>

                {/* Expandable explanation row */}
                {expandedId === s.id && (
                  <tr key={`${s.id}-expand`} className="bg-slate-50">
                    <td
                      colSpan={12}
                      className="px-5 py-4 border-b border-slate-100"
                    >
                      <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {s.explanation ?? buildExplanation(s)}
                      </p>
                      <MiniScoreBreakdown signal={s} />
                      <div className="mt-3 flex items-center gap-4">
                        <Link
                          href={`/signal/${s.id}`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Full score breakdown →
                        </Link>
                        <span className="text-xs text-slate-400">
                          {s.signalType} · Filed {formatDate(s.filingDate)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* Table footer disclaimer */}
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          Educational tool only — not financial advice. Data from public disclosures (SEC EDGAR, STOCK Act).
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((s, idx) => (
          <div
            key={s.id}
            className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">#{idx + 1}</span>
                    <Link
                      href={`/signal/${s.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {s.ticker}
                    </Link>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ring-1 ${
                        s.tradeType === "Buy"
                          ? "bg-blue-50 text-blue-700 ring-blue-100"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {s.tradeType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.company}</div>
                </div>
                <ScoreBadge label={s.label} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-slate-400">Signal</div>
                  <div className="font-semibold text-slate-800 tabular-nums">
                    {s.signalScore}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Track Rec.</div>
                  <div className="font-semibold text-slate-800 tabular-nums">
                    {s.trackRecordScore}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="font-bold text-slate-900 tabular-nums">
                    {s.totalOpportunityScore}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                <span>{s.personEntity}</span>
                <span>{formatDate(s.filingDate)}</span>
              </div>
            </div>

            {/* Mobile expand */}
            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => toggleExpand(s.id)}
                className="w-full px-4 py-2.5 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <span>{expandedId === s.id ? "Hide details" : "View details"}</span>
                <span aria-hidden>{expandedId === s.id ? "▲" : "▾"}</span>
              </button>
              {expandedId === s.id && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed">
                  <p>{s.explanation ?? buildExplanation(s)}</p>
                  <MiniScoreBreakdown signal={s} />
                  <Link
                    href={`/signal/${s.id}`}
                    className="mt-3 inline-block text-blue-600 font-medium hover:underline text-xs"
                  >
                    Full score breakdown →
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}

        <p className="text-xs text-center text-slate-400 pt-2 pb-1">
          Educational tool only — not financial advice.
        </p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mini score breakdown — shown in expanded rows (desktop + mobile)
// ---------------------------------------------------------------------------

const SIG_BARS: {
  label: string;
  key: "strength" | "conviction" | "freshness" | "bonus" | "penalty";
  max: number;
  negative: boolean;
  tip: string;
}[] = [
  {
    label: "Source quality",
    key: "strength",
    max: 40,
    negative: false,
    tip: "Based on who filed and what type of disclosure this is",
  },
  {
    label: "Trade conviction",
    key: "conviction",
    max: 20,
    negative: false,
    tip: "Based on the reported trade size",
  },
  {
    label: "Filing recency",
    key: "freshness",
    max: 15,
    negative: false,
    tip: "Days between the trade and the filing date",
  },
  {
    label: "Context factors",
    key: "bonus",
    max: 15,
    negative: false,
    tip: "Supporting signals e.g. cluster buying, committee relevance",
  },
  {
    label: "Risk deductions",
    key: "penalty",
    max: 20,
    negative: true,
    tip: "Penalties for risk flags e.g. debt, litigation, stale filing",
  },
];

function MiniBar({
  label,
  value,
  max,
  negative,
  tip,
}: {
  label: string;
  value: number;
  max: number;
  negative: boolean;
  tip: string;
}) {
  const pct = Math.round(Math.min(100, (value / max) * 100));
  return (
    <div title={tip}>
      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
        <span>{label}</span>
        <span className="tabular-nums font-mono">
          {negative ? "−" : ""}
          {value}/{max}
        </span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            negative ? "bg-rose-400" : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MiniScoreBreakdown({ signal }: { signal: ComputedSignal }) {
  const sig = getSignalScoreBreakdown(signal);

  return (
    <div className="mt-4">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
        Score breakdown
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
        {SIG_BARS.map(({ label, key, max, negative, tip }) => (
          <MiniBar
            key={key}
            label={label}
            value={sig[key]}
            max={max}
            negative={negative}
            tip={tip}
          />
        ))}
        <MiniBar
          label="Track record"
          value={signal.trackRecordScore}
          max={100}
          negative={false}
          tip="Historical performance of this filer on similar disclosures"
        />
      </div>

      <p className="mt-3 text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed">
        <span className="font-medium text-slate-500">Limitations:</span> Does
        not account for company valuation, earnings expectations, or macro
        conditions. Does not guarantee future returns. For educational research
        only.
      </p>
    </div>
  );
}
