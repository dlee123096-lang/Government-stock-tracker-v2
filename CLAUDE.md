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

On Windows: if `npm run build` fails with `EINVAL: invalid argument, readlink`, delete `.next` first:
```
cmd /c "rmdir /s /q .next"
```
PowerShell's `Remove-Item` fails on Next.js symlinks under OneDrive. Node.js must be in PATH for PowerShell: `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH`.

---

## Architecture

### Data pipeline — five sources + fallback

`src/app/dashboard/page.tsx` calls `getSignals()` from `src/data/liveSignals.ts`, which runs four async sources concurrently via `Promise.allSettled`, plus one static source:

1. **EDGAR** — `fetchEdgarSignals()` in `src/lib/edgar.ts`. SEC Form 4 for ~30 watched companies. `signalType: "Corporate Insider"`.
2. **Congress — Senate** — `fetchCongressSignals()` in `src/lib/congress.ts`. Senate eFD API PTRs. `signalType: "Congress — Senate"`.
3. **Fund Manager / 13F** — `fetchForm13fSignals()` in `src/lib/form13f.ts`. Quarterly holdings for 4 managers. `signalType: "Fund Manager / 13F"`, `dataFreshness: "Quarterly"`.
4. **Congress — House** — `fetchHouseSignals()` in `src/lib/house.ts`. PDFs only — always returns 5 curated sample entries. `dataFreshness: "Sample"`.
5. **Executive Branch** (static) — `ogeComputedSignals` from `src/data/ogeSignals.ts`. Pre-computed at import time. `signalType: "Executive Branch"`, `dataFreshness: "Manual document"`.
6. **Fallback** — if `edgarCount + senateCount + 13fCount < 5`, falls back to mock signals + OGE. `isLive: false`.

`getSignals()` is wrapped in `unstable_cache` (key `"signal-alpha-live-signals-v7"`, TTL 4 hours). The daily GitHub Actions rebuild at 07:00 UTC busts this cache.

### Performance layer (`src/lib/performance.ts`)

Runs as part of the live-signals pipeline after sources are fetched. Single pass — price history is fetched once per unique ticker and reused for both filer-level and per-entry calculations.

**`buildPerformanceData(entries)`** — the main entry point. Returns:
```typescript
{ filerMap: Map<string, FilerPerformance>, entryReturns: Map<string, EntryReturn> }
```
- Fetches 1-year Yahoo Finance daily chart per unique ticker + SPY, concurrency cap of 6.
- For each entry: finds price at `tradeDate`, computes return to `tradeDate + 30d` (or today, whichever is sooner). SPY return over the same window is subtracted to get alpha.
- Filer-level aggregates require ≥2 measurable disclosures to replace neutral defaults.
- OGE annual disclosures and House Sample entries are excluded from measurement.

`entryReturns` is keyed by `entry.id`. In `liveSignals.ts`, these are spread onto `ComputedSignal` as `returnSinceFiling`, `sp500ReturnSinceFiling`, `alphaSinceFiling` (all `number | undefined`).

`applyFilerPerformance(entries, filerMap)` replaces `historicalAlpha`, `historicalWinRate`, `historicalTradeCount`, `recentPerformance` on entries whose filer has ≥2 measured trades. The legacy `buildFilerPerformance()` is a thin wrapper around `buildPerformanceData` for backwards compatibility.

### Scoring engine (`src/lib/scoring.ts`)

All functions are pure:

```
SignalScore  = signalStrength(signalSubtype) + tradeConviction(tradeSize)
             + filingFreshness(daysDelayed) + contextBonus(contextTags)
             - riskPenalty(riskFlags)                        [capped 0–100]

TrackRecord  = historicalAlphaScore + winRateScore
             + sampleSizeConfidence + recencyBonus           [capped 0–100]

Total        = round(0.65 × SignalScore + 0.35 × TrackRecord)
Label        = Exceptional / Very Strong / Strong / Moderate / Low
```

`signalSubtype`, `contextTags`, and `riskFlags` are string keys matching lookup maps at the top of `scoring.ts`. Typos silently score 0.

