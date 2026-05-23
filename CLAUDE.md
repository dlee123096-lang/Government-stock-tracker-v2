# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies (run once after cloning)
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build (catches TypeScript errors)
npm run lint      # ESLint check
```

There are no tests yet. `npm run build` is the primary way to catch type errors before committing.

## Architecture

### Data flow

Everything starts from `src/data/mockSignals.ts`. It exports two arrays:
- `mockSignals` — raw `SignalEntry[]` objects (the source of truth)
- `computedSignals` — pre-computed `ComputedSignal[]`, generated at module load by mapping each entry through `computeFullSignal()` from `src/lib/scoring.ts`

Pages receive `computedSignals` as a prop and pass it into client components. No server state, no fetch calls.

### Scoring engine (`src/lib/scoring.ts`)

All functions are pure. The scoring pipeline for a single entry is:

```
SignalScore   = signalStrength(signalSubtype) + tradeConviction(tradeSize)
              + filingFreshness(daysDelayed) + contextBonus(contextTags)
              - riskPenalty(riskFlags)          [capped 0–100]

TrackRecord   = historicalAlphaScore + winRateScore
              + sampleSizeConfidence + recencyBonus  [capped 0–100]

Total         = round(0.65 × SignalScore + 0.35 × TrackRecord)
Label         = bucket(Total)  →  Exceptional / Very Strong / Strong / Watchlist / Weak
```

`signalSubtype`, `contextTags`, and `riskFlags` on each `SignalEntry` are string keys that must exactly match the lookup maps (`SIGNAL_STRENGTH_MAP`, `CONTEXT_BONUS_MAP`, `RISK_PENALTY_MAP`) defined at the top of `scoring.ts`. Typos silently score as 0.

The file also exports `getSignalScoreBreakdown()` and `getTrackRecordBreakdown()` — used by `ScoreBreakdown.tsx` on the detail page to show per-component values without storing them on `ComputedSignal`.

### Client/server component boundary

Page files (`app/*/page.tsx`) are server components — they import `computedSignals` and pass data down as props. All interactivity lives in client components:

- `DashboardClient.tsx` — owns filter state (`FilterState`), computes `filteredSignals` via `filterSignals()`, renders `SummaryCards` + `FilterBar` + `SignalTable`
- `SignalTable.tsx` — owns sort state, uses `useMemo` to re-sort when props or sort state change
- `FilterBar.tsx` — fully controlled; calls `onFiltersChange` prop
- `Header.tsx` — owns mobile menu open/close state

`SummaryCards` and `ScoreBreakdown` have no hooks and need no `"use client"` directive.

### Types (`src/types/signal.ts`)

`SignalEntry` is the data contract. Any future real-data adapter must map its API response into `SignalEntry` — no other files need changing.

`ComputedSignal extends SignalEntry` and adds `signalScore`, `trackRecordScore`, `totalOpportunityScore`, `label`.

`FilterState` and `SortKey` live in `src/lib/utils.ts` (they are UI concerns, not data concerns).

## Project rules

- **Do not overbuild.** Build only the smallest working version for the current phase.
- **Ask before adding any feature not explicitly requested.**
- **No new npm dependencies** without user approval. Intentional stack: Next.js 14, React 18, TypeScript, Tailwind CSS only.
- **Tailwind classes must be full static strings.** Never interpolate class names (e.g. `bg-${color}-100`) — Tailwind's purge removes them. Use lookup objects mapping labels to complete class strings (see `ScoreBadge.tsx` for the pattern).
- **Page files stay server components.** Keep `useState`/`useEffect`/handlers in `"use client"` components.
- **Scoring functions stay pure.** No I/O, no side effects in `scoring.ts`.
- **Every `SignalEntry` must use exact string keys** for `signalSubtype`, `contextTags`, and `riskFlags` that match the maps in `scoring.ts`.
- **Preserve the educational disclaimer** on every page that shows signal data. This is not a financial advice tool.

## Version scope

Version 1 = mock data only. The roadmap (V2–V5: real SEC/STOCK Act/13F/13D APIs, watchlists, alerts) is documented in `README.md`. Do not implement future-version features without explicit instruction.
