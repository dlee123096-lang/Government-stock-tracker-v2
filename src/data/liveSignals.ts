import { computeFullSignal } from "@/lib/scoring";
import { fetchEdgarSignals } from "@/lib/edgar";
import type { ComputedSignal } from "@/types/signal";
import { computedSignals as mockSignals } from "./mockSignals";

export interface SignalDataResult {
  signals: ComputedSignal[];
  lastUpdated: string;
  isLive: boolean;
}

export async function getSignals(): Promise<SignalDataResult> {
  const lastUpdated = new Date().toISOString();

  try {
    const edgarEntries = await fetchEdgarSignals();

    if (edgarEntries.length >= 5) {
      return {
        signals: edgarEntries.map(computeFullSignal),
        lastUpdated,
        isLive: true,
      };
    }

    // Fewer than 5 live entries means EDGAR returned very little — fall back
    console.warn(
      `EDGAR returned only ${edgarEntries.length} entries. Using mock data.`,
    );
  } catch (err) {
    console.error("EDGAR fetch failed — using mock data:", err);
  }

  return {
    signals: mockSignals,
    lastUpdated,
    isLive: false,
  };
}
