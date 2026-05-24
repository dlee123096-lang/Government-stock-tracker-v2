"use client";

import type {
  ArticleSentiment,
  DailyAlphaFilterState,
  DailyAlphaLabel,
  DailyAlphaSignalType,
  RiskLevel,
  Sector,
} from "@/types/dailyAlpha";
import { DEFAULT_DAILY_ALPHA_FILTERS } from "@/types/dailyAlpha";

interface DailyAlphaFiltersProps {
  filters: DailyAlphaFilterState;
  onChange: (next: DailyAlphaFilterState) => void;
}

const SECTORS: (Sector | "All")[] = [
  "All",
  "Technology",
  "Healthcare",
  "Financials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Industrials",
  "Materials",
  "Utilities",
  "Real Estate",
  "Communication Services",
];

const SIGNAL_TYPES: (DailyAlphaSignalType | "All")[] = [
  "All",
  "Government Disclosure",
  "Insider Buy",
  "Insider Sell",
  "Institutional Buy",
  "Activist Stake",
  "Earnings Beat",
  "Earnings Miss",
  "Analyst Upgrade",
  "Analyst Downgrade",
  "Product Launch",
  "Macro Tailwind",
  "Macro Headwind",
];

const LABELS: (DailyAlphaLabel | "All")[] = [
  "All",
  "Exceptional Candidate",
  "High-Conviction Candidate",
  "Strong Research Candidate",
  "Watchlist Candidate",
  "Low Priority",
];

const SENTIMENTS: (ArticleSentiment | "All")[] = [
  "All",
  "Bullish",
  "Neutral",
  "Bearish",
];

const RISK_LEVELS: (RiskLevel | "All")[] = [
  "All",
  "Low",
  "Moderate",
  "Elevated",
  "High",
];

export default function DailyAlphaFilters({
  filters,
  onChange,
}: DailyAlphaFiltersProps) {
  const update = <K extends keyof DailyAlphaFilterState>(
    key: K,
    value: DailyAlphaFilterState[K],
  ) => onChange({ ...filters, [key]: value });

  const hasActive =
    filters.sector !== "All" ||
    filters.signalType !== "All" ||
    filters.label !== "All" ||
    filters.newsSentiment !== "All" ||
    filters.riskLevel !== "All" ||
    filters.hasGovernmentOverlap ||
    filters.hasEdgarOverlap ||
    filters.search !== "";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Search row */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Search by ticker, company, sector, catalyst, headline, or keyword
          </label>
          <input
            type="text"
            placeholder="e.g. NVDA, GLP-1, defense, MarketWatch..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Dropdown row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Select
            label="Sector"
            value={filters.sector}
            onChange={(v) => update("sector", v as Sector | "All")}
            options={SECTORS}
          />
          <Select
            label="Signal type"
            value={filters.signalType}
            onChange={(v) =>
              update("signalType", v as DailyAlphaSignalType | "All")
            }
            options={SIGNAL_TYPES}
          />
          <Select
            label="Score label"
            value={filters.label}
            onChange={(v) => update("label", v as DailyAlphaLabel | "All")}
            options={LABELS}
          />
          <Select
            label="News sentiment"
            value={filters.newsSentiment}
            onChange={(v) =>
              update("newsSentiment", v as ArticleSentiment | "All")
            }
            options={SENTIMENTS}
          />
          <Select
            label="Risk level"
            value={filters.riskLevel}
            onChange={(v) => update("riskLevel", v as RiskLevel | "All")}
            options={RISK_LEVELS}
          />
        </div>

        {/* Toggle row */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Toggle
            label="Government overlap"
            checked={filters.hasGovernmentOverlap}
            onChange={(v) => update("hasGovernmentOverlap", v)}
          />
          <Toggle
            label="EDGAR / insider overlap"
            checked={filters.hasEdgarOverlap}
            onChange={(v) => update("hasEdgarOverlap", v)}
          />
          {hasActive && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_DAILY_ALPHA_FILTERS)}
              className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </label>
  );
}
