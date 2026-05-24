import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-4 ring-1 ring-blue-200">
              Signal Alpha Stock · Live SEC EDGAR &amp; STOCK Act data
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Track congressional stock trades and public market disclosures.{" "}
              <span className="text-blue-600">
                Rank information-advantaged signals.
              </span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Browse STOCK Act disclosures from members of Congress, SEC Form 4
              insider filings from corporate executives, and institutional
              position reports — all scored by a transparent, public-data model.
            </p>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Built for researchers, journalists, and curious investors who want
              to track congressional financial disclosures and corporate insider
              activity in one place. All data is sourced from public SEC EDGAR
              and STOCK Act filings.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                View Signal Dashboard
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works / Scoring */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Three scores. One ranking.
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Every signal is graded with a Signal Score and Track Record Score,
            then blended into a final Total Opportunity Score.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-3">
              1
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              Signal Score
            </h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              How strong is this single disclosure? Built from signal strength,
              trade conviction, filing freshness, contextual bonuses, and
              penalties for risk flags.
            </p>
            <div className="mt-4 text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1.5">
              0 – 100
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold mb-3">
              2
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              Track Record Score
            </h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              How well has this person or entity performed historically? Built
              from alpha vs. the S&amp;P 500, win rate, sample size, and recent
              performance.
            </p>
            <div className="mt-4 text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1.5">
              0 – 100
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-700 font-bold mb-3 ring-1 ring-blue-200">
              3
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              Total Opportunity Score
            </h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              0.65 × Signal Score + 0.35 × Track Record Score. Mapped to a
              human-readable label, from Weak Signal to Exceptional Signal.
            </p>
            <div className="mt-4 text-xs font-mono text-gray-500 bg-white/60 rounded px-2 py-1.5">
              0 – 100
            </div>
          </div>
        </div>
      </section>

      {/* Signal types */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Four sources of public-data signal
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Corporate Insiders",
                desc: "CEOs, CFOs, directors filing open-market purchases via SEC Form 4.",
              },
              {
                title: "Government Officials",
                desc: "Members of Congress filing periodic transaction reports under the STOCK Act (congressional financial disclosures).",
              },
              {
                title: "Hedge Funds",
                desc: "Institutional positions disclosed via quarterly 13F filings.",
              },
              {
                title: "Activist Investors",
                desc: "Activist campaigns and >5% stakes disclosed via 13D/13G.",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="bg-gray-50 border border-gray-200 rounded-lg p-5"
              >
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA repeat */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Ready to explore the signals?
        </h2>
        <p className="mt-2 text-gray-600">
          Browse the ranked dashboard of congressional financial disclosures and insider trades.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          View Signal Dashboard
        </Link>
      </section>

      {/* Disclaimer */}
      <section className="bg-amber-50 border-t border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-sm text-amber-900 leading-relaxed">
            <span className="font-semibold">Disclaimer:</span> Signal Alpha Stock is an
            educational research tool. Scores are based on public disclosure
            data and should not be interpreted as financial advice or a
            recommendation to buy or sell securities.
          </p>
        </div>
      </section>
    </div>
  );
}
