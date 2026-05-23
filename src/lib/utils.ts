import type {
  ComputedSignal,
  ScoreLabel,
  SignalType,
  TradeType,
} from "@/types/signal";

export type SortKey =
  | "totalOpportunityScore"
  | "signalScore"
  | "trackRecordScore"
  | "filingDate"
  | "tradeSize";

export type SortDirection = "asc" | "desc";

export interface FilterState {
  signalType: SignalType | "All";
  tradeType: TradeType | "All";
  label: ScoreLabel | "All";
  search: string;
}

export const DEFAULT_FILTERS: FilterState = {
  signalType: "All",
  tradeType: "All",
  label: "All",
  search: "",
};

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `$${m.toFixed(m >= 10 ? 1 : 2)}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return `$${amount}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function classNames(
  ...classes: (string | undefined | false | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function filterSignals(
  signals: ComputedSignal[],
  filters: FilterState,
): ComputedSignal[] {
  const search = filters.search.trim().toLowerCase();
  return signals.filter((s) => {
    if (filters.signalType !== "All" && s.signalType !== filters.signalType) {
      return false;
    }
    if (filters.tradeType !== "All" && s.tradeType !== filters.tradeType) {
      return false;
    }
    if (filters.label !== "All" && s.label !== filters.label) {
      return false;
    }
    if (search) {
      const haystack = [
        s.ticker,
        s.company,
        s.personEntity,
        s.role,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function sortSignals(
  signals: ComputedSignal[],
  key: SortKey,
  direction: SortDirection,
): ComputedSignal[] {
  const factor = direction === "asc" ? 1 : -1;
  const copy = [...signals];
  copy.sort((a, b) => {
    if (key === "filingDate") {
      const aTime = new Date(a.filingDate).getTime();
      const bTime = new Date(b.filingDate).getTime();
      return (aTime - bTime) * factor;
    }
    return (a[key] - b[key]) * factor;
  });
  return copy;
}

export function topSignalType(signals: ComputedSignal[]): SignalType | "—" {
  if (signals.length === 0) return "—";
  const counts = new Map<SignalType, number>();
  for (const s of signals) {
    counts.set(s.signalType, (counts.get(s.signalType) ?? 0) + 1);
  }
  let best: SignalType | null = null;
  let max = -1;
  for (const [type, count] of counts) {
    if (count > max) {
      max = count;
      best = type;
    }
  }
  return best ?? "—";
}
