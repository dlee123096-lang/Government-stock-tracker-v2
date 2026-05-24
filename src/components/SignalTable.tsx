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
  { key: "static", label: "Filing Type · Status", sortable: false },
  { key: "static", label: "Person / Role", sortable: false },
  { key: "static", label: "Action", sortable: false },
  { key: "tradeSize", label: "Size", sortable: true, align: "right" },
  { key: "filingDate", label: "Filed · Delay", sortable: true },
  { key: "signalScore", label: "Signal", sortable: true, align: "right" },
  { key: "trackRecordScore", label: "Track Rec.", sortable: true, align: "right" },
  { key: "totalOpportunityScore", label: "Score", sortable: true, align: "right" },
  { key: "static", label: "Rating", sortable: false },
];

// ── helpers ─────────────────────────────────────────────────────────────────

function filingTypeLabel(s: ComputedSignal): string {
  switch (s.signalType) {
    case "Corporate Insider":   return "Form 4";
    case "Congress — Senate":   return "PTR (STOCK Act)";
    case "Congress — House":    return "PTR (STOCK Act)";
    case "Fund Manager / 13F":  return "Form 13F";
    case "Executive Branch":    return "OGE 278e/278-T";
    case "Activist Investor":   return "13D / 13G";
    default:                    return s.signalType;
  }
}

type DataStatus = "Live" | "Quarterly" | "Sample" | "Estimated" | "Mock";

function dataStatus(s: ComputedSignal): DataStatus {
  if (s.dataFreshness === "Live") return "Live";
  if (s.dataFreshness === "Quarterly") return "Quarterly";
  if (s.dataFreshness === "Sample") return "Sample";
  if (s.dataFreshness === "Manual document") return "Estimated";
  return "Mock";
}

const DATA_STATUS_STYLES: Record<DataStatus, string> = {
  Live:      "bg-green-50 text-green-700 ring-green-200",
  Quarterly: "bg-blue-50 text-blue-700 ring-blue-200",
  Sample:    "bg-amber-50 text-amber-700 ring-amber-200",
  Estimated: "bg-slate-100 text-slate-600 ring-slate-200",
  Mock:      "bg-rose-50 text-rose-700 ring-rose-200",
};

