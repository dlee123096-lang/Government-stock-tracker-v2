import DashboardClient from "@/components/DashboardClient";
import { getSignals } from "@/data/liveSignals";

export default async function DashboardPage() {
  const { signals, lastUpdated, isLive } = await getSignals();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Signal Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ranked public-data disclosures
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
              isLive
                ? "bg-green-50 text-green-800 ring-green-200"
                : "bg-amber-50 text-amber-800 ring-amber-200"
            }`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isLive ? "bg-green-500" : "bg-amber-500"
              }`}
            />
            {isLive ? "Live — SEC EDGAR" : "Sample data"}
          </span>
          <span className="text-gray-400 text-xs">
            Updated{" "}
            {new Date(lastUpdated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            })}
          </span>
        </div>
      </div>
      <DashboardClient signals={signals} isLive={isLive} lastUpdated={lastUpdated} />
    </div>
  );
}
