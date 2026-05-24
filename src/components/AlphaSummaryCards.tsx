import Link from "next/link";
import type { DailyAlphaSummary } from "@/lib/getDailyAlphaPicks";

interface AlphaSummaryCardsProps {
  summary: DailyAlphaSummary;
}

export default function AlphaSummaryCards({ summary }: AlphaSummaryCardsProps) {
  const cards: Array<{
    label: string;
    value: string;
    sub?: string;
    href?: string;
  }> = [
    {
      label: "Today's #1 Pick",
      value: summary.topPick?.ticker ?? "—",
      sub: summary.topPick?.company ?? "",
      href: summary.topPick
        ? `/daily-alpha-picks/${encodeURIComponent(summary.topPick.ticker)}`
        : undefined,
    },
    {
      label: "Average Daily Alpha Score",
      value: `${summary.averageScore}`,
      sub: "across all candidates",
    },
    {
      label: "High-Conviction Candidates",
      value: `${summary.highConvictionCount}`,
      sub: "score 80 or higher",
    },
    {
      label: "Average Alpha vs S&P 500",
      value: `${summary.averageAlphaVsSp500 > 0 ? "+" : ""}${summary.averageAlphaVsSp500.toFixed(1)}%`,
      sub: "since pick (hypothetical)",
    },
    {
      label: "Trusted News Articles",
      value: `${summary.trustedArticleCount}`,
      sub: "trust score 60+",
    },
    {
      label: "Stocks Screened",
      value: `${summary.stocksScreened}`,
      sub: "candidates ranked",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((c) => {
        const inner = (
          <>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest">
              {c.label}
            </div>
            <div className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {c.value}
            </div>
            {c.sub && (
              <div className="mt-1 text-xs text-slate-500 truncate">{c.sub}</div>
            )}
          </>
        );
        const wrap =
          "bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm";
        return c.href ? (
          <Link
            key={c.label}
            href={c.href}
            className={`${wrap} hover:border-blue-300 hover:shadow-md transition-all`}
          >
            {inner}
          </Link>
        ) : (
          <div key={c.label} className={wrap}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
