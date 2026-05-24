import type { Metadata } from "next";
import {
  getDailyAlphaPicks,
  getDailyAlphaSummary,
} from "@/lib/getDailyAlphaPicks";
import AlphaSummaryCards from "@/components/AlphaSummaryCards";
import DisclaimerBox from "@/components/DisclaimerBox";
import DailyAlphaPicksClient from "./DailyAlphaPicksClient";
import type { NewsSource } from "@/types/dailyAlpha";

// ISR: re-run server component every 6 hours so GDELT articles stay fresh
// without requiring a manual redeploy. Matches the unstable_cache TTL in
// getDailyAlphaPicks.ts so each revalidation triggers a real GDELT fetch.
export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Daily Alpha Picks — Signal Alpha Stock",
  description:
    "Top stock research candidates ranked daily using public disclosures, trusted news, market momentum, fundamentals, valuation, and risk controls.",
};

const NEWS_SOURCE_STYLES: Record<
  NewsSource,
  { cls: string; icon: string }
> = {
  "Live GDELT": {
    cls: "bg-green-50 text-green-700 ring-1 ring-green-200",
    icon: "●",
  },
  "Mock fallback": {
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    icon: "◐",
  },
  "No articles found": {
    cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    icon: "○",
  },
};

export default async function DailyAlphaPicksPage() {
  const { top10, top20, all, generatedAt, newsSource } =
    await getDailyAlphaPicks();
  const summary = await getDailyAlphaSummary();

  const badge = NEWS_SOURCE_STYLES[newsSource];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Daily Alpha Picks
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
              Top stock research candidates ranked daily using public
              disclosures, trusted news, market momentum, fundamentals,
              valuation, and risk controls.
            </p>
          </div>
          {/* News source badge */}
          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.cls}`}
            >
              <span>{badge.icon}</span>
              News Source: {newsSource}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Generated{" "}
          {new Date(generatedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" · "}
          {newsSource === "Live GDELT"
            ? "Articles from live GDELT index — click through for full text."
            : newsSource === "Mock fallback"
              ? "Articles are curated mock data. Set USE_GDELT_NEWS=1 for live news."
              : "No supporting articles available."}
          {" · "}
          Educational research only — not financial advice.
        </p>
      </header>

      {/* Summary cards */}
      <section className="mb-8">
        <AlphaSummaryCards summary={summary} />
      </section>

      {/* Top 10 + Top 20 client-side filtering */}
      <DailyAlphaPicksClient top10={top10} top20={top20} all={all} />

      {/* Required disclaimer */}
      <div className="mt-10">
        <DisclaimerBox />
      </div>
    </div>
  );
}
