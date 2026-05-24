import { unstable_cache } from "next/cache";
import { computeFullSignal } from "@/lib/scoring";
import { fetchEdgarSignals } from "@/lib/edgar";
import { fetchCongressSignals } from "@/lib/congress";
import { fetchForm13fSignals } from "@/lib/form13f";
import { fetchHouseSignals } from "@/lib/house";
import {
  applyFilerPerformance,
  buildPerformanceData,
} from "@/lib/performance";
import { ogeComputedSignals } from "@/data/ogeSignals";
import type { ComputedSignal } from "@/types/signal";
import { computedSignals as mockSignals } from "./mockSignals";

export interface SignalDataResult {
  signals: ComputedSignal[];
  lastUpdated: string;
  isLive: boolean;
}

/**
 * Fetch live signals from all active sources, then cache the combined result
 * for 4 hours (14 400 seconds).
 *
 * Sources and their live status:
 *   Corporate Insider     — SEC EDGAR Form 4       — Live ✅
 *   Congress — Senate     — Senate eFD API          — Live ✅
 *   Fund Manager / 13F    — SEC EDGAR Form 13F      — Live (quarterly) ✅
 *   Congress — House      — House Clerk PTR         — Sample ⚠️ (PDFs only)
 *   Executive Branch      — OGE 278e / 278-T        — Static curated ⚠️
 *
 * Using unstable_cache means the 100+ sequential SEC requests only fire once
 * per cache window — not on every dashboard page load. The daily GitHub
 * Actions rebuild also busts this cache automatically.
 */
const fetchLiveSignals = unstable_cache(
  async (): Promise<SignalDataResult> => {
    const lastUpdated = new Date().toISOString();

    // Run all live-fetch sources concurrently — one failing never kills the others
    const [edgarResult, congressResult, form13fResult, houseResult] =
      await Promise.allSettled([
        fetchEdgarSignals(),
        fetchCongressSignals(),
        fetchForm13fSignals(),
        fetchHouseSignals(),
      ]);

    const edgarEntries =
      edgarResult.status === "fulfilled" ? edgarResult.value : [];
    const congressEntries =
      congressResult.status === "fulfilled" ? congressResult.value : [];
    const form13fEntries =
      form13fResult.status === "fulfilled" ? form13fResult.value : [];
    const houseEntries =
      houseResult.status === "fulfilled" ? houseResult.value : [];

    if (edgarResult.status === "rejected")
      console.error("EDGAR fetch failed:", edgarResult.reason);
    if (congressResult.status === "rejected")
      console.error("Congress Senate fetch failed:", congressResult.reason);
    if (form13fResult.status === "rejected")
      console.error("13F fetch failed:", form13fResult.reason);
    if (houseResult.status === "rejected")
      console.error("House fetch failed:", houseResult.reason);

    // OGE is always static — no async fetch needed
    const ogeEntries = ogeComputedSignals;

    const liveEntries = [
      ...edgarEntries,
      ...congressEntries,
      ...form13fEntries,
      ...houseEntries,
    ];

    // Enrich Track Record with real Yahoo-derived returns where filers have
    // ≥2 measurable disclosures in the dataset. Filers with too little
    // history keep their neutral defaults (the UI shows an amber note).
    // Also computes per-entry returnSinceFiling / sp500ReturnSinceFiling / alphaSinceFiling.
    let enriched = liveEntries;
    let entryReturns = new Map<string, { returnSinceFiling: number; sp500ReturnSinceFiling: number; alphaSinceFiling: number }>();
    try {
      const perfData = await buildPerformanceData(liveEntries);
      enriched = applyFilerPerformance(liveEntries, perfData.filerMap);
      entryReturns = perfData.entryReturns;
      console.log(
        `Track record enrichment: ${perfData.filerMap.size} filer(s) updated with real post-filing returns, ` +
          `${perfData.entryReturns.size} entries with per-filing price data`,
      );
    } catch (err) {
      console.error(
        "Performance enrichment failed — keeping synthetic defaults:",
        err,
      );
    }

    const allComputed = [
      ...enriched.map((e) => {
        const cs = computeFullSignal(e);
        const er = entryReturns.get(e.id);
        return er ? { ...cs, ...er } : cs;
      }),
      ...ogeEntries, // already computed
    ];

    console.log(
      `Live signals: ${edgarEntries.length} EDGAR + ${congressEntries.length} Senate + ` +
        `${form13fEntries.length} 13F + ${houseEntries.length} House + ` +
        `${ogeEntries.length} OGE = ${allComputed.length} total`,
    );

    // If live sources produced meaningful data, serve it alongside static OGE
    const liveCount = edgarEntries.length + congressEntries.length + form13fEntries.length;
    if (liveCount >= 5) {
      return {
        signals: allComputed,
        lastUpdated,
        isLive: true,
      };
    }

    console.warn(
      `Live sources returned only ${liveCount} entries — using sample data.`,
    );
    return {
      signals: [...mockSignals, ...ogeEntries],
      lastUpdated,
      isLive: false,
    };
  },
  ["signal-alpha-live-signals-v7"],
  { revalidate: 14_400 },
);

export async function getSignals(): Promise<SignalDataResult> {
  return fetchLiveSignals();
}
