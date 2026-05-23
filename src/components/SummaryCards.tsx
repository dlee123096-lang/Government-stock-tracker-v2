import type { ComputedSignal } from "@/types/signal";
import { topSignalType } from "@/lib/utils";

interface SummaryCardsProps {
  signals: ComputedSignal[];
}

interface Card {
  label: string;
  value: string;
}

export default function SummaryCards({ signals }: SummaryCardsProps) {
  const total = signals.length;
  const avgSignal =
    total === 0
      ? 0
      : signals.reduce((s, x) => s + x.signalScore, 0) / total;
  const avgTrack =
    total === 0
      ? 0
      : signals.reduce((s, x) => s + x.trackRecordScore, 0) / total;
  const strongCount = signals.filter(
    (s) =>
      s.label === "Exceptional Signal" || s.label === "Very Strong Signal",
  ).length;
  const top = topSignalType(signals);

  const cards: Card[] = [
    { label: "Total Signals Tracked", value: total.toString() },
    { label: "Avg Signal Score", value: avgSignal.toFixed(1) },
    { label: "Avg Track Record Score", value: avgTrack.toFixed(1) },
    { label: "Very Strong / Exceptional", value: strongCount.toString() },
    { label: "Top Signal Type", value: top },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {c.label}
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 truncate">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
