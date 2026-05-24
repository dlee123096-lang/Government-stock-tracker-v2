import type { Metadata } from "next";
import Link from "next/link";
import DisclaimerBox from "@/components/DisclaimerBox";

export const metadata: Metadata = {
  title: "Model Portfolio — Coming Soon · Signal Alpha Stock",
  description:
    "Educational paper-portfolio that will track Daily Alpha Picks performance versus the S&P 500 over time.",
};

export default function ModelPortfolioPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
        Model Portfolio
      </h1>
      <p className="mt-3 text-slate-600 leading-relaxed">
        A future iteration of Signal Alpha Stock will publish an educational
        paper-portfolio that tracks how the Daily Alpha Picks would have
        performed versus the S&amp;P 500 if held for a set period.
      </p>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-blue-900">Planned features</h2>
        <ul className="mt-2 space-y-1 text-sm text-blue-900 leading-relaxed">
          <li>• Open / hold / close history for every published pick</li>
          <li>
            • Rolling performance vs S&amp;P 500 and a relevant sector
            benchmark
          </li>
          <li>• Win rate, average alpha, drawdown, and turnover stats</li>
          <li>
            • Transparent rules: how picks enter, how they exit, position
            sizing
          </li>
        </ul>
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Out of scope (intentionally)
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700 leading-relaxed">
          <li>
            • No live brokerage integration — Signal Alpha never executes
            trades
          </li>
          <li>• No personalized portfolio tracking — no accounts, no login</li>
          <li>• No subscription / paywall — the educational dataset stays free</li>
        </ul>
      </div>

      <p className="mt-6 text-sm text-slate-600">
        In the meantime, explore the{" "}
        <Link
          href="/daily-alpha-picks"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Daily Alpha Picks
        </Link>{" "}
        page for the current ranked research candidates.
      </p>

      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}
