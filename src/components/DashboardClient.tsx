"use client";

import { useMemo, useState } from "react";
import type { ComputedSignal } from "@/types/signal";
import { DEFAULT_FILTERS, filterSignals } from "@/lib/utils";
import type { FilterState } from "@/lib/utils";
import FilterBar from "./FilterBar";
import SignalTable from "./SignalTable";
import SummaryCards from "./SummaryCards";

interface DashboardClientProps {
  signals: ComputedSignal[];
  isLive: boolean;
  lastUpdated: string;
}

const SCORE_GUIDE = [
  {
    term: "Signal Score",
    range: "0–100",
    desc: "Strength of this single public disclosure: who filed it, how much they traded, and how quickly after the trade date.",
  },
  {
    term: "Track Record",
    range: "0–100",
    desc: "Historical performance of this filer on similar past disclosures — based on alpha, win rate, and number of prior trades.",
  },
  {
    term: "Total Score",
    range: "0–100",
    desc: "Weighted blend: 65% Signal Score + 35% Track Record. Higher means a more noteworthy research signal.",
  },
  {
    term: "Rating",
    range: "Label",
    desc: "Human-readable summary: Exceptional (90+), Very Strong (75+), Strong (60+), Watchlist (40+), Weak (below 40).",
  },
  {
    term: "Source Type",
    range: "Category",
    desc: "Who filed: Corporate Insider (exec/director via Form 4), Government Official (Congress via STOCK Act), Hedge Fund (13F), or Activist (13D).",
  },
];

export default function DashboardClient({
  signals,
  isLive,
  lastUpdated,
}: DashboardClientProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [guideOpen, setGuideOpen] = useState(true);

  const filtered = useMemo(
    () => filterSignals(signals, filters),
    [signals, filters],
  );

  return (
    <div className="space-y-4">
      <SummaryCards signals={filtered} isLive={isLive} lastUpdated={lastUpdated} />

      {/* How to use this dashboard */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
          aria-expanded={guideOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className="w-4 h-4 text-blue-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
              />
            </svg>
            <span className="text-sm font-semibold text-slate-800">
              How to use this dashboard
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              — what each score means
            </span>
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0 ml-3 tabular-nums">
            {guideOpen ? "▲ Hide" : "▾ Show"}
          </span>
        </button>

        {guideOpen && (
          <div className="border-t border-slate-100 px-5 pb-5 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {SCORE_GUIDE.map(({ term, range, desc }) => (
                <div key={term} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800">
                      {term}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {range}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Educational tool only.</span>{" "}
                  Scores are research signals, not buy or sell recommendations.
                  All data is from public SEC EDGAR and STOCK Act filings.
                  Past patterns do not predict future returns.
                </p>
              </div>
              {!isLive && (
                <div className="sm:w-56 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-700">
                      Sample data mode.
                    </span>{" "}
                    Live SEC EDGAR data was unavailable at build time. Showing
                    illustrative sample disclosures.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <FilterBar filters={filters} onFiltersChange={setFilters} />
      <SignalTable signals={filtered} />
    </div>
  );
}