`getSignalScoreBreakdown()` and `getTrackRecordBreakdown()` are exported for `ScoreBreakdown.tsx` — they recompute subscores on demand rather than storing them on `ComputedSignal`.

### Types (`src/types/signal.ts`)

`SignalEntry` is the universal data contract. `ComputedSignal extends SignalEntry` adds:
- `signalScore`, `trackRecordScore`, `totalOpportunityScore`, `label` — always present
- `returnSinceFiling?`, `sp500ReturnSinceFiling?`, `alphaSinceFiling?` — set by `buildPerformanceData` for live, non-sample entries

`FilterState` and `SortKey` live in `src/lib/utils.ts` (UI concerns, not data).

`src/types/officials.ts` — `OfficialStats` interface shared between `src/app/officials/page.tsx` (server) and `src/components/OfficialsLeaderboard.tsx` (client). Kept in `types/` to avoid importing server component files in client components.

### Dashboard table (`src/components/SignalTable.tsx`)

Client component. Beyond the scored columns it now shows:

- **Filing Type** — derived by `filingTypeLabel(s)` from `signalType`: `"Form 4"`, `"PTR (STOCK Act)"`, `"Form 13F"`, `"OGE 278e/278-T"`, `"13D / 13G"`.
- **Data Status badge** — derived by `dataStatus(s)` from `dataFreshness`: `Live` (green), `Quarterly` (blue), `Sample` (amber), `Estimated` (slate), `Mock` (rose). Uses `DATA_STATUS_STYLES` lookup (full Tailwind class strings — never interpolated).
- **Disclosure delay** — `daysDelayed` shown inline in the Filed cell as `"Xd delay"`.
- **Post-filing performance panel** (expanded row) — renders `returnSinceFiling`, `sp500ReturnSinceFiling`, `alphaSinceFiling` when present. Shows explanatory text for sample/manual entries that will never have this data.
- **Source filing link** — shown in expanded row when `reportUrl` is set on the signal.

### Committee data (`src/data/committees.ts`)

Pure static, no imports. Contains:
- `COMMITTEE_SECTOR_MAP` — maps committee names to tickers they oversee.
- `OFFICIALS` — maps senator/representative names to `OfficialInfo` (chamber, state, committees, title). Names must exactly match `personEntity` strings from live fetchers.
- `getCommitteeRelevance(officialName, ticker)` — drives the +4 context bonus in scoring.
- `officialSubtype(officialName, ticker, tradeType)` — returns the correct `signalSubtype` string.

### Officials leaderboard (`src/app/officials/page.tsx`)

Now an `async` server component — calls `getSignals()` (already cached), iterates `OFFICIALS`, and computes per-official stats:

```
disclosureCount, buyCount, sellCount
avgAlpha (mean of historicalAlpha across signals)
avgWinRate (mean of historicalWinRate across signals)
bestTicker (ticker of highest totalOpportunityScore signal)
totalTradeValue, largestTrade
committeeRelevanceCount (signals with "committee" or "relevant" in contextTags)
committeeRelevanceScore = committeeRelevanceCount / disclosureCount * 100
latestFilingDate, recentTickers
```

Stats are passed as `OfficialStats[]` to `OfficialsLeaderboard` (client component in `src/components/OfficialsLeaderboard.tsx`) which owns tab state. Five tabs: **Best Track Records / Most Active / Committee Relevance / Recent Filers / Largest Trades**.

### Official profile pages (`src/app/official/[name]/page.tsx`)

URL slug: `name.toLowerCase().replace(/\s+/g, "-")`. Uses normalized slug comparison — not naïve `split("-").map(capitalize)` — to handle names like "McHenry". `generateStaticParams()` pre-generates pages for all names in `OFFICIALS`.

### Per-ticker aggregation pages (`src/app/ticker/[symbol]/page.tsx`)

Async server component. Aggregates all disclosures for a single ticker from both `getSignals()` (live) and `mockComputedSignals` (static). `generateStaticParams()` awaits both. Renders `<StockChart>` in multi-marker mode, a disclosure summary, and a research checklist.

