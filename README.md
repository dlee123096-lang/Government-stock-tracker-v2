# SignalAlpha

> Track public market disclosures. Rank information-advantaged signals.

SignalAlpha is an educational research tool that scores publicly disclosed stock trades from corporate insiders, members of Congress, hedge fund managers, executive branch officials, and activist investors using a transparent scoring system.

**No paid APIs, no database, no login required.** All data comes from free official public sources (SEC EDGAR, Senate eFD, OGE).

---

## What it does

- **Government Disclosures dashboard** ranks every public-filing signal (insiders, Congress, fund managers, executive branch, activists) with a transparent Signal Score, Track Record Score, and Total Opportunity Score
- **Daily Alpha Picks** ranks the top 10 and top 20 daily *research candidates* using a separate eight-factor formula that combines disclosure data, trusted news, momentum, fundamentals, valuation, earnings revisions, freshness, and historical track record — with risk penalty deductions
- **Per-ticker pages** aggregate every disclosure for a single stock
- **Per-official pages** show committee assignments and disclosure history
- **Filterable, sortable, mobile-responsive** across every view

## Daily Alpha Picks

`/daily-alpha-picks` is a daily-ranked research list. Each candidate gets a
0–100 **Daily Alpha Score** computed by `src/lib/dailyAlphaScoring.ts`:

```
Daily Alpha Score
  = 20% News Catalyst
  + 20% Disclosure Signal
  + 15% Momentum
  + 15% Fundamental Quality
  + 10% Valuation
  + 10% Earnings Revision
  +  5% Freshness
  +  5% Track Record
  −  Risk Penalty
```

Labels: **Exceptional (90+) · High-Conviction (80+) · Strong Research (70+) · Watchlist (60+) · Low Priority (<60)**.

The Top 10 are displayed as detailed cards (with bull/bear cases, supporting
headlines, performance vs S&P 500, and risk flags). The Top 20 appears as a
sortable watchlist table.

| File | What it holds |
| --- | --- |
| `src/data/mockDailyAlphaPicks.ts` | 40+ mock candidates with full metadata |
| `src/lib/dailyAlphaScoring.ts` | Pure scoring functions and label thresholds |
| `src/lib/getDailyAlphaPicks.ts` | Data service: load → score → sort → top 10 / top 20 |
| `src/lib/newsSources.ts` | Trust score registry for news outlets |
| `src/lib/newsAdapters.ts` | Disabled-by-default free news API adapters |

**Why "research candidate" language:** Signal Alpha Stock is an educational
research tool. We deliberately never describe a pick as a "buy" or "sell."
Picks are inputs to your own research process — see the full disclaimer on
every page.

### Live news via GDELT (free, no API key)

SignalAlpha integrates with the [GDELT DOC API v2](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) — a real-time global news index maintained by Google Ideas. It's completely free and requires no API key.

**To enable live GDELT news:**

1. In your Vercel project settings → Environment Variables, add:
   ```
   USE_GDELT_NEWS=1
   ```
2. Redeploy (or wait for the next daily GitHub Actions rebuild at 07:00 UTC).

**How it works when enabled:**

- All picks are scored with initial data, sorted, and the **top 20 only** are queried for GDELT news articles (capped at ~3 days back, 5 articles per ticker)
- Each article is normalised into: title, source, domain, date, URL, trust score (0–100), relevance score (0–100), sentiment
- Only articles with trust ≥ 70 (from outlets like Reuters, AP, Bloomberg, CNBC, WSJ, Morningstar, etc.) influence the **News Catalyst Score**
- The News Catalyst Score is recalculated from live articles, then the Daily Alpha Score updates and picks are re-sorted
- If GDELT fails or returns no trusted articles, the pick falls back to mock data — no build failure, no broken pages
- A "Live GDELT" badge appears on articles; a "Mock fallback" badge shows when using sample data

**Key files:**

| File | Role |
| --- | --- |
| `src/lib/newsAdapters.ts` | `fetchGdeltNewsForTicker` — calls GDELT, deduplicates, filters |
| `src/lib/newsNormalizer.ts` | `normalizeGdeltArticle` — converts raw GDELT JSON → `SupportingArticle` |
| `src/lib/newsScoring.ts` | `computeNewsCatalystScore`, `computeArticleRelevanceScore`, `buildRankingReasons` |
| `src/lib/newsSources.ts` | Trust score registry; `getDomainTrustScore` for domain-based lookup |
| `src/lib/getDailyAlphaPicks.ts` | Orchestrates: initial score → top-20 GDELT fetch → rescore → resort |

See `COST_CONTROL.md` for the full policy on which APIs are allowed and why.

## Data sources

| Source | Filing type | Update cadence | Status |
|---|---|---|---|
| Corporate Insider | SEC Form 4 | Within 2 business days of trade | ✅ Live |
| Congress — Senate | Senate eFD PTR | STOCK Act 30–45 day window | ✅ Live |
| Fund Manager / 13F | SEC Form 13F | Quarterly (45-day lag) | ✅ Live |
| Congress — House | House Clerk PTR | STOCK Act 30–45 day window | ⚠️ Sample (PDFs only — no API) |
| Executive Branch | OGE 278e / 278-T | Annual / periodic | ⚠️ Static (curated from public PDFs) |

All sources are **free and official**. No API keys needed.

---

## How to run it locally (step-by-step, no coding experience needed)

### 1. Install Node.js

Download and install Node.js (version 18 or higher) from https://nodejs.org. Pick the LTS version.

### 2. Open this folder in a terminal

On Windows, open PowerShell or Command Prompt and `cd` to this folder:

