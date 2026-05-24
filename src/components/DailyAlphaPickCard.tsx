import Link from "next/link";
import type { DailyAlphaPick } from "@/types/dailyAlpha";
import { DAILY_ALPHA_LABEL_STYLES } from "@/lib/dailyAlphaScoring";

interface DailyAlphaPickCardProps {
  pick: DailyAlphaPick;
  rank: number;
}

export default function DailyAlphaPickCard({
  pick,
  rank,
}: DailyAlphaPickCardProps) {
  const top3Articles = pick.supportingArticles.slice(0, 3);
  const alphaIsPositive = pick.alphaVsSp500 >= 0;

  return (
    <article className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-300 tabular-nums leading-none mt-0.5">
              #{rank}
            </div>
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <Link
                  href={`/daily-alpha-picks/${encodeURIComponent(pick.ticker)}`}
                  className="text-xl sm:text-2xl font-bold text-slate-900 hover:text-blue-700 transition-colors"
                >
                  {pick.ticker}
                </Link>
                <span className="text-sm text-slate-500">{pick.company}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500">{pick.sector}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">{pick.marketCapCategory}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums leading-none">
              {pick.dailyAlphaScore}
            </div>
            <div className="mt-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${DAILY_ALPHA_LABEL_STYLES[pick.scoreLabel]}`}
              >
                {pick.scoreLabel}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="px-5 py-4 space-y-4 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Main Catalyst
          </div>
          <p className="mt-1 text-slate-700 leading-relaxed">
            {pick.mainCatalyst}
          </p>
        </div>

        {/* Disclosure overlap chips */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Disclosure Overlap
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {pick.hasGovernmentDisclosureOverlap && (
              <Overlap label="Government" />
            )}
            {pick.hasEdgarInsiderOverlap && <Overlap label="EDGAR Insider" />}
            {pick.hasInstitutionalOverlap && <Overlap label="Institutional" />}
            {pick.hasActivistOverlap && <Overlap label="Activist" />}
            {!pick.hasGovernmentDisclosureOverlap &&
              !pick.hasEdgarInsiderOverlap &&
              !pick.hasInstitutionalOverlap &&
              !pick.hasActivistOverlap && (
                <span className="text-xs text-slate-400 italic">
                  No disclosure overlap in dataset
                </span>
              )}
          </div>
        </div>

        {/* Top 3 supporting articles */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Top Supporting Headlines
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {top3Articles.map((a) => (
              <li key={a.url} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    a.sentiment === "Bullish"
                      ? "bg-emerald-500"
                      : a.sentiment === "Bearish"
                        ? "bg-rose-500"
                        : "bg-slate-400"
                  }`}
                  aria-hidden
                />
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-700 hover:text-blue-700 hover:underline leading-snug"
                >
                  {a.title}{" "}
                  <span className="text-slate-400">— {a.source}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Bull / Bear */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">
              Bull Case
            </div>
            <p className="mt-1 text-xs text-emerald-900 leading-relaxed">
              {pick.bullCase}
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-rose-700 font-semibold">
              Bear Case
            </div>
            <p className="mt-1 text-xs text-rose-900 leading-relaxed">
              {pick.bearCase}
            </p>
          </div>
        </div>

        {/* Risk + performance row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <Stat
            label="Main Risk"
            value={pick.riskFlags[0] ?? "—"}
            small
          />
          <Stat
            label="Return Since Pick"
            value={`${pick.returnSincePick > 0 ? "+" : ""}${pick.returnSincePick.toFixed(1)}%`}
          />
          <Stat
            label="S&P Since Pick"
            value={`${pick.sp500ReturnSincePick > 0 ? "+" : ""}${pick.sp500ReturnSincePick.toFixed(1)}%`}
          />
          <Stat
            label="Alpha vs S&P"
            value={`${alphaIsPositive ? "+" : ""}${pick.alphaVsSp500.toFixed(1)}%`}
            highlight={alphaIsPositive ? "good" : "bad"}
          />
        </div>

        <Link
          href={`/daily-alpha-picks/${encodeURIComponent(pick.ticker)}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          View full analysis →
        </Link>
      </div>
    </article>
  );
}

function Overlap({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  small,
  highlight,
}: {
  label: string;
  value: string;
  small?: boolean;
  highlight?: "good" | "bad";
}) {
  const valueClass =
    highlight === "good"
      ? "text-emerald-700"
      : highlight === "bad"
        ? "text-rose-700"
        : "text-slate-900";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
        {label}
      </div>
      <div
        className={`mt-0.5 font-semibold tabular-nums ${valueClass} ${
          small ? "text-xs leading-tight" : "text-sm"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