### Daily Alpha Picks

**Types** — `src/types/dailyAlpha.ts`: `DailyAlphaPickInput` (44 static fields), `DailyAlphaPick` extends it with `dailyAlphaScore`, `scoreLabel`, `newsSource: "Live GDELT" | "Mock fallback" | "No articles found"`.

**Scoring** — `src/lib/dailyAlphaScoring.ts`. Pure functions. Formula:
```
Daily Alpha Score =
    20% newsCatalystScore + 20% disclosureSignalScore + 15% momentumScore
  + 15% fundamentalQualityScore + 10% valuationScore + 10% earningsRevisionScore
  +  5% freshnessScore + 5% trackRecordScore − riskPenalty    [clamped 0–100]
```
Labels: Exceptional Candidate (90+) / High-Conviction (80+) / Strong Research (70+) / Watchlist (60+) / Low Priority (<60).

**Data service** — `src/lib/getDailyAlphaPicks.ts`. Async, wrapped in `unstable_cache` (key `"signal-alpha-daily-alpha-picks-v2"`, TTL 6 hours):
1. Load from `src/data/mockDailyAlphaPicks.ts` (44 mock inputs with static sub-scores).
2. Score via `computeFullDailyAlphaPick`.
3. If `USE_GDELT_NEWS=1`: fetch GDELT in batches of 5 per ticker, replace mock articles, set `newsSource: "Live GDELT"`.
4. Otherwise: set `newsSource: "Mock fallback"` or `"No articles found"`.
5. Returns `{ all, top10, top20, generatedAt, newsSource }`.

**News adapters** — `src/lib/newsAdapters.ts`. Four adapters (GDELT, Alpha Vantage, Finnhub, FMP), all return `[]` when their env var is absent. GDELT (`USE_GDELT_NEWS=1`) needs no API key and is the recommended first activation. Cache: 6-hour revalidation.

**Pages** — `/daily-alpha-picks` (async server component), `/daily-alpha-picks/[ticker]` (async, `generateStaticParams` awaits `getDailyAlphaPicks()`). Both `generateMetadata` and the default export are `async`.

### Stock price charts (`src/components/StockChart.tsx` + `src/app/api/stock/[ticker]/route.ts`)

`StockChart` is a `"use client"` component with two modes:
- **Single-marker** (signal detail pages): amber dashed line + circle at trade date.
- **Multi-marker** (ticker aggregation pages): receives `markers: ChartMarker[]`, renders green dots for buys, red for sells.

The API proxy at `/api/stock/[ticker]` fetches Yahoo Finance v8 server-side (avoids browser CORS), `next: { revalidate: 300 }`. Range→interval map: `{ "1d":"2m", "5d":"15m", "1mo":"1d", "6mo":"1d", "ytd":"1d", "1y":"1d", "5y":"1wk", "max":"1mo" }`.

### Client/server boundary

Page files are server components; interactivity lives in `"use client"` components:

| Component | Owns |
|---|---|
| `DashboardClient.tsx` | FilterState, filteredSignals, cards + filter bar + table |
| `SignalTable.tsx` | sort state, expanded row state |
| `FilterBar.tsx` | fully controlled via `onFiltersChange` prop |
| `Header.tsx` | mobile menu toggle; unified `NAV_LINKS` array drives both desktop and mobile nav |
| `StockChart.tsx` | range selector state, Yahoo fetch |
| `DailyAlphaPicksClient.tsx` | DailyAlphaFilterState, filtered picks |
| `OfficialsLeaderboard.tsx` | active tab state |

### EDGAR client (`src/lib/edgar.ts`)

- 110ms delay between XML fetches (SEC fair-access: 10 req/sec).
- **`extractXmlValue(xml, tag)`** — two-step extraction: grabs full block `<tag>…</tag>`, then looks for a `<value>` child, falling back to plain text. One-shot regexes fail on EDGAR's multiline format. Always use this function for Form 4 fields.
- **`parseForm4XML()`** only processes codes `P` (purchase) and `S` (sale). Skips awards (A), option exercises (M), tax-withholding (F), trades under $5k or with zero price.
- **CIK mismatch guard**: skips filing and fires `console.warn` if `issuerTradingSymbol` ≠ `co.ticker`. BRK.B uses a dot, not a hyphen. To add a company: look up issuer CIK at `sec.gov/cgi-bin/browse-edgar?type=4`, add to `WATCHED_COMPANIES`, verify build log.

