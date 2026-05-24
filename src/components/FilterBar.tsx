"use client";

import type { FilterState } from "@/lib/utils";
import { DEFAULT_FILTERS } from "@/lib/utils";
import type { ScoreLabel, SignalType, TradeType } from "@/types/signal";

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const SIGNAL_TYPES: (SignalType | "All")[] = [
  "All",
  "Corporate Insider",
  "Government Official",
  "Hedge Fund",
  "Activist Investor",
];

const TRADE_TYPES: (TradeType | "All")[] = ["All", "Buy", "Sell"];

const LABELS: (ScoreLabel | "All")[] = [
  "All",
  "Exceptional Signal",
  "Very Strong Signal",
  "Strong Signal",
  "Watchlist Signal",
  "Weak Signal",
];

const PRESETS: { label: string; state: FilterState }[] = [
  {
    label: "Buys only",
    state: { ...DEFAULT_FILTERS, tradeType: "Buy" },
  },
  {
    label: "Top rated",
    state: { ...DEFAULT_FILTERS, label: "Exceptional Signal" },
  },
  {
    label: "Gov officials",
    state: { ...DEFAULT_FILTERS, signalType: "Government Official" },
  },
  {
    label: "Corp insiders",
    state: { ...DEFAULT_FILTERS, signalType: "Corporate Insider" },
  },
  {
    label: "Watchlist",
    state: { ...DEFAULT_FILTERS, label: "Watchlist Signal" },
  },
];

function isPresetActive(current: FilterState, preset: FilterState): boolean {
  return (
    current.tradeType === preset.tradeType &&
    current.signalType === preset.signalType &&
    current.label === preset.label &&
    current.search === preset.search
  );
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const update = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.signalType !== "All" ||
    filters.tradeType !== "All" ||
    filters.label !== "All" ||
    filters.search !== "";

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Quick-filter presets */}
      <div className="px-4 pt-3.5 pb-3 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          New here? Start with
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const active = isPresetActive(filters, p.state);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  onFiltersChange(active ? DEFAULT_FILTERS : p.state)
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ring-1 ${
                  active
                    ? "bg-blue-600 text-white ring-blue-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:ring-blue-300 hover:text-blue-700"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and dropdowns */}
      <div className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Search ticker, company, or person
            </label>
            <input
              type="text"
              placeholder="e.g. NVDA, Nancy Pelosi, Goldman Sachs..."
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Disclosure source
            </label>
            <select
              value={filters.signalType}
              onChange={(e) =>
                update("signalType", e.target.value as SignalType | "All")
              }
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SIGNAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Trade direction
            </label>
            <select
              value={filters.tradeType}
              onChange={(e) =>
                update("tradeType", e.target.value as TradeType | "All")
              }
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TRADE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Research rating
            </label>
            <select
              value={filters.label}
              onChange={(e) =>
                update("label", e.target.value as ScoreLabel | "All")
              }
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LABELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onFiltersChange(DEFAULT_FILTERS)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-2"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
