# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies (run once after cloning)
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build — primary way to catch TypeScript errors
npm run lint      # ESLint check
```

There are no tests. `npm run build` is the verification step before every commit.

On Windows: if `npm run build` fails with `EINVAL: invalid argument, readlink`, delete the `.next` folder first: `cmd /c "rmdir /s /q .next"` (PowerShell's `Remove-Item` fails on Next.js symlinks under OneDrive).

## Architecture

### Data pipeline (five sources + fallback)

At build/request time, `src/app/dashboard/page.tsx` calls `getSignals()` from `src/data/liveSignals.ts`, which runs four async sources concurrently via `Promise.allSettled`, plus one static source:

1. **EDGAR** — `fetchEdgarSignals()` in `src/lib/edgar.ts`. SEC Form 4 filings for ~30 watched companies. `signalType: "Corporate Insider"`.
2. **Congress — Senate** — `fetchCongressSignals()` in `src/lib/congress.ts`. Senate eFD API PTRs. `signalType: "Congress — Senate"`.
3. **Fund Manager / 13F** — `fetchForm13fSignals()` in `src/lib/form13f.ts`. SEC Form 13F quarterly holdings for 4 watched institutional managers (Berkshire, Pershing Square, Third Point, Appaloosa). `signalType: "Fund Manager / 13F"`, `dataFreshness: "Quarterly"`.
4. **Congress — House** — `fetchHouseSignals()` in `src/lib/house.ts`. House PTR disclosures. **No machine-readable API exists** (PDFs only) — always returns 5 curated sample entries. `signalType: "Congress — House"`, `dataFreshness: "Sample"`.
5. **Executive Branch** (static) — `ogeComputedSignals` from `src/data/ogeSignals.ts`. OGE 278e/278-T public filings; pre-computed at import time. `signalType: "Executive Branch"`, `dataFreshness: "Manual document"`. Always included regardless of live source health.
6. **Fallback** — if `edgarCount + senateCount + 13fCount < 5`, falls back to mock signals + OGE. `isLive: false`. One async source failing never kills the others.

`getSignals()` is wrapped in `unstable_cache` (key `"signal-alpha-live-signals-v6"`, TTL 4 hours) so the 100+ sequential SEC API calls only fire once per cache window. The daily GitHub Actions rebuild at 07:00 UTC busts this cache.

The dashboard page passes `{ signals, lastUpdated, isLive }` down. `lastUpdated` is `new Date().toISOString()` captured at the time the cache is populated and rendered in the dashboard header as a live/sample badge + timestamp.

### Scoring engine (`src/lib/scoring.ts`)

All functions are pure. Pipeline per entry:

```
SignalScore  = signalStrength(signalSubtype) + tradeConviction(tradeSize)
             + filingFreshness(daysDelayed) + contextBonus(contextTags)
             - riskPenalty(riskFlags)                        [capped 0–100]

TrackRecord  = historicalAlphaScore + winRateScore
             + sampleSizeConfidence + recencyBonus           [capped 0–100]

Total        = round(0.65 × SignalScore + 0.35 × TrackRecord)
Label        = bucket(Total) → Exceptional / Very Strong / Strong / Watchlist / Weak
```

`signalSubtype`, `contextTags`, and `riskFlags` are string keys that must exactly match the lookup maps at the top of `scoring.ts`. Typos silently score 0.

`getSignalScoreBreakdown()` and `getTrackRecordBreakdown()` are exported for `ScoreBreakdown.tsx` — they recompute subscores on demand rather than storing them on `ComputedSignal`.

Live EDGAR and Congress entries use neutral track record defaults (`historicalAlpha: 5.0`, `winRate: 52`, `tradeCount: 5`, `recentPerformance: "Neutral recent performance"`) because historical performance data requires a separate price-history source — planned for Version 4.

### Committee data (`src/data/committees.ts`)

Pure static data — no imports. Contains:
- `COMMITTEE_SECTOR_MAP` — maps committee names to tickers they directly oversee (e.g., "Senate Intelligence" → ["NVDA", "PLTR", ...]).
- `OFFICIALS` — maps 27 real senator/representative names to `OfficialInfo` (chamber, state, committees, title).
- `getCommitteeRelevance(officialName, ticker)` — returns `["Sector relevance to committee"]` if the official's committees cover that ticker; drives the +4 context bonus in scoring.
- `officialSubtype(officialName, ticker, tradeType)` — returns the correct `signalSubtype` string for scoring (`"Relevant committee trade"`, `"Large congressional purchase"`, or `"Government official sell"`).

Names in `OFFICIALS` must exactly match the `personEntity` strings returned by `fetchCongressSignals()` and used in mock data.

### Congress client (`src/lib/congress.ts`)

- Senate eFD list endpoint: `https://efts.senate.gov/v1/filings?filing_type=PT&limit=100&date_fld_from={cutoff}` (60-day lookback).
- Individual filing detail: `https://efts.senate.gov/v1/filings/{id}` — looks for `transactions[]` array with `asset_description`, `transaction_type`, `amount`, `transaction_date`.
- Ticker extraction: Senate filings often include ticker in parentheses, e.g. `"Apple Inc. (AAPL)"` — regex `\(([A-Z]{1,5})\)`.
- Amount parsing: STOCK Act reports ranges (`"$15,001 - $50,000"`) — `parseStockActAmount()` takes the midpoint.
- Caps at 15 filings per build with 150ms delay to avoid rate limits.
- Returns `[]` on any error; `Promise.allSettled` in `liveSignals.ts` ensures one source failing doesn't break the other.
- `signalType: "Congress — Senate"` (was `"Government Official"` before V6).

