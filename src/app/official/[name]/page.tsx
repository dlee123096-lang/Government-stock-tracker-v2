import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OFFICIALS, COMMITTEE_SECTOR_MAP } from "@/data/committees";

// Generate static pages for all known officials at build time
export function generateStaticParams() {
  return Object.keys(OFFICIALS).map((name) => ({
    name: name.toLowerCase().replace(/\s+/g, "-"),
  }));
}

interface PageProps {
  params: { name: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const entry = Object.entries(OFFICIALS).find(
    ([name]) => name.toLowerCase().replace(/\s+/g, "-") === params.name,
  );
  if (!entry) return { title: "Official Not Found" };
  const [fullName, info] = entry;
  return {
    title: fullName,
    description: `STOCK Act disclosure profile for ${fullName}, ${info.title}. View committee assignments and tracked congressional financial disclosures.`,
  };
}

export default function OfficialPage({ params }: PageProps) {
  // Match by normalized slug — handles mixed-case names like "McHenry"
  const entry = Object.entries(OFFICIALS).find(
    ([name]) => name.toLowerCase().replace(/\s+/g, "-") === params.name,
  );
  if (!entry) notFound();
  const [fullName, info] = entry;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6"
      >
        ← Back to dashboard
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold text-lg">
              {fullName.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-500 mt-0.5">{info.title}</p>
            <span
              className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                info.chamber === "Senate"
                  ? "bg-purple-100 text-purple-800 ring-1 ring-purple-200"
                  : "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200"
              }`}
            >
              U.S. {info.chamber}
            </span>
          </div>
        </div>
      </div>

      {/* Committee assignments */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Committee Assignments
        </h2>
        <div className="space-y-4">
          {info.committees.map((committee) => {
            const tickers = COMMITTEE_SECTOR_MAP[committee] ?? [];
            return (
              <div key={committee} className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-800">{committee}</h3>
                {tickers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tickers.map((ticker) => (
                      <span
                        key={ticker}
                        className="inline-block px-2 py-0.5 text-xs font-mono font-semibold bg-gray-100 text-gray-700 rounded"
                      >
                        {ticker}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Trades in these tickers by this official may score as
                  &ldquo;Relevant committee trade&rdquo; (+35 signal strength).
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Link to dashboard filtered */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Signals from {fullName} appear on the{" "}
          <Link href="/dashboard" className="font-medium underline hover:text-blue-900">
            signal dashboard
          </Link>
          . Use the search bar to filter by their name.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900">
        <span className="font-semibold">Note:</span> Committee assignments are
        sourced from public congressional records (congress.gov). Trade data is
        from STOCK Act disclosures. This is an educational tool — not financial
        advice.
      </div>
    </div>
  );
}
