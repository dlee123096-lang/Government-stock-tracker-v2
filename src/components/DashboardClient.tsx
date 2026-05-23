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
}

export default function DashboardClient({ signals }: DashboardClientProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filtered = useMemo(
    () => filterSignals(signals, filters),
    [signals, filters],
  );

  return (
    <div className="space-y-6">
      <SummaryCards signals={filtered} />
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      <SignalTable signals={filtered} />
    </div>
  );
}
