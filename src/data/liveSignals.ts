import { computeFullSignal } from "@/lib/scoring";
import { fetchEdgarSignals } from "@/lib/edgar";
import { fetchCongressSignals } from "@/lib/congress";
import type { ComputedSignal } from "@/types/signal";
import { computedSignals as mockSignals } from "./mockSignals";

export interface SignalDataResult {
  signals: ComputedSignal[];
  lastUpdated: string;
  isLive: boolean;
}

export async function getSignals(): Promise<SignalDataResult> {
  const lastUpdated = new Date().toISOString();

  // Run both sources concurrently; one failing doesn't kill the other
  const [edgarResult, congressResult] = await Promise.allSettled([
    fetchEdgarSignals(),
    fetchCongressSignals(),
  ]);

  const edgarEntries =
    edgarResult.status === "fulfilled" ? edgarResult.value : [];
  const congressEntries =
    congressResult.status === "fulfilled" ? congressResult.value : [];

  if (edgarResult.status === "rejected") {
    console.error("EDGAR fetch failed:", edgarResult.reason);
  }
  if (congressResult.status === "rejected") {
    console.error("Congress fetch failed:", congressResult.reason);
  }

  const allEntries = [...edgarEntries, ...congressEntries];

  if (allEntries.length >= 5) {
    return {
      signals: allEntries.map(computeFullSignal),
      lastUpdated,
      isLive: true,
    };
  }

  console.warn(
    `Live sources returned only ${allEntries.length} entries — using mock data.`,
  );
  return {
    signals: mockSignals,
    lastUpdated,
    isLive: false,
  };
}