```
cd "C:\Users\ruxan\OneDrive\Documents\Claude Code\Government stock tracker v2"
```

### 3. Install dependencies

This downloads all the libraries the project needs:

```
npm install
```

This takes 1-2 minutes the first time.

### 4. Start the dev server

```
npm run dev
```

You'll see a message like `ready - started server on 0.0.0.0:3000`. Open http://localhost:3000 in your browser.

### 5. Stop the dev server

Press `Ctrl+C` in the terminal.

---

## How to push to GitHub

### 1. Create a free GitHub account

If you don't have one, go to https://github.com and sign up.

### 2. Install Git

Download Git from https://git-scm.com/download/win.

### 3. Create a new empty repository on GitHub

- Go to https://github.com/new
- Repository name: `signal-alpha` (or whatever you like)
- Keep it Public or Private (your choice)
- **Do NOT** check "Initialize this repository with a README" (we already have one)
- Click "Create repository"

GitHub will show you a URL like `https://github.com/YOUR-USERNAME/signal-alpha.git`. Copy it.

### 4. Push the code

In your terminal, inside the project folder:

```
git init
git add .
git commit -m "Initial commit: SignalAlpha Version 1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/signal-alpha.git
git push -u origin main
```

Replace the URL with yours.

---

## How to deploy to Vercel (free)

### 1. Sign up for Vercel

Go to https://vercel.com and sign up with your GitHub account.

### 2. Import your GitHub repo

- Click "Add New..." → "Project"
- Find `signal-alpha` in the list and click "Import"
- Vercel auto-detects Next.js. Leave all settings as default.
- Click "Deploy"

In ~1 minute, you'll get a live URL like `https://signal-alpha.vercel.app`.

### 3. Every push auto-deploys

After this, anytime you push to GitHub, Vercel rebuilds and redeploys automatically.

---

## Where things live

| What you want to change | File |
| --- | --- |
| Sample/fallback signals | `src/data/mockSignals.ts` |
| Live data pipeline | `src/data/liveSignals.ts` |
| SEC Form 4 insider fetcher | `src/lib/edgar.ts` |
| Senate eFD Congress fetcher | `src/lib/congress.ts` |
| 13F fund manager fetcher | `src/lib/form13f.ts` |
| House PTR fetcher (sample) | `src/lib/house.ts` |
| OGE executive branch data | `src/data/ogeSignals.ts` |
| Scoring formulas | `src/lib/scoring.ts` |
| TypeScript types | `src/types/signal.ts` |
| Committee–sector mapping | `src/data/committees.ts` |
| Dashboard table | `src/components/SignalTable.tsx` |
| Filter controls | `src/components/FilterBar.tsx` |

---

## How to add a new data source

The universal data contract is `SignalEntry` in `src/types/signal.ts`. Any public source can be wired in by:

1. Creating `src/lib/yourSource.ts` that returns `SignalEntry[]`
2. Adding it to `Promise.allSettled([...])` in `src/data/liveSignals.ts`
3. Adding its `signalType` string to `SIGNAL_TYPES` in `src/components/FilterBar.tsx`
4. Adding any new `signalSubtype` strings to `SIGNAL_STRENGTH_MAP` in `src/lib/scoring.ts`

The scoring logic is pure — it works on any `SignalEntry`, regardless of source.

## How the cache works

`getSignals()` in `src/data/liveSignals.ts` is wrapped in `unstable_cache` (4-hour TTL). The 100+ sequential API calls only fire once per cache window. A GitHub Actions workflow triggers a Vercel deploy hook at 07:00 UTC daily, which busts the cache and fetches fresh data.

---

## Roadmap

### Implemented
- ✅ Live SEC Form 4 insider data (~30 watched companies)
- ✅ Live Senate STOCK Act disclosures (Senate eFD API)
- ✅ Live 13F quarterly holdings (Berkshire, Pershing Square, Third Point, Appaloosa)
- ✅ House PTR sample data (PDF-only limitation)
- ✅ OGE executive branch static disclosures
- ✅ Committee relevance scoring + official profile pages
- ✅ Yahoo Finance stock price charts on detail pages
- ✅ Daily GitHub Actions auto-refresh

### Not yet implemented
- Watchlists, email alerts, backtesting, login, payments — out of scope

---

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- No backend, no database, no API keys required

---

## SEO launch checklist

After deploying to Vercel and connecting a custom domain, complete these steps to get indexed by Google:

1. **Set your canonical URL** — add `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` as an environment variable in Vercel (Project Settings → Environment Variables). This populates `robots.txt` and `sitemap.xml` with the correct base URL.
2. **Submit to Google Search Console** — go to [search.google.com/search-console](https://search.google.com/search-console), add your property, and verify ownership.
3. **Submit your sitemap** — in Search Console, go to Sitemaps and enter `https://yourdomain.com/sitemap.xml`.
4. **Request indexing** — use the URL Inspection tool in Search Console on your homepage and click "Request Indexing."
5. **Check indexing** — after a few days, run `site:yourdomain.com` in Google to see which pages are indexed.
6. **Add a custom domain** — in Vercel → Project → Domains, add your domain. Google indexes custom domains faster than `.vercel.app` subdomains.
7. **Share for discovery** — post the link on GitHub (pin the repo), Reddit (r/investing, r/stockmarket, r/DataIsBeautiful), X/Twitter, and LinkedIn to build backlinks.

---

## Disclaimer

This website is for educational and research purposes only. It does not provide financial advice, investment recommendations, or buy/sell signals. Public disclosures may be delayed, incomplete, or inaccurate. Always do your own research or consult a licensed financial advisor before making investment decisions.
