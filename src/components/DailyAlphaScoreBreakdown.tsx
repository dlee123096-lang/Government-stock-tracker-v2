import type { DailyAlphaPick } from "@/types/dailyAlpha";
import {
  getDailyAlphaScoreBreakdown,
  getDailyAlphaWeights,
} from "@/lib/dailyAlphaScoring";

interface DailyAlphaScoreBreakdownProps {
  pick: DailyAlphaPick;
}

interface RowProps {
  label: string;
  weight: number;
  raw: number;
  contribution: number;
  hint: string;
  negative?: boolean;
}

function Row({ label, weight, raw, contribution, hint, negative }: RowProps) {
  const max = negative ? 20 : 100;
  const pct = Math.max(0, Math.min(100, (Math.abs(contribution) / 20) * 100));
  return (
    <div className="py-2.5">
      <div className="flex justify-between items-baseline gap-3 flex-wrap">
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-800">{label}</span>
          {!negative && (
            <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
              ({Math.round(weight * 100)}% weight)
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 tabular-nums font-mono">
          raw {raw}
          {!negative && (
            <>
              <span className="text-slate-300 mx-1">→</span>
              <span className="text-slate-900 font-semibold">
                +{contribution.toFixed(1)}
              </span>
            </>
          )}
          {negative && (
            <span className="text-rose-700 font-semibold ml-1">
              −{contribution.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${negative ? "bg-rose-400" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{hint}</p>
    </div>
  );
}

export default function DailyAlphaScoreBreakdown({
  pick,
}: DailyAlphaScoreBreakdownProps) {
  const b = getDailyAlphaScoreBreakdown(pick);
  const w = getDailyAlphaWeights();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4 pb-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Daily Alpha Score Breakdown</h2>
        <div className="text-3xl font-bold text-slate-900 tabular-nums">
          {pick.dailyAlphaScore}
          <span className="text-base font-normal text-slate-400"> / 100</span>
        </div>
      </div>

      <Row
        label="News Catalyst"
        weight={w.newsCatalyst}
        raw={pick.newsCatalystScore}
        contribution={b.newsCatalyst}
        hint="Strength and trustworthiness of the news catalysts driving today's story."
      />
      <Row
        label="Disclosure Signal"
        weight={w.disclosureSignal}
        raw={pick.disclosureSignalScore}
        contribution={b.disclosureSignal}
        hint="Overlap with Government, EDGAR insider, institutional, and activist disclosures."
      />
      <Row
        label="Momentum"
        weight={w.momentum}
        raw={pick.momentumScore}
        contribution={b.momentum}
        hint="Recent price-trend behavior and short-term momentum signature."
      />
      <Row
        label="Fundamental Quality"
        weight={w.fundamentalQuality}
        raw={pick.fundamentalQualityScore}
        contribution={b.fundamentalQuality}
        hint="Balance-sheet strength, margins, and business durability."
      />
      <Row
        label="Valuation"
        weight={w.valuation}
        raw={pick.valuationScore}
        contribution={b.valuation}
        hint="How the stock prices versus its history and peer set."
      />
      <Row
        label="Earnings Revision"
        weight={w.earningsRevision}
        raw={pick.earningsRevisionScore}
        contribution={b.earningsRevision}
        hint="Direction of recent analyst earnings estimate revisions."
      />
      <Row
        label="Freshness"
        weight={w.freshness}
        raw={pick.freshnessScore}
        contribution={b.freshness}
        hint="How recently the supporting catalysts and disclosures arrived."
      />
      <Row
        label="Track Record"
        weight={w.trackRecord}
        raw={pick.trackRecordScore}
        contribution={b.trackRecord}
        hint="Historical performance of similar past picks in the ranking framework."
      />
      <Row
        label="Risk Penalty"
        weight={0}
        raw={pick.riskPenalty}
        contribution={b.riskPenalty}
        hint="Subtracted from the weighted sum based on disclosed risk flags."
        negative
      />

      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 italic">
        Total = clamp(0, 100, sum of weighted contributions − risk penalty),
        rounded to the nearest whole number.
      </div>
    </div>
  );
}
