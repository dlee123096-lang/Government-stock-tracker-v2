import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ScoreBadge from "@/components/ScoreBadge";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import StockChart from "@/components/StockChart";
import { computedSignals as mockComputedSignals } from "@/data/mockSignals";
import { getSignals } from "@/data/liveSignals";
import { OFFICIALS } from "@/data/committees";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ComputedSignal } from "@/types/signal";

// Pre-generate detail pages for the static mock signals at build time.
// Live signal pages (EDGAR / Congress) render dynamically on demand.
export function generateStaticParams() {
  return mockComputedSignals.map((s) => ({ id: s.id }));
}

interface PageProps {
  params: { id: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const signal = mockComputedSignals.find((s) => s.id === params.id);
  if (!signal) return { title: "Signal Detail" };
  return {
    title: `${signal.ticker} — ${signal.label}`,
    description: `${signal.tradeType} of ${signal.ticker} (${signal.company}) by ${signal.personEntity}. Total Opportunity Score: ${signal.totalOpportunityScore}/100. ${signal.signalSubtype}. Filed ${signal.filingDate}.`,
  };
}

export default async function SignalDetailPage({ params }: PageProps) {
  // Fast path: check mock signals first
  const mockSignal = mockComputedSignals.find((s) => s.id === params.id);

  let signal: ComputedSignal | undefined = mockSignal;

  if (!signal) {
    // Live signal: fetch all current data and find by id
    const { signals } = await getSignals();
    signal = signals.find((s) => s.id === params.id);
  }

  if (!signal) notFound();

  // Render the committee panel for any official we have profile data for,
  // regardless of which chamber the signal came from.
  const officialInfo = OFFICIALS[signal.personEntity];

  const officialSlug = signal.personEntity
    .toLowerCase()
    .replace(/\s+/g, "-");

  const defaultExplanation =
    `This ${signal.signalType.toLowerCase()} signal was rated "${signal.label}" based on a ` +
    `${signal.tradeType.toLowerCase()} of ${formatCurrency(signal.tradeSize)} by ${signal.personEntity} ` +
    `(${signal.role}). The signal subtype "${signal.signalSubtype}" contributed the base strength, ` +
    `with filing delay of ${signal.daysDelayed} day(s) and ${signal.contextTags.length} contextual factor(s) considered. ` +
    `${signal.riskFlags.length > 0 ? `Risk penalties were applied for: ${signal.riskFlags.join(", ")}. ` : "No risk penalties were applied. "}` +
    `The historical track record shows ${signal.historicalAlpha.toFixed(1)}% alpha over ${signal.historicalTradeCount} prior trades ` +
    `with a ${signal.historicalWinRate}% win rate.`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
      >
        ← Back to dashboard
      </Link>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">
                {signal.ticker}
              </h1>
              <ScoreBadge label={signal.label} size="md" />
            </div>
            <p className="mt-1 text-gray-600">{signal.company}</p>
            <p className="mt-3 text-sm text-gray-500">
              <span className="font-medium text-gray-700">
                {signal.signalType}
              </span>{" "}
              · {signal.signalSubtype}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Total Opportunity Score
            </div>
            <div className="text-5xl font-bold text-gray-900 tabular-nums">
              {signal.totalOpportunityScore}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
          <DetailField
            label="Person / Entity"
            value={signal.personEntity}
            href={officialInfo ? `/official/${officialSlug}` : undefined}
          />
          <DetailField label="Role" value={signal.role} />
          <DetailField
            label="Trade"
            value={`${signal.tradeType} · ${formatCurrency(signal.tradeSize)}`}
          />
          <DetailField
            label="Filing Delay"
            value={`${signal.daysDelayed} day${signal.daysDelayed === 1 ? "" : "s"}`}
          />
          <DetailField label="Trade Date" value={formatDate(signal.tradeDate)} />
          <DetailField
            label="Filing Date"
            value={formatDate(signal.filingDate)}
          />
          <DetailField
            label="Historical Alpha"
            value={`${signal.historicalAlpha > 0 ? "+" : ""}${signal.historicalAlpha.toFixed(1)}%`}
          />
          <DetailField
            label="Historical Win Rate"
            value={`${signal.historicalWinRate}%`}
          />
        </div>
      </div>

      {/* Stock price chart */}
      <div className="mt-6">
        <StockChart
          ticker={signal.ticker}
          tradeDate={signal.tradeDate}
          tradeType={signal.tradeType === "Buy" ? "Buy" : "Sell"}
        />
      </div>

      {/* Committee info for government officials */}
      {officialInfo && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-semibold text-blue-900 mb-2">
            Committee Assignments
          </h3>
          <div className="flex flex-wrap gap-2">
            {officialInfo.committees.map((committee) => (
              <span
                key={committee}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ring-1 ring-blue-200"
              >
                {committee}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-blue-700">
            <Link
              href={`/official/${officialSlug}`}
              className="underline hover:text-blue-900"
            >
              View official profile →
            </Link>
          </p>
        </div>
      )}

      {/* Context tags & risk flags */}
      {(signal.contextTags.length > 0 || signal.riskFlags.length > 0) && (
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {signal.contextTags.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">
                Context Bonuses
              </h3>
              <ul className="space-y-1.5">
                {signal.contextTags.map((tag) => (
                  <li
                    key={tag}
                    className="text-sm text-green-800 bg-green-50 rounded px-3 py-1.5"
                  >
                    + {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {signal.riskFlags.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Risk Flags</h3>
              <ul className="space-y-1.5">
                {signal.riskFlags.map((flag) => (
                  <li
                    key={flag}
                    className="text-sm text-red-800 bg-red-50 rounded px-3 py-1.5"
                  >
                    − {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Score breakdown */}
      <div className="mt-6">
        <ScoreBreakdown entry={signal} />
      </div>

      {/* Plain-English explanation */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Score Explanation
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {signal.explanation ?? defaultExplanation}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 leading-relaxed">
        <span className="font-semibold">Disclaimer:</span> This is an
        educational tool. Data sourced from public disclosures (SEC EDGAR Form
        4, STOCK Act). Not financial advice. Always do your own research before
        making investment decisions.
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      {href ? (
        <Link
          href={href}
          className="mt-1 font-medium text-blue-600 hover:text-blue-800 text-sm underline block"
        >
          {value}
        </Link>
      ) : (
        <div className="mt-1 font-medium text-gray-900 text-sm">{value}</div>
      )}
    </div>
  );
}
