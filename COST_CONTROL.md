# Cost Control

This file documents how Signal Alpha Stock stays **$0/month** to operate, and
the guardrails that keep future versions cheap.

## Current cost: $0

| Layer | Provider | Cost |
| --- | --- | --- |
| Hosting | Vercel Hobby plan | $0 |
| Repo / CI | GitHub Actions (daily rebuild) | $0 |
| Disclosure data | SEC EDGAR (Form 4, 13F), Senate eFD, OGE | $0 |
| Price charts | Yahoo Finance unofficial v8 chart endpoint | $0 |
| Daily Alpha news | **Mock data only** (`src/data/mockDailyAlphaPicks.ts`) | $0 |

No database, no auth, no paid APIs, no managed services.

## Daily Alpha Picks news strategy

The Daily Alpha Picks page ships with **fully mock article data**. Real news
data can be added later via the optional adapters in `src/lib/newsAdapters.ts`,
which are wired so that the build never breaks when API keys are missing.

Approved free-tier providers (none required, all opt-in):

| Provider | Free tier | Activation env var |
| --- | --- | --- |
| GDELT 2.0 Doc API | Unlimited, no key | `USE_GDELT_NEWS=1` |
| Alpha Vantage | 25 calls/day | `ALPHA_VANTAGE_KEY` |
| Finnhub | 60 calls/min | `FINNHUB_KEY` |
| Financial Modeling Prep | 250 calls/day | `FMP_KEY` |

## Hard rules

1. **No paid APIs.** Never wire in any provider that requires a subscription
   or per-call billing.
2. **No scraping paid/proprietary sites.** This explicitly excludes Seeking
   Alpha, Bloomberg Terminal, FactSet, Refinitiv, paywalled WSJ article text,
   Benzinga Pro, sec-api.io, etc. Headlines + links to public articles only.
3. **No new infrastructure that incurs ongoing cost** (no database, no Redis,
   no queue, no logging service, no cron service, no email/SMS provider, no
   monitoring SaaS).
4. **No request fan-out on page load.** All external calls run at build time or
   ISR-revalidate time, cached via `unstable_cache` or `fetch(..., { next:
   { revalidate } })`.

## Avoiding serverless overuse

- Serverless functions in this repo are limited to the existing
  `/api/stock/[ticker]` route. Cache responses for 300 s minimum.
- New routes should prefer **static export** (`generateStaticParams`) over
  on-demand server rendering.
- Page-level data fetches must be wrapped in `unstable_cache` with a TTL of
  at least 4 hours.
- News-adapter fetches use 6-hour cache by default (see `newsAdapters.ts`).

## What activates a paid plan

You'd only need to upgrade Vercel from Hobby if you hit:

- 100 GB bandwidth / month
- 100 GB-hours of serverless execution / month
- Or you publish the site under a different user's commit history on a
  private repo.

For a hobby research site, none of these are likely to trigger at the current
data volume.

## Future cost-prevention checklist (before adding any feature)

- [ ] Does it require a new external service that charges money?
- [ ] Does it require a database or persistent server-side store?
- [ ] Does it require authentication or per-user state on the server?
- [ ] Does it call an external API on every page load?
- [ ] Does it scrape a paid or proprietary site?

If any answer is **yes**, the feature is out of scope for the free tier.
