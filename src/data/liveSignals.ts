import { unstable_cache } from "next/cache";
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

/**
 * Fetch live signals from SEC EDGAR and Senate eFD, then cache the combined
 * result for 4 hours (14 400 seconds).
 *
 * Using unstable_cache means the 60+ sequential SEC requests only fire once
 * per cache window — not on every dashboard page load.  The daily GitHub
 * Actions rebuild also busts this cache automatically.
 */
const fetchLiveSignals = unstable_cache(
  async (): Promise<SignalDataResult> => {
    const lastUpdated = new Date().toISOString();

    // Run both sources concurrently — one failing never kills the other
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
      console.log(
        `Live signals: ${edgarEntries.length} EDGAR + ${congressEntries.length} Congress = ${allEntries.length} total`,
      );
      return {
        signals: allEntries.map(computeFullSignal),
        lastUpdated,
        isLive: true,
      };
    }

    console.warn(
      `Live sources returned only ${allEntries.length} entries — using sample data.`,
    );
    return {
      signals: mockSignals,
      lastUpdated,
      isLive: false,
    };
  },
  ["signal-alpha-live-signals"],
  { revalidate: 14_400 }, // 4 hours — refreshed by daily Vercel rebuild hook
);

export async function getSignals(): Promise<SignalDataResult> {
  return fetchLiveSignals();
}
