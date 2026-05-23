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

export default function DashboardClient({
  signals,
  isLive,
  lastUpdated,
}: DashboardClientProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filtered = useMemo(
    () => filterSignals(signals, filters),
    [signals, filters],
  );

  return (
    <div className="space-y-5">
      <SummaryCards signals={filtered} isLive={isLive} lastUpdated={lastUpdated} />
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      <SignalTable signals={filtered} />
    </div>
  );
}
