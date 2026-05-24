import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDailyAlphaPickByTicker,
  getDailyAlphaPicks,
} from "@/lib/getDailyAlphaPicks";
import { DAILY_ALPHA_LABEL_STYLES } from "@/lib/dailyAlphaScoring";
import DailyAlphaScoreBreakdown from "@/components/DailyAlphaScoreBreakdown";
import NewsArticleList from "@/components/NewsArticleList";
import DisclaimerBox from "@/components/DisclaimerBox";

interface PageProps {
  params: { ticker: string };
}

export function generateStaticParams() {
  return getDailyAlphaPicks().all.map((p) => ({
    ticker: encodeURIComponent(p.ticker),
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const ticker = decodeURIComponent(params.ticker);
  const pick = getDailyAlphaPickByTicker(ticker);
  if (!pick) return { title: "Daily Alpha Pick" };
  return {
    title: `${pick.ticker} — Daily Alpha Pick · ${pick.scoreLabel}`,
    description: `${pick.company}: ${pick.mainCatalyst}. Daily Alpha Score ${pick.dailyAlphaScore}/100. Educational research only.`,
  };
}

export default function DailyAlphaPickDetailPage({ params }: PageProps) {
  const ticker = decodeURIComponent(params.ticker);
  const pick = getDailyAlphaPickByTicker(ticker);
  if (!pick) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/daily-alpha-picks"
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
      >
        ← Back to Daily Alpha Picks
      </Link>

      {/* Hero */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {pick.ticker}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${DAILY_ALPHA_LABEL_STYLES[pick.scoreLabel]}`}
              >
                {pick.scoreLabel}
              </span>
            </div>
            <p className="mt-1 text-slate-700">{pick.company}</p>
            <p className="mt-2 text-xs text-slate-500">
              {pick.sector} · {pick.marketCapCategory} · Risk:{" "}
              <span className="font-medium text-slate-700">{pick.riskLevel}</span>{" "}
              · Picked on{" "}
              {new Date(pick.pickedOn).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <div className="mt-3 inline-flex gap-2 flex-wrap">
              <Link
                href={`/ticker/${encodeURIComponent(pick.ticker)}`}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                See all {pick.ticker} disclosures →
              </Link>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Daily Alpha Score
            </div>
            <div className="text-5xl font-bold text-slate-900 tabular-nums leading-none mt-1">
              {pick.dailyAlphaScore}
            </div>
            <div className="text-xs text-slate-400 mt-1">/ 100</div>
          </div>
        </div>
      </div>

      {/* Main catalyst */}
      <section className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-widest">
          Main catalyst
        </h2>
        <p className="mt-1 text-sm text-blue-900 leading-relaxed">
          {pick.mainCatalyst}
        </p>
      </section>

      {/* Score breakdown */}
      <section className="mt-6">
        <DailyAlphaScoreBreakdown pick={pick} />
      </section>

      {/* Bull / Bear */}
      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-emerald-800 uppercase tracking-widest">
            Bull case
          </h2>
          <p className="mt-2 text-sm text-emerald-900 leading-relaxed">
            {pick.bullCase}
          </p>
          {pick.strongerIf.length > 0 && (
            <>
              <p className="mt-4 text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">
                What would make this pick stronger
              </p>
              <ul className="mt-1.5 space-y-1">
                {pick.strongerIf.map((s) => (
                  <li
                    key={s}
                    className="text-xs text-emerald-900 leading-relaxed flex items-start gap-2"
                  >
                    <span aria-hidden>↑</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-rose-800 uppercase tracking-widest">
            Bear case
          </h2>
          <p className="mt-2 text-sm text-rose-900 leading-relaxed">
            {pick.bearCase}
          </p>
          {pick.weakerIf.length > 0 && (
            <>
              <p className="mt-4 text-[10px] uppercase tracking-widest text-rose-700 font-semibold">
                What would make this pick weaker
              </p>
              <ul className="mt-1.5 space-y-1">
                {pick.weakerIf.map((s) => (
                  <li
                    key={s}
                    className="text-xs text-rose-900 leading-relaxed flex items-start gap-2"
                  >
                    <span aria-hidden>↓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* Risk flags & disclosure overlap */}
      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Risk flags
          </h2>
          {pick.riskFlags.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              No specific risk flags recorded for this pick.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {pick.riskFlags.map((r) => (
                <li
                  key={r}
                  className="text-sm text-rose-800 bg-rose-50 rounded px-3 py-1.5"
                >
                  − {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Disclosure overlap
          </h2>
          <ul className="space-y-2 text-sm">
            <OverlapRow
              label="Government (Congress / OGE)"
              on={pick.hasGovernmentDisclosureOverlap}
            />
            <OverlapRow
              label="EDGAR insider (Form 4)"
              on={pick.hasEdgarInsiderOverlap}
            />
            <OverlapRow
              label="Institutional (13F)"
              on={pick.hasInstitutionalOverlap}
            />
            <OverlapRow
              label="Activist (13D / 13G)"
              on={pick.hasActivistOverlap}
            />
          </ul>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Cross-references the existing Signal Alpha disclosure pipeline. Use
            the <span className="font-medium">See all disclosures</span> link in
            the hero to view the underlying filings.
          </p>
        </div>
      </section>

      {/* Performance */}
      <section className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Performance vs S&amp;P 500 (since pick)
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat
            label="Pick return"
            value={`${pick.returnSincePick > 0 ? "+" : ""}${pick.returnSincePick.toFixed(1)}%`}
            highlight={pick.returnSincePick >= 0 ? "good" : "bad"}
          />
          <Stat
            label="S&P 500"
            value={`${pick.sp500ReturnSincePick > 0 ? "+" : ""}${pick.sp500ReturnSincePick.toFixed(1)}%`}
          />
          <Stat
            label="Alpha"
            value={`${pick.alphaVsSp500 > 0 ? "+" : ""}${pick.alphaVsSp500.toFixed(1)}%`}
            highlight={pick.alphaVsSp500 >= 0 ? "good" : "bad"}
          />
        </div>
        <p className="mt-3 text-xs text-slate-400 italic">
          Hypothetical / mock performance. Real returns will be computed from
          public price data in a future iteration.
        </p>
      </section>

      {/* Supporting articles */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Supporting news articles
        </h2>
        <NewsArticleList articles={pick.supportingArticles} />
        <p className="mt-3 text-xs text-slate-400 italic">
          Headlines, source, date, and link only. Summaries are short original
          descriptions written for this dataset. Click through to read the full
          article on the publisher&apos;s site.
        </p>
      </section>

      {/* Disclaimer */}
      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

function OverlapRow({ label, on }: { label: string; on: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-700">{label}</span>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${
          on
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-slate-50 text-slate-500 ring-slate-200"
        }`}
      >
        {on ? "Yes" : "No"}
      </span>
    </li>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "good" | "bad";
}) {
  const cls =
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
      <div className={`mt-1 text-2xl font-bold tabular-nums ${cls}`}>
        {value}
      </div>
    </div>
  );
}
