import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Glossary — Signal Alpha Stock",
  description:
    "Plain-English definitions of the disclosure types, scoring terms, and filing concepts used throughout Signal Alpha Stock.",
};

interface Term {
  term: string;
  category: "Filings" | "Scoring" | "Context";
  short: string;
  long: string;
}


const TERMS: Term[] = [
  // ── Filings ──────────────────────────────────────────────────────────────
  {
    term: "Form 4",
    category: "Filings",
    short:
      "SEC filing for corporate insiders disclosing personal stock trades.",
    long:
      "Filed within 2 business days of the trade. Required for directors, officers, and 10%+ owners. Covers open-market buys (code P), sales (code S), option grants, vesting, and gifts. Signal Alpha only scores P and S — vesting and grants are not voluntary investment decisions.",
  },
  {
    term: "Form 13F",
    category: "Filings",
    short: "Quarterly snapshot of an institutional manager's US equity longs.",
    long:
      "Required from any investment manager with $100M+ in AUM, due 45 days after each quarter-end (Mar 31, Jun 30, Sep 30, Dec 31). 13F shows long positions only — short positions, options, and non-US stocks are not disclosed. Because of the 45-day delay, a 13F is a stale snapshot, not a real-time trade.",
  },
  {
    term: "13D / 13G",
    category: "Filings",
    short: "Disclosure of an investor crossing the 5% ownership threshold.",
    long:
      "13D is the activist version, required within 10 days; the filer typically intends to influence the company. 13G is the passive version (10 calendar days after quarter-end for institutional filers), used when the investor has no activist intent.",
  },
  {
    term: "PTR (Periodic Transaction Report)",
    category: "Filings",
    short:
      "STOCK Act filing where Members of Congress disclose personal trades.",
    long:
      "Required within 30 days of awareness (and no later than 45 days from the trade) for any securities transaction over $1,000. Amounts are disclosed as ranges (e.g., $15,001–$50,000); Signal Alpha uses the midpoint. Senate PTRs are available via the eFD API; House PTRs are PDF-only at present.",
  },
  {
    term: "STOCK Act",
    category: "Filings",
    short:
      "2012 law requiring Congress and senior federal officials to disclose stock trades.",
    long:
      "Short for Stop Trading on Congressional Knowledge Act. Requires Members of Congress, their spouses, and certain executive-branch officials to publicly disclose securities transactions within 30–45 days. Notable for being routinely violated, with $200 penalties per late filing.",
  },
  {
    term: "OGE Form 278e",
    category: "Filings",
    short:
      "Annual Public Financial Disclosure Report for senior executive-branch officials.",
    long:
      "Filed annually by the President, Vice President, Cabinet members, and many senior White House staff. Reports holdings and income as ranges as of the calendar year-end. Not a real-time trade report — more like an annual balance sheet snapshot.",
  },
  {
    term: "OGE Form 278-T",
    category: "Filings",
    short:
      "Periodic Transaction Report for senior executive-branch officials.",
    long:
      "Equivalent of the congressional PTR for the executive branch. Filed within 30 days of awareness of a transaction over $1,000.",
  },

  // ── Scoring ──────────────────────────────────────────────────────────────
  {
    term: "Signal Score",
    category: "Scoring",
    short:
      "0–100 measure of how noteworthy a single disclosure is, by itself.",
    long:
      "Built from five components: (1) source quality based on signal subtype (max 40), (2) trade conviction from dollar size (max 20), (3) filing freshness in days from trade to filing (max 15), (4) context bonuses for tags like cluster buying or committee relevance (max 15), (5) risk penalties for flags like high debt or litigation (max 20).",
  },
  {
    term: "Track Record",
    category: "Scoring",
    short:
      "0–100 measure of how the filer has performed on prior disclosures.",
    long:
      "Combines historical alpha, win rate, sample size confidence, and recent performance. For live data sources where we don't yet have per-filer history, Track Record uses neutral baseline values and a disclosure note is shown on the detail page.",
  },
  {
    term: "Total Opportunity Score",
    category: "Scoring",
    short:
      "Weighted blend: 0.65 × Signal Score + 0.35 × Track Record.",
    long:
      "Higher means a more noteworthy research signal — NOT a buy recommendation. Bucketed into the Low / Moderate / Strong / Very Strong / Exceptional rating.",
  },
  {
    term: "Alpha",
    category: "Scoring",
    short:
      "Return above a benchmark — extra performance not explained by the market.",
    long:
      "In Signal Alpha, historical alpha represents the average outperformance of a filer's past disclosed positions versus a broad benchmark. Positive alpha means the filer's past picks outperformed the market on average; negative means they underperformed.",
  },
  {
    term: "Win Rate",
    category: "Scoring",
    short:
      "Percentage of a filer's past disclosed positions that were profitable.",
    long:
      "A 60% win rate means 6 of every 10 prior disclosures finished above their entry price over the measurement window. Combine with alpha for context — a high win rate with tiny gains is less interesting than a moderate win rate with large gains.",
  },
  {
    term: "News Catalyst Score",
    category: "Scoring",
    short:
      "0–100 score measuring how much credible news is supporting a Daily Alpha Pick.",
    long:
      "Aggregates up to 5 trusted news articles per pick into a single number. Considers: number of trusted articles (trust ≥ 70, max 25 pts), average trust score (max 25 pts), average relevance to the specific ticker (max 20 pts), dominant sentiment across articles (max 15 pts), and multi-source confirmation from distinct outlets (max 15 pts). Returns a neutral baseline of 20 when no trusted articles exist, so the Daily Alpha Score degrades gracefully rather than zeroing out. Weighted at 20% of the Daily Alpha Score.",
  },
  {
    term: "Source Trust Score",
    category: "Scoring",
    short:
      "0–100 reliability rating for a news outlet, based on its editorial standards.",
    long:
      "Tiered heuristic: 95–100 = primary sources (SEC EDGAR, OGE, company IR); 80–94 = top-tier wires and major financial journalism (Reuters, AP, FT, WSJ, Bloomberg); 70–79 = secondary business outlets (Yahoo Finance, Morningstar, Zacks); 50–69 = aggregators and PR wires; 20–49 = commentary and independent blogs; 0–19 = promotional or unverified. Only articles with trust ≥ 70 count toward the News Catalyst Score. This is a transparency aid, not an editorial endorsement.",
  },
  {
    term: "Relevance Score",
    category: "Scoring",
    short:
      "0–100 measure of how directly a news article relates to a specific ticker.",
    long:
      "Computed per article: +40 if the company name appears in the headline, +30 if the ticker symbol appears (e.g. 'NVDA' or '$NVDA'), +20 if the source is a known financial domain, +10 if published within 24 hours, +5 if published within 48 hours. A perfectly relevant article from a financial outlet naming both company and ticker published today would score 100.",
  },

  // ── Context ──────────────────────────────────────────────────────────────
  {
    term: "Days Delayed",
    category: "Context",
    short: "Calendar days between the trade date and the filing date.",
    long:
      "Lower is better — a fast filing means the public sees the disclosure close to when the trade happened. Form 4 has a 2-day legal limit; STOCK Act PTRs allow 30–45 days; 13F is filed 45 days after quarter-end.",
  },
  {
    term: "Cluster Buying",
    category: "Context",
    short:
      "Multiple insiders at the same company buying within a short window.",
    long:
      "Often considered a stronger signal than a single insider buy because it reduces the chance that any one person is buying for idiosyncratic reasons (e.g., diversification, personal liquidity event).",
  },
  {
    term: "Committee Relevance",
    category: "Context",
    short:
      "When an official trades in a stock their committee directly oversees.",
    long:
      "Example: a senator on the Armed Services Committee buying Lockheed Martin. Signal Alpha awards a +4 context bonus when the official's committee assignments overlap the company's sector. Whether this represents an information advantage is a separate question — it's surfaced as research context, not a judgment.",
  },
  {
    term: "RSU (Restricted Stock Unit)",
    category: "Context",
    short:
      "Compensation stock that vests over time, often sold immediately on vest.",
    long:
      "Why insider 'sells' aren't necessarily bearish: most large-cap executives sell vested RSUs as routine compensation. Signal Alpha tags these where possible. A planned, recurring sale is much weaker signal than a discretionary open-market sale.",
  },
  {
    term: "GDELT",
    category: "Context",
    short:
      "Global Database of Events, Language, and Tone — a free real-time global news index.",
    long:
      "GDELT monitors print, broadcast, and web news in over 100 languages and makes article metadata (title, source, URL, date) available via a free public API — no key required. Signal Alpha uses the GDELT DOC API v2 to find recent news about the top 20 Daily Alpha Picks each day. Only headline, source, date, and URL are used — article text is never reproduced. GDELT is a research tool run by Google Ideas; it is not a news publisher itself.",
  },
  {
    term: "Mock fallback",
    category: "Context",
    short:
      "Curated sample data shown when live APIs are unavailable or disabled.",
    long:
      "Signal Alpha is designed to degrade gracefully. When GDELT is not enabled (USE_GDELT_NEWS ≠ 1) or a live fetch fails, picks display curated mock articles written for this dataset. Mock articles are clearly labeled. They are structurally identical to live articles so the UI and scoring pipeline behave the same way. The site always builds and deploys successfully regardless of API health.",
  },
  {
    term: "Research Candidate",
    category: "Context",
    short:
      "Signal Alpha's label for stocks that score well across multiple public data signals.",
    long:
      "A Research Candidate is not a buy or sell recommendation. It is a stock that ranks highly when public disclosures (insider filings, congressional trades, institutional 13Fs), news quality, momentum, fundamentals, and valuation are combined into the Daily Alpha Score. The label 'Strong Research Candidate' means the score fell in the 70–79 range. A high score means more convergent public signals — not that the stock will go up.",
  },
];

const CATEGORIES: Term["category"][] = ["Filings", "Scoring", "Context"];

export default function GlossaryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
      >
        ← Back to dashboard
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Glossary
        </h1>
        <p className="mt-2 text-slate-600 leading-relaxed">
          Plain-English definitions of the filings, scoring components, and
          research context terms used throughout Signal Alpha Stock.
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={`#${cat.toLowerCase()}`}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
          >
            {cat}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {CATEGORIES.map((cat) => (
          <section key={cat} id={cat.toLowerCase()}>
            <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              {cat}
            </h2>
            <dl className="space-y-5">
              {TERMS.filter((t) => t.category === cat).map((t) => (
                <div
                  key={t.term}
                  className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm"
                >
                  <dt className="font-semibold text-slate-900">{t.term}</dt>
                  <dd className="mt-1 text-sm text-slate-700 font-medium">
                    {t.short}
                  </dd>
                  <dd className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {t.long}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-10 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 leading-relaxed">
        <span className="font-semibold">Note:</span> Definitions here are
        plain-English research aids, not legal advice. For the legal text of
        each filing requirement, consult the SEC, the Senate Select Committee
        on Ethics, the House Ethics Committee, or the Office of Government
        Ethics directly.
      </div>
    </div>
  );
}
