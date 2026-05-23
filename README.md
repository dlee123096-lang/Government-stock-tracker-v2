# SignalAlpha

> Track public market disclosures. Rank information-advantaged signals.

SignalAlpha is an educational research tool that scores publicly disclosed stock trades from corporate insiders, government officials, hedge funds, and activist investors using a transparent three-part scoring system.

**This is Version 1.** All data is sample/mock data stored locally. No paid APIs, no database, no login required.

---

## What it does

- **Ranks stock signals** using a Signal Score (0-100) and Track Record Score (0-100), combined into a Total Opportunity Score
- **Filterable dashboard** with sort, search, and filter controls
- **Detail pages** for each signal with full score breakdowns and plain-English explanations
- **Score labels** from "Weak Signal" up to "Exceptional Signal"

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
| Sample stock signals | `src/data/mockSignals.ts` |
| Scoring formulas | `src/lib/scoring.ts` |
| TypeScript types | `src/types/signal.ts` |
| Home page content | `src/app/page.tsx` |
| Dashboard table | `src/components/SignalTable.tsx` |
| Filter controls | `src/components/FilterBar.tsx` |
| Score badges (colors) | `src/components/ScoreBadge.tsx` |
| Footer disclaimer | `src/components/Footer.tsx` |

---

## How real APIs would connect later

The mock data is shaped so that real APIs can drop in cleanly. The contract is `SignalEntry` from `src/types/signal.ts`.

To swap in real data:

1. Build a script (or API route) that fetches real disclosures (SEC Form 4, STOCK Act, 13F, 13D filings).
2. Transform each filing into a `SignalEntry`.
3. Replace `mockSignals` in `src/data/mockSignals.ts` with the result.

The scoring logic in `src/lib/scoring.ts` is completely pure — it works on any `SignalEntry`, regardless of where the data came from. No UI changes will be needed.

---

## Roadmap

### Version 2 — Real insider data
- Connect SEC Form 4 filings (free EDGAR API)
- Add real insider buying/selling data
- Compute real historical price performance
- Compare each signal to S&P 500 returns
- Real track record calculations

### Version 3 — Government disclosures
- Add Congress STOCK Act disclosures
- Add committee relevance scoring
- Add government official profiles
- Add sector-to-committee mapping

### Version 4 — Institutional data
- Add hedge fund 13F filings
- Add activist 13D/13G filings
- Add fund manager track records

### Version 5 — Personalization & alerts
- Add user watchlists
- Add email alerts for new signals
- Add daily auto-updates
- Add backtesting

---

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- No backend, no database, no API keys required

---

## Disclaimer

This website is for educational and research purposes only. It does not provide financial advice, investment recommendations, or buy/sell signals. Public disclosures may be delayed, incomplete, or inaccurate. Always do your own research or consult a licensed financial advisor before making investment decisions.