### Congress client (`src/lib/congress.ts`)

- Senate eFD list: `https://efts.senate.gov/v1/filings?filing_type=PT&limit=100&date_fld_from={cutoff}` (60-day lookback). Caps at 15 filings with 150ms delay.
- Ticker extraction from description strings via `\(([A-Z]{1,5})\)`.
- `parseStockActAmount()` takes the midpoint of STOCK Act dollar ranges.

### Form 13F client (`src/lib/form13f.ts`)

- Fetches `data.sec.gov/submissions/CIK{cik}.json` → most recent `13F-HR` → `infotable.xml`.
- `extractAllBlocks(xml, tag)` iterates repeated `<infoTable>` elements (Form 4 has unique tags; 13F does not).
- `ISSUER_TICKER_MAP` (60+ entries) maps `nameOfIssuer` → ticker. Holdings not in the map are skipped.
- Top 8 holdings by value, minimum $10M. Cache: 6-hour revalidation.

---

## Project rules

- **Do not overbuild.** Build only what is explicitly requested for the current version.
- **Ask before adding any feature not explicitly requested.**
- **No new npm dependencies** without user approval. Stack: Next.js 14 + React 18 + TypeScript + Tailwind CSS only.
- **Tailwind classes must be full static strings.** Never interpolate (`bg-${color}-100`). Use lookup objects (see `ScoreBadge.tsx`, `DATA_STATUS_STYLES` in `SignalTable.tsx`).
- **Page files stay server components.** Push `useState`/`useEffect`/handlers into `"use client"` components.
- **Never import a server component page file from a client component**, even for types. Extract shared types into `src/types/` instead (see `OfficialStats` pattern).
- **Scoring functions stay pure.** No I/O in `scoring.ts` or `dailyAlphaScoring.ts`.
- **Preserve the educational disclaimer** on every page showing signal data.

---

## Deployment

- Vercel auto-deploys on every push to `main` (repo must be **public** — Hobby plan blocks non-member authors on private repos).
- `.github/workflows/daily-rebuild.yml` triggers a Vercel deploy hook every day at 07:00 UTC. Hook URL stored as GitHub secret `VERCEL_DEPLOY_HOOK_URL`.

**To activate live GDELT news** on Vercel: add `USE_GDELT_NEWS=1` in Project Settings → Environment Variables, then redeploy. No API key required.

---

## Version scope

- **V1**: mock data only
- **V2**: live EDGAR Form 4
- **V3**: Congress STOCK Act + committee relevance + official profile pages
- **V4**: Bloomberg-lite UI refresh (summary cards, expandable rows, mobile cards)
- **V5**: SVG logo/favicon, SEO, Yahoo Finance price charts; EDGAR fixes (extractXmlValue, CIK guard, xslF345X06 strip, unstable_cache)
- **V6**: Five-source pipeline — Form 13F, House PTR sample, OGE executive branch; updated SignalType enum
- **V7**: Per-ticker aggregation pages (`/ticker/[symbol]`), real track record from Yahoo Finance (`buildPerformanceData`), glossary page
- **V8**: Daily Alpha Picks — 44-candidate mock set, 8-factor scoring, GDELT/Alpha Vantage/Finnhub/FMP news adapters, Model Portfolio placeholder; `getDailyAlphaPicks` + `getDailyAlphaSummary`
- **V9**: Nav unified, home page two-lane redesign, dashboard Filing Type + Data Status + disclosure delay + post-filing price columns, Officials leaderboard with five tabs, GDELT wired into Daily Alpha Picks ← current
- **V10+**: Watchlists, email alerts, backtesting, paid data — do not implement without explicit instruction.
