# CLAUDE.md — Project Rules for SignalAlpha

These are the permanent rules for working on this project. Read them before making changes.

## Workflow Rules

1. **Before coding any non-trivial change:**
   - Summarize the rules you will follow.
   - Summarize the exact task.
   - List the files you plan to create or edit.
   - Ask the user before adding any feature not explicitly requested.

2. **Do not overbuild.** Build only the smallest working version for the current phase.

3. **No comments in code unless the WHY is non-obvious.** Variable and function names should explain WHAT the code does.

4. **Never create documentation files (*.md) unless explicitly requested.**

## Architecture Rules

5. **Scoring logic stays pure.** All scoring functions in `src/lib/scoring.ts` must be pure (no side effects, no I/O). This keeps the engine swappable when real data is connected.

6. **Mock data conforms to `SignalEntry` type.** Every entry in `src/data/mockSignals.ts` must satisfy the `SignalEntry` interface. Real data sources later must map into this same shape.

7. **No new dependencies without asking.** This project intentionally uses only Next.js, React, TypeScript, and Tailwind CSS. Do not add other libraries without user approval.

8. **Tailwind classes must be static strings.** Never build class names by string interpolation (e.g., `bg-${color}-100`) — Tailwind's purge will strip them. Use lookup objects with full class strings.

9. **Page files stay server components.** Push interactivity (`useState`, `useEffect`, event handlers) into `"use client"` components. Pages just pass data down.

## What This Project Is NOT (Yet)

- Not a real financial advice tool — every change must preserve the educational disclaimer.
- Not connected to any real API — data is intentionally mock.
- Not authenticated — no login, no user accounts, no per-user state.
- Not a backend service — no database, no API routes (other than what Next.js requires).

## Versioning

Version 1 = mock data only. Future versions (2-5) are described in `README.md`. Do not implement future-version features without explicit instruction.
