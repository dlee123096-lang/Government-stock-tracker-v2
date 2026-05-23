import DashboardClient from "@/components/DashboardClient";
import { computedSignals } from "@/data/mockSignals";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Signal Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Ranked public-data disclosures · Showing sample data
        </p>
      </div>
      <DashboardClient signals={computedSignals} />
    </div>
  );
}
