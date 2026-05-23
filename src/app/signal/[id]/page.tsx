import Link from "next/link";
import { notFound } from "next/navigation";
import ScoreBadge from "@/components/ScoreBadge";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import { computedSignals } from "@/data/mockSignals";
import { formatCurrency, formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return computedSignals.map((s) => ({ id: s.id }));
}

interface PageProps {
  params: { id: string };
}

export default function SignalDetailPage({ params }: PageProps) {
  const signal = computedSignals.find((s) => s.id === params.id);
  if (!signal) notFound();

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
          <DetailField label="Person / Entity" value={signal.personEntity} />
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
        <span className="font-semibold">Disclaimer:</span> This is sample/mock
        data for demonstration purposes only. Not financial advice. Always do
        your own research before making investment decisions.
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 font-medium text-gray-900 text-sm">{value}</div>
    </div>
  );
}
