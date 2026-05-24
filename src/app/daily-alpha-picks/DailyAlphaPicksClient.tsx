"use client";

import { useMemo, useState } from "react";
import DailyAlphaFilters from "@/components/DailyAlphaFilters";
import DailyAlphaPickCard from "@/components/DailyAlphaPickCard";
import DailyAlphaPickTable from "@/components/DailyAlphaPickTable";
import type {
  DailyAlphaFilterState,
  DailyAlphaPick,
} from "@/types/dailyAlpha";
import { DEFAULT_DAILY_ALPHA_FILTERS } from "@/types/dailyAlpha";

interface ClientProps {
  top10: DailyAlphaPick[];
  top20: DailyAlphaPick[];
  all: DailyAlphaPick[];
}

function applyFilters(
  picks: DailyAlphaPick[],
  f: DailyAlphaFilterState,
): DailyAlphaPick[] {
  const q = f.search.trim().toLowerCase();
  return picks.filter((p) => {
    if (f.sector !== "All" && p.sector !== f.sector) return false;
    if (f.signalType !== "All" && !p.signalTypes.includes(f.signalType))
      return false;
    if (f.label !== "All" && p.scoreLabel !== f.label) return false;
    if (f.riskLevel !== "All" && p.riskLevel !== f.riskLevel) return false;
    if (
      f.newsSentiment !== "All" &&
      !p.supportingArticles.some((a) => a.sentiment === f.newsSentiment)
    )
      return false;
    if (f.hasGovernmentOverlap && !p.hasGovernmentDisclosureOverlap)
      return false;
    if (f.hasEdgarOverlap && !p.hasEdgarInsiderOverlap) return false;
    if (q) {
      const hay = [
        p.ticker,
        p.company,
        p.sector,
        p.mainCatalyst,
        ...p.supportingArticles.map((a) => a.title),
        ...p.supportingArticles.map((a) => a.summary),
        ...p.signalTypes,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export default function DailyAlphaPicksClient({
  top10,
  top20,
  all,
}: ClientProps) {
  const [filters, setFilters] = useState<DailyAlphaFilterState>(
    DEFAULT_DAILY_ALPHA_FILTERS,
  );

  const filtersActive =
    filters.sector !== "All" ||
    filters.signalType !== "All" ||
    filters.label !== "All" ||
    filters.newsSentiment !== "All" ||
    filters.riskLevel !== "All" ||
    filters.hasGovernmentOverlap ||
    filters.hasEdgarOverlap ||
    filters.search !== "";

  // When filters are active we draw from the full ranked set so the user
  // never loses a matching candidate just because it dropped out of the
  // unfiltered Top 10.
  const filteredCards = useMemo(
    () =>
      filtersActive
        ? applyFilters(all, filters).slice(0, 10)
        : top10,
    [filtersActive, all, filters, top10],
  );
  const filteredTable = useMemo(
    () =>
      filtersActive
        ? applyFilters(all, filters).slice(0, 20)
        : top20,
    [filtersActive, all, filters, top20],
  );

  return (
    <>
      {/* Filters */}
      <section className="mb-6">
        <DailyAlphaFilters filters={filters} onChange={setFilters} />
        {filtersActive && (
          <p className="mt-2 text-xs text-slate-500">
            Showing top matches across all {all.length} candidates · {filteredCards.length}{" "}
            in cards, {filteredTable.length} in table.
          </p>
        )}
      </section>

      {/* Top 10 cards */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
            {filtersActive ? "Top matches" : "Top 10 picks"}
          </h2>
          <span className="text-xs text-slate-500">
            {filteredCards.length} shown
          </span>
        </div>
        {filteredCards.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 shadow-sm">
            No candidates match the current filters.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredCards.map((p, i) => (
              <DailyAlphaPickCard key={p.id} pick={p} rank={i + 1} />
            ))}
          </div>
        )}
      </section>

      {/* Top 20 table */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
            {filtersActive ? "Watchlist matches" : "Top 20 watchlist"}
          </h2>
          <span className="text-xs text-slate-500">
            {filteredTable.length} shown
          </span>
        </div>
        <DailyAlphaPickTable picks={filteredTable} />
      </section>
    </>
  );
}
