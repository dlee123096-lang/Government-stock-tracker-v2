import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ScoreBadge from "@/components/ScoreBadge";
import StockChart from "@/components/StockChart";
import type { ChartMarker } from "@/components/StockChart";
import { computedSignals as mockComputedSignals } from "@/data/mockSignals";
import { getSignals } from "@/data/liveSignals";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ComputedSignal } from "@/types/signal";

// Pre-render every ticker we know about today. Live-only tickers added after
// the build will fall through to dynamic rendering.
export async function generateStaticParams() {
  const { signals } = await getSignals();
  const all = [...mockComputedSignals, ...signals];
  const unique = Array.from(new Set(all.map((s) => s.ticker)))
    .filter((t) => t && t !== "—")
    .map((symbol) => ({ symbol: encodeURIComponent(symbol) }));
  return unique;
}

interface PageProps {
  params: { symbol: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const ticker = decodeURIComponent(params.symbol).toUpperCase();
  return {
    title: `${ticker} — All public disclosures · Signal Alpha Stock`,
    description: `Every publicly disclosed corporate insider, congressional, fund manager, executive branch, and activist filing in our dataset for ${ticker}. Educational research only.`,
  };
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

interface TickerRollup {
  totalSignals: number;
  buys: number;
  sells: number;
  bySourceType: Record<string, number>;
  topFiler: { name: string; count: number } | null;
  avgSignalScore: number;
  highestScore: number;
  lowestScore: number;
  uniqueRiskFlags: string[];
  uniqueContextTags: string[];
  oldestFilingDate: string;
  newestFilingDate: string;
}

function buildRollup(signals: ComputedSignal[]): TickerRollup {
  const buys = signals.filter((s) => s.tradeType === "Buy").length;
  const sells = signals.length - buys;

  const bySourceType: Record<string, number> = {};
  const filerCounts = new Map<string, number>();
  const risks = new Set<string>();
  const contexts = new Set<string>();

  let totalScore = 0;
  let highestScore = -Infinity;
  let lowestScore = Infinity;
  let oldestFiling = signals[0]?.filingDate ?? "";
  let newestFiling = signals[0]?.filingDate ?? "";

  for (const s of signals) {
    bySourceType[s.signalType] = (bySourceType[s.signalType] ?? 0) + 1;
    filerCounts.set(s.personEntity, (filerCounts.get(s.personEntity) ?? 0) + 1);
    s.riskFlags.forEach((r) => risks.add(r));
    s.contextTags.forEach((c) => contexts.add(c));

    totalScore += s.signalScore;
    if (s.signalScore > highestScore) highestScore = s.signalScore;
    if (s.signalScore < lowestScore) lowestScore = s.signalScore;
    if (s.filingDate < oldestFiling) oldestFiling = s.filingDate;
    if (s.filingDate > newestFiling) newestFiling = s.filingDate;
  }

  let topFiler: { name: string; count: number } | null = null;
  for (const [name, count] of filerCounts) {
    if (!topFiler || count > topFiler.count) topFiler = { name, count };
  }

  return {
    totalSignals: signals.length,
    buys,
    sells,
    bySourceType,
    topFiler,
    avgSignalScore: signals.length > 0 ? Math.round(totalScore / signals.length) : 0,
    highestScore: highestScore === -Infinity ? 0 : highestScore,
    lowestScore: lowestScore === Infinity ? 0 : lowestScore,
    uniqueRiskFlags: Array.from(risks),
    uniqueContextTags: Array.from(contexts),
    oldestFilingDate: oldestFiling,
    newestFilingDate: newestFiling,
  };
}

function buildSummary(
  ticker: string,
  signals: ComputedSignal[],
  rollup: TickerRollup,
): string {
  if (signals.length === 0) return "";

  const sourceList = Object.entries(rollup.bySourceType)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  const direction =
    rollup.buys > rollup.sells
      ? "leaning bullish"
      : rollup.buys < rollup.sells
        ? "leaning bearish"
        : "mixed";

  const recencyWindow = `${formatDate(rollup.oldestFilingDate)} – ${formatDate(rollup.newestFilingDate)}`;

  return (
    `${ticker} has ${rollup.totalSignals} publicly disclosed filing` +
    (rollup.totalSignals === 1 ? "" : "s") +
    ` in our current dataset (${recencyWindow}): ${rollup.buys} buy` +
    (rollup.buys === 1 ? "" : "s") +
    ` and ${rollup.sells} sell` +
    (rollup.sells === 1 ? "" : "s") +
    `, ${direction}. Sources: ${sourceList}. ` +
    (rollup.topFiler && rollup.topFiler.count > 1
      ? `Most active filer in window: ${rollup.topFiler.name} (${rollup.topFiler.count} filings). `
      : "") +
    `Average signal score ${rollup.avgSignalScore}/100; highest single-disclosure score ${rollup.highestScore}.`
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TickerPage({ params }: PageProps) {
  const ticker = decodeURIComponent(params.symbol).toUpperCase();
  const { signals: liveSignals, isLive } = await getSignals();
  const all = [...mockComputedSignals, ...liveSignals];

  // Dedupe by id (mock + live may overlap on rare occasions)
  const seen = new Set<string>();
  const deduped: ComputedSignal[] = [];
  for (const s of all) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    deduped.push(s);
  }

  const tickerSignals = deduped
    .filter((s) => s.ticker.toUpperCase() === ticker)
    .sort(
      (a, b) =>
        new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime(),
    );

  if (tickerSignals.length === 0) notFound();

  const company = tickerSignals[0].company;
  const rollup = buildRollup(tickerSignals);
  const summary = buildSummary(ticker, tickerSignals, rollup);

  const markers: ChartMarker[] = tickerSignals
    .filter((s) => s.tradeDate)
    .map((s) => ({
      date: s.tradeDate,
      type: s.tradeType,
      label: `${s.personEntity} (${formatCurrency(s.tradeSize)})`,
    }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
      >
        ← Back to dashboard
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {ticker}
            </h1>
            <p className="mt-1 text-slate-600">{company}</p>
            <p className="mt-2 text-xs text-slate-400">
              All publicly disclosed filings for this ticker in the current
              dataset
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                Disclosures
              </div>
              <div className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">
                {rollup.totalSignals}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                Buys / Sells
              </div>
              <div className="mt-0.5 text-2xl font-bold tabular-nums">
                <span className="text-emerald-600">{rollup.buys}</span>
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-rose-600">{rollup.sells}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                Top Score
              </div>
              <div className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">
                {rollup.highestScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock chart with all markers */}
      <div className="mt-6">
        <StockChart ticker={ticker} markers={markers} />
      </div>

      {/* Plain-English rollup */}
      {summary && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-widest mb-2">
            At-a-glance
          </h2>
          <p className="text-sm text-blue-900 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Source breakdown */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Filings by source
          </h2>
          <ul className="space-y-2">
            {Object.entries(rollup.bySourceType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <li
                  key={type}
                  className="flex justify-between text-sm text-slate-700"
                >
                  <span>{type}</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {count}
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Context & risk in window
          </h2>
          {rollup.uniqueContextTags.length === 0 &&
          rollup.uniqueRiskFlags.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              No tags applied to any filing for this ticker.
            </p>
          ) : (
            <>
              {rollup.uniqueContextTags.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-1.5">
                    Context bonuses
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {rollup.uniqueContextTags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                      >
                        + {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {rollup.uniqueRiskFlags.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-widest mb-1.5">
                    Risk flags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {rollup.uniqueRiskFlags.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 text-xs rounded-full bg-rose-50 text-rose-800 ring-1 ring-rose-200"
                      >
                        − {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pre-purchase research checklist */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Before-you-buy research checklist
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Public disclosures are one input. Confirm the rest of these basics
          yourself before any purchase decision.
        </p>
        <ul className="space-y-2 text-sm text-slate-700">
          {[
            `I have read ${ticker}'s most recent 10-K and 10-Q`,
            "I know when the next earnings date is",
            "I understand the company's debt / cash position",
            "I have checked at least one independent source (analyst report, news, peer comparison)",
            "I am comfortable losing the full amount I plan to invest",
            "This position fits my time horizon and overall portfolio",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 inline-block w-3.5 h-3.5 border-2 border-slate-300 rounded-sm flex-shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400 italic">
          Checklist is intentionally static — Signal Alpha Stock does not
          track personal trading activity.
        </p>
      </div>

      {/* All disclosures table */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">
            All disclosures for {ticker}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-4 py-2.5">Filed</th>
                <th className="px-4 py-2.5">Filer</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5 text-right">Size</th>
                <th className="px-4 py-2.5 text-right">Score</th>
                <th className="px-4 py-2.5">Rating</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tickerSignals.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(s.filingDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-800">
                      {s.personEntity}
                    </div>
                    <div className="text-xs text-slate-400">{s.role}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {s.signalType}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
                        s.tradeType === "Buy"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                          : "bg-rose-50 text-rose-700 ring-rose-100"
                      }`}
                    >
                      {s.tradeType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm text-slate-700">
                    {s.tradeSize > 0 ? formatCurrency(s.tradeSize) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                    {s.totalOpportunityScore}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge label={s.label} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/signal/${s.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 leading-relaxed">
        <span className="font-semibold">Educational research tool.</span>{" "}
        Public-disclosure aggregation for {ticker} from SEC EDGAR, Senate eFD,
        and OGE. Not financial advice. Not a buy, sell, or hold recommendation.
        {!isLive && (
          <>
            {" "}
            Some entries shown are sample data because live fetch returned too
            few records this build.
          </>
        )}
      </div>
    </div>
  );
}

