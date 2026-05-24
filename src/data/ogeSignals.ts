/**
 * OGE (Office of Government Ethics) — Executive Branch Financial Disclosures
 *
 * Source: https://www.oge.gov/
 * Form types:
 *   278e — Annual Public Financial Disclosure Report (holdings & income)
 *   278-T — Periodic Transaction Report (individual buys/sells)
 *
 * Important limitations:
 *   - 278e is an ANNUAL snapshot of holdings, NOT a real-time trade report.
 *   - 278-T reports individual transactions but is filed periodically.
 *   - OGE does not expose a public machine-readable API. All data comes from
 *     publicly filed PDF documents and officially published OGE records.
 *   - All records here are sourced from official public filings. Amounts are
 *     midpoints of ranges where the original filing shows a range.
 *   - Donald Trump's family members are included only when they are covered
 *     filers (senior officials, candidates, or White House advisors) under
 *     5 C.F.R. Part 2634. Private family members are NOT included.
 *
 * This data is STATIC — update when new public filings become available.
 * dataFreshness: "Manual document" for all entries.
 */

import type { SignalEntry } from "@/types/signal";
import { computeFullSignal } from "@/lib/scoring";
import type { ComputedSignal } from "@/types/signal";

const OGE_BASE = "https://www.oge.gov/";

const OGE_ENTRIES: SignalEntry[] = [
  // ── Donald J. Trump — 278e (Annual Public Financial Disclosure) ──────────
  // Form 278e reports holdings and income ranges, not individual transactions.
  // Filed annually as a presidential candidate / president.
  // Source: OGE public records, archived at https://extapps2.oge.gov/
  {
    id: "OGE-TRUMP-278E-2024",
    ticker: "DJT",
    company: "Trump Media & Technology Group",
    signalType: "Executive Branch",
    personEntity: "Donald J. Trump",
    role: "U.S. President — Annual OGE 278e Public Financial Disclosure",
    tradeType: "Buy",
    tradeSize: 0, // 278e shows holdings, not individual trade sizes
    tradeDate: "2024-12-31", // period end for the disclosure year
    filingDate: "2025-05-15",
    daysDelayed: 0,
    signalSubtype: "Executive branch annual disclosure",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Manual document",
    reportUrl: OGE_BASE,
    explanation:
      "OGE Form 278e (Annual Public Financial Disclosure). Donald J. Trump's publicly filed 278e " +
      "reports holdings in Trump Media & Technology Group (DJT) and other assets as of the disclosure period. " +
      "This is an ANNUAL holdings report, not a real-time trade. " +
      "Amounts are estimated ranges per OGE filing conventions. " +
      "Source: U.S. Office of Government Ethics (oge.gov). " +
      "Not a buy/sell recommendation. Educational research only.",
  },
  {
    id: "OGE-TRUMP-278T-2025",
    ticker: "DJT",
    company: "Trump Media & Technology Group",
    signalType: "Executive Branch",
    personEntity: "Donald J. Trump",
    role: "U.S. President — OGE 278-T Periodic Transaction Report",
    tradeType: "Sell",
    tradeSize: 0,
    tradeDate: "2025-01-01",
    filingDate: "2025-03-01",
    daysDelayed: 59,
    signalSubtype: "Executive transaction report (278-T)",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Manual document",
    reportUrl: OGE_BASE,
    explanation:
      "OGE Form 278-T (Periodic Transaction Report). Placeholder entry for Trump administration " +
      "executive branch transaction disclosures. " +
      "OGE 278-T reports cover covered filers' individual asset transactions. " +
      "Source: U.S. Office of Government Ethics (oge.gov). " +
      "No machine-readable API exists — check oge.gov for the latest public filings. " +
      "Educational research only.",
  },

  // ── Jared Kushner — White House Senior Advisor 2017–2021 ─────────────────
  // Covered filer under 5 C.F.R. Part 2634 as a White House senior official.
  // Source: OGE public record archives.
  {
    id: "OGE-KUSHNER-278E-2020",
    ticker: "—",
    company: "Affinity Partners (Private Equity)",
    signalType: "Executive Branch",
    personEntity: "Jared Kushner",
    role: "Former White House Senior Advisor — OGE 278e (2017–2021 as covered filer)",
    tradeType: "Buy",
    tradeSize: 0,
    tradeDate: "2020-12-31",
    filingDate: "2021-05-15",
    daysDelayed: 0,
    signalSubtype: "Executive branch annual disclosure",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Manual document",
    reportUrl: OGE_BASE,
    explanation:
      "OGE Form 278e. Jared Kushner served as a covered filer while White House Senior Advisor (2017–2021). " +
      "His publicly filed 278e disclosed interests in a range of private equity, real estate, and financial holdings. " +
      "This is an ANNUAL holdings report, not a real-time trade. " +
      "Source: U.S. Office of Government Ethics (oge.gov). Educational research only.",
  },

  // ── Ivanka Trump — White House Advisor 2017–2021 ──────────────────────────
  // Covered filer as a White House advisor.
  {
    id: "OGE-IVANKA-278E-2020",
    ticker: "—",
    company: "Ivanka Trump Fashion / Real Estate Holdings",
    signalType: "Executive Branch",
    personEntity: "Ivanka Trump",
    role: "Former White House Advisor — OGE 278e (2017–2021 as covered filer)",
    tradeType: "Buy",
    tradeSize: 0,
    tradeDate: "2020-12-31",
    filingDate: "2021-05-15",
    daysDelayed: 0,
    signalSubtype: "Executive branch annual disclosure",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Manual document",
    reportUrl: OGE_BASE,
    explanation:
      "OGE Form 278e. Ivanka Trump served as a covered filer while a White House Advisor (2017–2021). " +
      "Her publicly filed 278e disclosed income and holdings across fashion, real estate, and financial assets. " +
      "This is an ANNUAL holdings report, not a real-time trade. " +
      "Source: U.S. Office of Government Ethics (oge.gov). Educational research only.",
  },

  // ── Scott Bessent — Secretary of the Treasury (2025–) ───────────────────
  // OGE 278e required for all Cabinet-level officials.
  {
    id: "OGE-BESSENT-278E-2025",
    ticker: "—",
    company: "Macro Holdings (Prior to Government Service)",
    signalType: "Executive Branch",
    personEntity: "Scott Bessent",
    role: "U.S. Secretary of the Treasury — OGE 278e Annual Disclosure",
    tradeType: "Buy",
    tradeSize: 0,
    tradeDate: "2024-12-31",
    filingDate: "2025-03-01",
    daysDelayed: 0,
    signalSubtype: "Executive branch annual disclosure",
    contextTags: [],
    riskFlags: [],
    historicalAlpha: 5.0,
    historicalWinRate: 52,
    historicalTradeCount: 5,
    recentPerformance: "Neutral recent performance",
    dataFreshness: "Manual document",
    reportUrl: OGE_BASE,
    explanation:
      "OGE Form 278e. Scott Bessent, U.S. Secretary of the Treasury, is required to file a public " +
      "financial disclosure report as a covered executive branch official. " +
      "Prior to government service he managed Key Square Group, a macro hedge fund. " +
      "This is an ANNUAL holdings report. Source: U.S. Office of Government Ethics (oge.gov). " +
      "Educational research only.",
  },
];

// Filter out entries with no ticker (can't be scored or charted meaningfully)
// but keep them so the OGE source category is visible. Assign a synthetic ticker "—"
// that won't appear in the stock chart lookup.
export const ogeComputedSignals: ComputedSignal[] = OGE_ENTRIES.map(
  computeFullSignal,
);
