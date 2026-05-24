import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-4 ring-1 ring-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Live SEC EDGAR &amp; STOCK Act data
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Two tools. One edge.{" "}
              <span className="text-blue-600">
                All from public disclosures.
              </span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Signal Alpha Stock combines SEC filings, congressional STOCK Act
              disclosures, and trusted news into ranked research candidates —
              all scored transparently, all free.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Government Disclosures →
              </Link>
              <Link
                href="/daily-alpha-picks"
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                Daily Alpha Picks →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two product lanes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Two research tools in one</h2>
          <p className="mt-2 text-gray-500 max-w-xl mx-auto">
            Start with the source you trust most — they share the same scored,
            ranked data underneath.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lane 1 */}
          <div className="flex flex-col bg-white border border-blue-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold flex-shrink-0">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Government &amp; EDGAR Disclosure Tracker
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed mb-5">
              Every public filing in one ranked table. Corporate insiders,
              members of Congress, institutional fund managers, executive
              branch officials, and activist investors — scored by signal
              strength, filing freshness, track record, and committee
              relevance.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                "SEC Form 4 (insiders)",
                "STOCK Act PTRs (Congress)",
                "Form 13F (institutions)",
                "OGE 278e (exec. branch)",
                "13D / 13G (activists)",
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full ring-1 ring-blue-100"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="mt-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Disclosure Dashboard →
            </Link>
          </div>

          {/* Lane 2 */}
          <div className="flex flex-col bg-white border border-purple-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 text-lg font-bold flex-shrink-0">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Daily Alpha Picks
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed mb-5">
              Top 10–20 daily research candidates, each ranked by an
              eight-factor formula: trusted news catalysts, disclosure overlap,
              price momentum, fundamental quality, valuation, earnings
              revisions, freshness, and historical track record. S&amp;P 500
              comparison included on every pick.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                "Trusted news sources",
                "Disclosure overlap",
                "Momentum",
                "Fundamentals",
                "S&P 500 alpha",
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full ring-1 ring-purple-100"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href="/daily-alpha-picks"
              className="mt-auto inline-flex items-center justify-center px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Open Daily Alpha Picks →
            </Link>
          </div>
        </div>
      </section>

      {/* Scoring explanation */}
      <section id="how-it-works" className="bg-slate-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Disclosure dashboard: three scores, one ranking
            </h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
              Every government or SEC filing is graded with a Signal Score and
              Track Record Score, then blended into a Total Opportunity Score.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Signal Score</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Signal strength + trade conviction + filing freshness + context
                bonuses − risk deductions.
              </p>
              <div className="mt-4 text-xs font-mono text-gray-400 bg-gray-50 rounded px-2 py-1.5">
                0 – 100
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Track Record Score</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Historical alpha vs. S&amp;P 500, win rate, sample size, and
                recency — measured from real post-filing price data.
              </p>
              <div className="mt-4 text-xs font-mono text-gray-400 bg-gray-50 rounded px-2 py-1.5">
                0 – 100
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-700 font-bold mb-3 ring-1 ring-blue-200">
                3
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Total Opportunity Score</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                0.65 × Signal Score + 0.35 × Track Record Score →
                Exceptional / Very Strong / Strong / Moderate / Low.
              </p>
              <div className="mt-4 text-xs font-mono text-gray-400 bg-white/70 rounded px-2 py-1.5">
                0 – 100
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Five sources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Five sources of public-data signal
          </h2>
          <p className="mt-2 text-gray-500">
            No paid APIs. No subscriptions. All sourced from free official government and SEC filings.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Corporate Insiders",
              label: "Form 4 · Live",
              color: "green",
              desc: "CEOs, CFOs, directors filing open-market trades via SEC EDGAR Form 4.",
            },
            {
              title: "Congress — Senate & House",
              label: "PTR · Live",
              color: "green",
              desc: "Members of Congress filing Periodic Transaction Reports under the STOCK Act.",
            },
            {
              title: "Fund Managers / 13F",
              label: "13F · Quarterly",
              color: "blue",
              desc: "Institutional managers (Berkshire, Pershing Square, Third Point, Appaloosa) disclosing quarterly holdings.",
            },
            {
              title: "Executive Branch",
              label: "OGE 278e · Estimated",
              color: "amber",
              desc: "White House and Cabinet officials' public OGE 278e and 278-T disclosures.",
            },
            {
              title: "Activist Investors",
              label: "13D/13G · Sample",
              color: "amber",
              desc: "Activist campaigns and >5% stakes disclosed via 13D / 13G.",
            },
          ].map((t) => (
            <div
              key={t.title}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    t.color === "green"
                      ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                      : t.color === "blue"
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  }`}
                >
                  {t.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold">Ready to research?</h2>
          <p className="mt-2 text-blue-100">
            Start with the disclosures or jump straight to today&apos;s ranked picks.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
            >
              Government Disclosures
            </Link>
            <Link
              href="/daily-alpha-picks"
              className="inline-flex items-center justify-center px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30"
            >
              Daily Alpha Picks
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-amber-50 border-t border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-amber-900 leading-relaxed">
            <span className="font-semibold">Disclaimer:</span> Signal Alpha
            Stock is an educational research tool. Scores are based on public
            disclosure data and should not be interpreted as financial advice
            or a recommendation to buy or sell any security. Always do your
            own research.
          </p>
        </div>
      </section>
    </div>
  );
}
