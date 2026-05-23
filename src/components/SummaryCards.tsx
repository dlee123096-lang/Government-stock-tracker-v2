import type { ComputedSignal } from "@/types/signal";

interface SummaryCardsProps {
  signals: ComputedSignal[];
  isLive: boolean;
  lastUpdated: string;
}

export default function SummaryCards({
  signals,
  isLive,
  lastUpdated,
}: SummaryCardsProps) {
  const total = signals.length;

  const latestFiling =
    total === 0
      ? "—"
      : new Date(
          Math.max(...signals.map((s) => new Date(s.filingDate).getTime())),
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  const topScore =
    total === 0
      ? "—"
      : Math.max(...signals.map((s) => s.totalOpportunityScore)).toString();

  const updatedAt = new Date(lastUpdated).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Disclosures */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          Disclosures
        </div>
        <div className="mt-2 text-3xl font-bold text-slate-800 tabular-nums">
          {total}
        </div>
        <div className="mt-1 text-xs text-slate-400">matching current filters</div>
      </div>

      {/* Latest Filing */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          Latest Filing
        </div>
        <div className="mt-2 text-xl font-bold text-slate-800 leading-tight">
          {latestFiling}
        </div>
        <div className="mt-1 text-xs text-slate-400">most recent in view</div>
      </div>

      {/* Top Score */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          Top Score
        </div>
        <div className="mt-2 text-3xl font-bold text-slate-800 tabular-nums">
          {topScore}
        </div>
        <div className="mt-1 text-xs text-slate-400">highest opportunity score</div>
      </div>

      {/* Data Status */}
      <div
        className={`border rounded-xl p-4 shadow-sm ${
          isLive
            ? "bg-white border-slate-200"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          Data Source
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
              isLive ? "bg-emerald-500" : "bg-amber-400"
            }`}
          />
          <span className="text-sm font-semibold text-slate-800">
            {isLive ? "Live · SEC EDGAR" : "Sample data"}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-400">refreshed {updatedAt}</div>
      </div>
    </div>
  );
}
