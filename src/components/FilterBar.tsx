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
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Ticker, company, person, role..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Signal Type
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
            Trade Type
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
            Score Label
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
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
