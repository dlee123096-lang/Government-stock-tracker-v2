import Link from "next/link";
import { OFFICIALS } from "@/data/committees";

const CHAMBER_STYLES = {
  Senate:
    "bg-purple-100 text-purple-800 ring-1 ring-purple-200",
  House:
    "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200",
};

export default function OfficialsPage() {
  const senators = Object.entries(OFFICIALS).filter(
    ([, info]) => info.chamber === "Senate",
  );
  const representatives = Object.entries(OFFICIALS).filter(
    ([, info]) => info.chamber === "House",
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Tracked Officials
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {Object.keys(OFFICIALS).length} senators and representatives with
          committee assignments tracked for STOCK Act disclosures
        </p>
      </div>

      <OfficialGroup title="U.S. Senate" officials={senators} />
      <OfficialGroup
        title="U.S. House of Representatives"
        officials={representatives}
        className="mt-10"
      />

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900">
        <span className="font-semibold">Note:</span> Committee assignments are
        from public congressional records (congress.gov). Trade signals for
        these officials appear on the{" "}
        <Link href="/dashboard" className="underline hover:text-amber-700">
          dashboard
        </Link>{" "}
        when STOCK Act disclosures are available. This is an educational tool —
        not financial advice.
      </div>
    </div>
  );
}

function OfficialGroup({
  title,
  officials,
  className = "",
}: {
  title: string;
  officials: [string, (typeof OFFICIALS)[string]][];
  className?: string;
}) {
  if (officials.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {officials.map(([name, info]) => {
          const slug = name.toLowerCase().replace(/\s+/g, "-");
          return (
            <Link
              key={name}
              href={`/official/${slug}`}
              className="group block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                  {name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-700">
                    {name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{info.title}</p>
                  <span
                    className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CHAMBER_STYLES[info.chamber]}`}
                  >
                    {info.chamber}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {info.committees.slice(0, 2).map((c) => (
                  <span
                    key={c}
                    className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {c.replace("Senate ", "").replace("House ", "")}
                  </span>
                ))}
                {info.committees.length > 2 && (
                  <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                    +{info.committees.length - 2} more
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
