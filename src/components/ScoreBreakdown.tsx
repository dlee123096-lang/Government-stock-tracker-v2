import type { SignalEntry } from "@/types/signal";
import {
  getSignalScoreBreakdown,
  getTrackRecordBreakdown,
  computeTotalOpportunityScore,
} from "@/lib/scoring";

interface ScoreBreakdownProps {
  entry: SignalEntry;
}

interface RowProps {
  label: string;
  value: number;
  max: number;
  negative?: boolean;
}

function ScoreRow({ label, value, max, negative }: RowProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-mono font-medium text-gray-900">
          {negative ? "−" : ""}
          {value} / {max}
        </span>
      </div>
      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            negative ? "bg-red-500" : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreBreakdown({ entry }: ScoreBreakdownProps) {
  const sig = getSignalScoreBreakdown(entry);
  const track = getTrackRecordBreakdown(entry);
  const total = computeTotalOpportunityScore(sig.total, track.total);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">
          Signal Score Breakdown
        </h3>
        <ScoreRow label="Signal Strength" value={sig.strength} max={40} />
        <ScoreRow label="Trade Conviction" value={sig.conviction} max={20} />
        <ScoreRow label="Filing Freshness" value={sig.freshness} max={15} />
        <ScoreRow label="Context Bonus" value={sig.bonus} max={15} />
        <ScoreRow
          label="Risk Penalty"
          value={sig.penalty}
          max={20}
          negative
        />
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
          <span className="font-semibold text-gray-900">Total Signal Score</span>
          <span className="font-bold text-xl text-gray-900 tabular-nums">
            {sig.total} / 100
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">
          Track Record Breakdown
        </h3>
        <ScoreRow label="Historical Alpha" value={track.alpha} max={40} />
        <ScoreRow label="Win Rate" value={track.winRate} max={25} />
        <ScoreRow
          label="Sample Size Confidence"
          value={track.sample}
          max={20}
        />
        <ScoreRow label="Recency Bonus" value={track.recency} max={15} />
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
          <span className="font-semibold text-gray-900">
            Total Track Record Score
          </span>
          <span className="font-bold text-xl text-gray-900 tabular-nums">
            {track.total} / 100
          </span>
        </div>
      </div>

      <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              Total Opportunity Score
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              0.65 × Signal ({sig.total}) + 0.35 × Track Record (
              {track.total}) = {total}
            </p>
          </div>
          <div className="text-4xl font-bold text-gray-900 tabular-nums">
            {total}
            <span className="text-lg font-normal text-gray-500"> / 100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