function buildExplanation(s: ComputedSignal): string {
  return (
    `${s.tradeType} of ${formatCurrency(s.tradeSize)} in ${s.ticker} by ${s.personEntity} (${s.role}). ` +
    `Signal subtype "${s.signalSubtype}" scored ${s.signalScore}/100; ` +
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

function fmt(n: number, decimals = 1): string {
  return (n >= 0 ? "+" : "") + n.toFixed(decimals) + "%";
}

// ── component ────────────────────────────────────────────────────────────────

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
                        className={sortKey === col.key ? "text-blue-500" : "opacity-0"}
                      >
                        {sortDir === "desc" ? "↓" : "↑"}
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((s, idx) => {
              const status = dataStatus(s);
              return (
                <Fragment key={s.id}>
                  <tr
                    className={`hover:bg-slate-50 transition-colors ${
                      expandedId === s.id ? "bg-slate-50" : ""
                    }`}
                  >
                    <td className="px-3 py-3.5 text-slate-400 font-medium text-xs">
                      {idx + 1}
                    </td>
                    {/* Ticker */}
                    <td className="px-3 py-3.5">
                      {s.ticker && s.ticker !== "—" ? (
                        <Link
                          href={`/ticker/${encodeURIComponent(s.ticker)}`}
                          className="block group"
                          title={`See all disclosures for ${s.ticker}`}
                        >
                          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {s.ticker}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[150px] mt-0.5">
                            {s.company}
                          </div>
                        </Link>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-500">—</div>
                          <div className="text-xs text-slate-400 truncate max-w-[150px] mt-0.5">
                            {s.company}
                          </div>
                        </div>
                      )}
                    </td>
                    {/* Filing Type + Data Status */}
                    <td className="px-3 py-3.5">
                      <div className="text-xs text-slate-600 whitespace-nowrap">
                        {filingTypeLabel(s)}
                      </div>
                      <span
                        className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ${DATA_STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    {/* Person */}
                    <td className="px-3 py-3.5">
                      <div className="text-slate-800 text-sm">{s.personEntity}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.role}</div>
                    </td>
                    {/* Trade type */}
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
                    {/* Trade size */}
                    <td className="px-3 py-3.5 text-right text-slate-800 font-medium tabular-nums text-sm">
                      {formatCurrency(s.tradeSize)}
                    </td>
                    {/* Filed + delay */}
                    <td className="px-3 py-3.5">
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(s.filingDate)}
                      </div>
                      {s.daysDelayed > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {s.daysDelayed}d delay
                        </div>
                      )}
                    </td>
                    {/* Scores */}
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
                    <td className="px-2 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleExpand(s.id)}
                        aria-label={expandedId === s.id ? "Collapse" : "View details"}
                        className="text-slate-300 hover:text-blue-500 transition-colors text-xs leading-none px-1"
                      >
                        {expandedId === s.id ? "▲" : "▾"}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === s.id && (
                    <tr key={`${s.id}-expand`} className="bg-slate-50">
                      <td colSpan={12} className="px-5 py-4 border-b border-slate-100">
                        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                          {s.explanation ?? buildExplanation(s)}
                        </p>
                        <MiniScoreBreakdown signal={s} />
                        <PostFilingPerformance signal={s} />
                        <div className="mt-3 flex items-center gap-4 flex-wrap">
                          <Link
                            href={`/signal/${s.id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Full score breakdown →
                          </Link>
                          {s.reportUrl && (
                            <a
                              href={s.reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline inline-flex items-center gap-1"
                            >
                              Source filing ↗
                            </a>
                          )}
                          <span className="text-xs text-slate-400">
                            {filingTypeLabel(s)} · {status} data · Filed{" "}
                            {formatDate(s.filingDate)}
                            {s.daysDelayed > 0 ? ` (${s.daysDelayed}d after trade)` : ""}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          Educational tool only — not financial advice. Data from public filings
          (SEC EDGAR Form 4 &amp; 13F, Senate eFD, OGE 278e).{" "}
          <span className="inline-flex items-center gap-3 ml-2">
            <span className="text-green-600 font-medium">■ Live</span>
            <span className="text-blue-600 font-medium">■ Quarterly</span>
            <span className="text-amber-600 font-medium">■ Sample / Estimated</span>
          </span>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((s, idx) => {
          const status = dataStatus(s);
          return (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400">#{idx + 1}</span>
                      {s.ticker && s.ticker !== "—" ? (
                        <Link
                          href={`/ticker/${encodeURIComponent(s.ticker)}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {s.ticker}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-500">—</span>
                      )}
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ring-1 ${
                          s.tradeType === "Buy"
                            ? "bg-blue-50 text-blue-700 ring-blue-100"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {s.tradeType}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ${DATA_STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.company}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{filingTypeLabel(s)}</div>
                  </div>
                  <ScoreBadge label={s.label} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-slate-400">Signal</div>
                    <div className="font-semibold text-slate-800 tabular-nums">{s.signalScore}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Track Rec.</div>
                    <div className="font-semibold text-slate-800 tabular-nums">{s.trackRecordScore}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="font-bold text-slate-900 tabular-nums">{s.totalOpportunityScore}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                  <span>{s.personEntity}</span>
                  <span>
                    {formatDate(s.filingDate)}
                    {s.daysDelayed > 0 ? ` · ${s.daysDelayed}d delay` : ""}
                  </span>
                </div>
              </div>

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
                    <PostFilingPerformance signal={s} />
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link
                        href={`/signal/${s.id}`}
                        className="inline-block text-blue-600 font-medium hover:underline text-xs"
                      >
                        Full score breakdown →
                      </Link>
                      {s.reportUrl && (
                        <a
                          href={s.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 font-medium hover:text-slate-800 hover:underline text-xs"
                        >
                          Source filing ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-center text-slate-400 pt-2 pb-1">
          Educational tool only — not financial advice.
        </p>
      </div>
    </>
  );
}

// ── Post-filing performance mini-widget ──────────────────────────────────────

function PostFilingPerformance({ signal }: { signal: ComputedSignal }) {
  const hasData =
    signal.returnSinceFiling !== undefined &&
    signal.sp500ReturnSinceFiling !== undefined &&
    signal.alphaSinceFiling !== undefined;

  return (
    <div className="mt-4">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
        Post-filing price performance
      </p>
      {hasData ? (
        <div className="grid grid-cols-3 gap-3">
          <PerfCell
            label={`${signal.ticker} return`}
            value={fmt(signal.returnSinceFiling!)}
            good={signal.returnSinceFiling! >= 0}
          />
          <PerfCell
            label="SPY (same period)"
            value={fmt(signal.sp500ReturnSinceFiling!)}
            neutral
          />
          <PerfCell
            label="Alpha vs SPY"
            value={fmt(signal.alphaSinceFiling!)}
            good={signal.alphaSinceFiling! >= 0}
          />
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 italic">
          {signal.dataFreshness === "Sample" || signal.dataFreshness === "Manual document"
            ? "Price data not tracked for sample / estimated entries."
            : "Pending real price data — computed at build time from Yahoo Finance once sufficient filing history exists."}
        </p>
      )}
    </div>
  );
}

function PerfCell({
  label,
  value,
  good,
  neutral,
}: {
  label: string;
  value: string;
  good?: boolean;
  neutral?: boolean;
}) {
  const cls = neutral
    ? "text-slate-700"
    : good
      ? "text-emerald-700"
      : "text-rose-700";
  return (
    <div className="bg-white rounded-lg border border-slate-100 px-3 py-2 text-center">
      <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

// ── Mini score breakdown ─────────────────────────────────────────────────────

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
          className={`h-full rounded-full ${negative ? "bg-rose-400" : "bg-blue-500"}`}
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
