import type { Metadata } from "next";
import {
  getDailyAlphaPicks,
  getDailyAlphaSummary,
} from "@/lib/getDailyAlphaPicks";
import AlphaSummaryCards from "@/components/AlphaSummaryCards";
import DisclaimerBox from "@/components/DisclaimerBox";
import DailyAlphaPicksClient from "./DailyAlphaPicksClient";

export const metadata: Metadata = {
  title: "Daily Alpha Picks — Signal Alpha Stock",
  description:
    "Top stock research candidates ranked daily using public disclosures, trusted news, market momentum, fundamentals, valuation, and risk controls.",
};

export default function DailyAlphaPicksPage() {
  const { top10, top20, all, generatedAt } = getDailyAlphaPicks();
  const summary = getDailyAlphaSummary();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Daily Alpha Picks
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          Top stock research candidates ranked daily using public disclosures,
          trusted news, market momentum, fundamentals, valuation, and risk
          controls.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Generated{" "}
          {new Date(generatedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
