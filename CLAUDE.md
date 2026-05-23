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

## Architecture

### Data pipeline (two modes)

At build time, `src/app/dashboard/page.tsx` calls `getSignals()` from `src/data/liveSignals.ts`, which:

1. **Live mode** — calls `fetchEdgarSignals()` from `src/lib/edgar.ts`, which fetches real SEC Form 4 filings for 16 watched companies via the EDGAR Submissions API (`data.sec.gov/submissions/CIK{cik}.json`), then fetches and regex-parses each filing's XML. Returns `SignalEntry[]`. If ≥5 entries come back, `isLive: true`.
2. **Fallback mode** — if EDGAR returns fewer than 5 entries or throws, falls back to `computedSignals` from `src/data/mockSignals.ts`. `isLive: false`.

The dashboard page passes `{ signals, lastUpdated, isLive }` down. `lastUpdated` is `new Date().toISOString()` captured at build time and rendered in the dashboard header as a live/sample badge + timestamp.

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

Live EDGAR entries use neutral track record defaults (`historicalAlpha: 5.0`, `winRate: 52`, `tradeCount: 5`, `recentPerformance: "Neutral"`) because historical performance data is not available from EDGAR alone — planned for Version 3.

### EDGAR client (`src/lib/edgar.ts`)

- Requires `User-Agent` header on every request (SEC policy).
- Uses a 110ms delay between filing fetches to stay under the 10 req/sec rate limit.
- `parseForm4XML()` uses regex extraction — fragile by design to avoid adding an XML parser dependency. Only processes transaction codes `P` (purchase) and `S` (sale); skips awards, option exercises, zero-price grants, and trades under $5,000.
- CIK format: submissions URL uses 10-digit zero-padded CIK (`CIK0001045810`); archives URL uses the CIK without leading zeros (`1045810`).
- To add a new watched company, append to `WATCHED_COMPANIES` in `edgar.ts` with the correct 10-digit CIK from `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=TICKER&CIK=&type=4`.

### Client/server boundary

Page files (`app/*/page.tsx`) are server components — `dashboard/page.tsx` is `async` and awaits `getSignals()` at build time. Interactivity is delegated to `"use client"` components:

- `DashboardClient.tsx` — owns `FilterState`, computes `filteredSignals`, renders cards + filter bar + table
- `SignalTable.tsx` — owns sort state, `useMemo` re-sorts on prop or state change
- `FilterBar.tsx` — fully controlled via `onFiltersChange` prop
- `Header.tsx` — owns mobile menu toggle

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
- `.github/workflows/daily-rebuild.yml` triggers a Vercel deploy hook every day at 07:00 UTC, refreshing live EDGAR data. The hook URL is stored as the GitHub secret `VERCEL_DEPLOY_HOOK_URL`.

## Version scope

- **V1**: mock data only (`src/data/mockSignals.ts`)
- **V2**: live EDGAR Form 4 insider data (`src/lib/edgar.ts` + `src/data/liveSignals.ts`) ← current
- **V3–V5**: Congress STOCK Act, 13F/13D hedge fund data, historical price performance, watchlists — documented in `README.md`. Do not implement without explicit instruction.