### Form 13F client (`src/lib/form13f.ts`)

- Watched managers: Berkshire Hathaway (0001067983), Pershing Square (0001336528), Third Point (0001040273), Appaloosa Management (0000913760).
- Fetches `data.sec.gov/submissions/CIK{cik}.json` → finds most recent `13F-HR` → fetches `infotable.xml` from the archives path.
- `extractAllBlocks(xml, tag)` iterates repeated `<infoTable>` elements (unlike Form 4 which has unique tags).
- `ISSUER_TICKER_MAP` (60+ entries) translates `nameOfIssuer` → ticker. Holdings not in the map are skipped.
- Takes top 8 holdings by value per manager, minimum $10M position. Cache: 6-hour revalidation (13F is quarterly, no point re-fetching hourly).
- `signalType: "Fund Manager / 13F"`, `dataFreshness: "Quarterly"`, `tradeType: "Buy"`.

### House PTR client (`src/lib/house.ts`)

- House Clerk (`disclosures.ehouse.gov`) publishes PTR filing **metadata** in yearly ZIPs but transaction details are PDF-only — no machine-readable transaction API exists.
- Always returns 5 curated sample entries (clearly labeled `dataFreshness: "Sample"`).
- Pings the disclosure site for liveness but falls back to sample data either way.

### OGE executive branch data (`src/data/ogeSignals.ts`)

- Static curated entries from publicly filed OGE 278e (annual) and 278-T (periodic transaction) reports.
- Pre-computed via `computeFullSignal` at import time — no async fetch.
- `signalType: "Executive Branch"`, `dataFreshness: "Manual document"`.
- Update manually when new public OGE filings become available at `oge.gov`.

### Official profile pages (`src/app/official/[name]/page.tsx`)

URL slug: `official-name.toLowerCase().replace(/\s+/g, "-")` (e.g., `nancy-pelosi`).
`generateStaticParams()` pre-generates pages for all names in `OFFICIALS`.
Page body does a normalized slug comparison (not naive `split("-").map(capitalize)`) to correctly handle mixed-case names like "McHenry".

### Stock price charts (`src/components/StockChart.tsx` + `src/app/api/stock/[ticker]/route.ts`)

`StockChart` is a `"use client"` component rendered on signal detail pages. Architecture:

- **API proxy** at `/api/stock/[ticker]` fetches `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}` server-side (avoids browser CORS), with `next: { revalidate: 300 }` (5-min cache) and a browser-like `User-Agent`. Returns 502 on upstream failure.
- **Range→interval map**: `{ "1d":"2m", "5d":"15m", "1mo":"1d", "6mo":"1d", "ytd":"1d", "1y":"1d", "5y":"1wk", "max":"1mo" }`.
- **`parseYahooResponse()`** extracts `timestamps[]` and `closes[]` from the Yahoo v8 JSON structure, filtering out `null` close values.
- **`useMemo` geometry**: all SVG path strings (`linePath`, `fillPath`), y-axis label prices, and the `tradeIdx` (nearest timestamp to `tradeDate`, nulled if >7 days away) are computed once when `data` or `tradeDate` changes.
- **SVG**: `viewBox="0 0 800 180"` with `preserveAspectRatio="none"` on an absolute-positioned layer inside a relative div. Y-axis labels are HTML (not SVG text) to avoid distortion from `preserveAspectRatio="none"`.
- **Trade date marker**: amber (`#F59E0B`) dashed vertical line + filled circle at the closest data point. Shows "Bought"/"Sold" legend below the chart.
- Props: `ticker: string`, `tradeDate?: string` (ISO date), `tradeType?: "Buy" | "Sell"`.

### Signal detail page (`src/app/signal/[id]/page.tsx`)

Now `async`. Fast path: checks `mockComputedSignals` first (pre-generated at build time). If the ID is not in mock data (i.e., it's a live EDGAR or Congress signal), falls through to `await getSignals()` and looks up by id. Renders `<StockChart>` below the header card, followed by the committee assignments panel (government officials only) and score breakdown.

### EDGAR client (`src/lib/edgar.ts`)

- Requires `User-Agent` header on every request (SEC policy). 110ms delay between XML fetches keeps requests under the 10 req/sec fair-access limit.
- **60-day lookback**, up to **5 Form 4s per company**. Large-cap tech insiders almost exclusively sell RSUs; the broader sector mix (energy, healthcare, defense, consumer) increases buy-signal coverage.
- **`extractXmlValue(xml, tag)`** — two-step extraction: first grabs the full block between `<tag>` and `</tag>` (handles multi-line content), then looks for a `<value>` child element, falling back to plain text. The original single-line regex failed on EDGAR's actual format: `<tag>\n  <value>X</value>\n  <footnoteId/>\n</tag>`. Always use this function for Form 4 field extraction — never write a one-shot regex for a field that may have footnotes.
- **`parseForm4XML()`** only processes transaction codes `P` (open-market purchase) and `S` (sale); skips awards (A), option exercises (M), tax-withholding dispositions (F), and trades under $5,000 or with zero price.
- **`fetchFilingXml()`** strips the `xslF345X06/` XSLT viewer prefix from `primaryDocument` before constructing the archive URL — that prefix points to the HTML-rendered view, not the raw XML.
- **CIK mismatch guard**: after parsing, if the XML's `issuerTradingSymbol` doesn't match `co.ticker`, the filing is skipped and a `console.warn` fires. This catches wrong CIKs immediately (previously caught SMCI→SYK and DVA inside BRK.B). Berkshire Hathaway uses `BRK.B` (dot, not hyphen) in EDGAR — the ticker in `WATCHED_COMPANIES` must match EDGAR's notation exactly.
- CIK format: submissions URL uses 10-digit zero-padded CIK (`CIK0001045810`); archives URL uses the CIK without leading zeros (`1045810`).
- To add a watched company: look up the **issuer** CIK (not the insider's CIK) at `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=TICKER&CIK=&type=4`, then append to `WATCHED_COMPANIES`. Always verify by checking the first build log — if the mismatch guard fires, the CIK is wrong.

### Client/server boundary

Page files (`app/*/page.tsx`) are server components — `dashboard/page.tsx` is `async` and awaits `getSignals()` at build time. Interactivity is delegated to `"use client"` components:

- `DashboardClient.tsx` — owns `FilterState`, computes `filteredSignals`, renders cards + filter bar + table
- `SignalTable.tsx` — owns sort state, `useMemo` re-sorts on prop or state change
- `FilterBar.tsx` — fully controlled via `onFiltersChange` prop
- `Header.tsx` — owns mobile menu toggle
- `StockChart.tsx` — owns range selector state, fetches from `/api/stock/[ticker]`, renders SVG chart

### Types (`src/types/signal.ts`)

`SignalEntry` is the universal data contract — both mock entries and live EDGAR entries must satisfy it. `ComputedSignal extends SignalEntry` adds the four computed fields. `FilterState` and `SortKey` live in `src/lib/utils.ts` (UI concerns, not data concerns).

## Project rules

- **Do not overbuild.** Build only what is explicitly requested for the current version.
- **Ask before adding any feature not explicitly requested.**
- **No new npm dependencies** without user approval. Stack is intentionally Next.js 14 + React 18 + TypeScript + Tailwind CSS only.
- **Tailwind classes must be full static strings.** Never interpolate (e.g. `bg-${color}-100`) — purge removes them. Use lookup objects with complete class strings (see `ScoreBadge.tsx`).
- **Page files stay server components.** Push `useState`/`useEffect`/handlers into `"use client"` components.
- **Scoring functions stay pure.** No I/O or side effects in `scoring.ts`.
- **Preserve the educational disclaimer** on every page showing signal data.

## Deployment

- Vercel auto-deploys on every push to `main` (repo must be **public** — Hobby plan blocks deploys from non-member commit authors on private repos).
- `.github/workflows/daily-rebuild.yml` triggers a Vercel deploy hook every day at 07:00 UTC, refreshing live EDGAR and Congress data. The hook URL is stored as the GitHub secret `VERCEL_DEPLOY_HOOK_URL`.

## Version scope

- **V1**: mock data only (`src/data/mockSignals.ts`)
- **V2**: live EDGAR Form 4 insider data (`src/lib/edgar.ts` + `src/data/liveSignals.ts`)
- **V3**: Congress STOCK Act disclosures via Senate eFD API + committee relevance scoring + official profile pages
- **V4**: Bloomberg-lite UI refresh — summary cards, expandable rows, muted Buy/Sell badges, mobile card layout
- **V5**: SVG logo + favicon, SEO metadata, Yahoo Finance stock price charts on signal detail pages; live EDGAR data fixed (extractXmlValue rewrite, CIK mismatch guard, xslF345X06 prefix strip, unstable_cache, expanded company list)
- **V6**: Five-source pipeline — SEC Form 13F (fund managers), House PTR sample data, OGE executive branch static data; updated SignalType enum; FilterBar and DashboardClient updated for new source categories ← current
- **V7+**: Watchlists, email alerts, backtesting, paid data — do not implement without explicit instruction.
