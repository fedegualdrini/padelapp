# Codebase Structure (padelapp)

Date: 2026-02-05

## Top-level layout

- `src/` — application source (Next.js App Router).
- `public/` — static assets.
- `supabase/` — Supabase project artifacts:
  - `supabase/migrations/*.sql` — schema, views, materialized views, RLS policies, RPC functions, triggers.
  - `supabase/seed.sql` — seed data.
- `tests/` — test suite (Playwright/Vitest artifacts also exist at repo root).
- `test-scenarios/`, `test-reports/` — test inputs/outputs.
- `scripts/` — helper scripts.

## `src/` structure (what goes where)

### Routing / pages (`src/app/`)

Next.js App Router routes live here.

Key entry points:

- Root shell:
  - `src/app/layout.tsx` — global HTML layout, fonts, theme provider, global CSS import.
  - `src/app/globals.css` — global styles.

- Root page:
  - `src/app/page.tsx` — group picker + setup gating (Supabase env check via `src/lib/supabase/server.ts`).

Group-scoped routes:

- `src/app/g/[slug]/(protected)/layout.tsx` — membership gating + `src/components/AppShell.tsx` wrapper.
- `src/app/g/[slug]/(protected)/page.tsx` — group dashboard page.
- `src/app/g/[slug]/join/` — join flow:
  - `src/app/g/[slug]/join/page.tsx`
  - `src/app/g/[slug]/join/layout.tsx`
  - `src/app/g/[slug]/join/actions.ts`
  - `src/app/g/[slug]/join/JoinForm.tsx`

Feature routes:

- Matches:
  - `src/app/matches/page.tsx` — list.
  - `src/app/matches/[id]/page.tsx` — detail.
  - `src/app/matches/new/page.tsx` — create.
  - `src/app/matches/new/actions.ts` — server action that writes match + related entities.
  - `src/app/matches/new/prediction-actions.ts` — server helpers for prediction.

- Players:
  - `src/app/players/page.tsx`
  - `src/app/players/actions.ts`

- Pairs:
  - `src/app/pairs/page.tsx`

Route-level server actions:

- `src/app/actions.ts` — app-wide server actions (e.g. `createGroup`).
- `src/app/tournament-actions.ts` — tournament actions.

API routes (Route Handlers):

- `src/app/api/partnerships/route.ts` — JSON endpoint.

### UI components (`src/components/`)

Shared React components used by pages.

- Layout/navigation:
  - `src/components/AppShell.tsx` — shared page shell for group routes.
  - `src/components/NavBar.tsx` — navigation.
  - `src/components/QuickActionsFAB.tsx` — floating quick actions.

- Domain/feature components:
  - Match UI: `src/components/MatchCard.tsx`, `src/components/NewMatchForm.tsx`, `src/components/MatchPredictionBanner.tsx`, `src/components/MatchFiltersButton.tsx`.
  - Stats/rankings: `src/components/CurrentRankingsTable.tsx`, `src/components/RankingSidebar.tsx`, `src/components/TradingViewChart.tsx`, `src/components/TradingViewRankingLayout.tsx`.
  - Players: `src/components/PlayerDirectory.tsx`, `src/components/PlayerStatsDashboard.tsx`, `src/components/ComparePlayersDialog.tsx`.
  - Partnerships: `src/components/PartnershipCard.tsx`, `src/components/PlayerPartnerships.tsx`.
  - Achievements: `src/components/AchievementBadge.tsx`, `src/components/AchievementUnlockModal.tsx`, `src/components/AchievementsSection.tsx`.
  - Venues/rackets: `src/components/VenueCard.tsx`, `src/components/RacketCard.tsx`, `src/components/RacketForm.tsx`, `src/components/RacketComparisonModal.tsx`.

- Minimal UI primitives:
  - `src/components/ui/` (example: `src/components/ui/button.tsx`).

**Rule:** Put reusable UI here. If a component is only used by one route and tightly coupled to it, colocate it under the route segment (as done in `src/app/g/[slug]/(protected)/NextMatchCardClient.tsx`).

### Domain/business logic + data (`src/lib/`)

- Data access:
  - `src/lib/data.ts` — legacy monolithic data module (includes demo-mode mocks and many query functions).
  - `src/lib/data/` — domain-split data modules:
    - `src/lib/data/groups.ts`
    - `src/lib/data/matches.ts`
    - `src/lib/data/index.ts` — barrel exports (preferred import surface for modularized data).
  - `src/lib/data-actions.ts` — server-side mutation helpers (shared actions).

- Supabase integration:
  - `src/lib/supabase/server.ts` — create server client (cookies-based).
  - `src/lib/supabase/client.ts` — create browser client.
  - `src/lib/supabase/achievements.ts` — achievement-related helpers.

- Other domain modules:
  - Partnerships: `src/lib/partnership-data.ts`, `src/lib/partnership-types.ts`.
  - ELO utilities: `src/lib/elo-utils.ts`.
  - Streaks: `src/lib/streaks.ts`, `src/lib/streaks-group.ts`, `src/lib/streaks-actions.ts`.
  - Venues: `src/lib/venue-data.ts`, `src/lib/venue-types.ts`, `src/lib/venue-actions.ts`.
  - Rackets: `src/lib/racket-data.ts`, `src/lib/racket-types.ts`, `src/lib/racket-actions.ts`.
  - Tournaments: `src/lib/tournament-data.ts`, `src/lib/tournament-types.ts`.
  - Period/date helpers: `src/lib/period.ts`.
  - General utilities: `src/lib/utils.ts`.

**Rule:**
- Put **read/query** functions in `src/lib/data/<domain>.ts` and export from `src/lib/data/index.ts`.
- Put **write/mutation** functions in server actions (either route-local `src/app/<route>/actions.ts` or domain action modules like `src/lib/venue-actions.ts`).

### Middleware (`src/middleware.ts`)

- `src/middleware.ts` — request middleware that ensures an anonymous Supabase session when env vars exist.

## Where to add new code (prescriptive)

- **New page/route:** add under `src/app/<route>/page.tsx` (and `layout.tsx` if needed).
- **New server action for a route:** colocate at `src/app/<route>/actions.ts` (use `"use server"`).
- **New JSON endpoint:** add a Route Handler at `src/app/api/<name>/route.ts`.
- **New shared component:** add to `src/components/<ComponentName>.tsx`.
- **New small UI primitive:** add to `src/components/ui/<name>.tsx`.
- **New data read:** add to `src/lib/data/<domain>.ts` and export from `src/lib/data/index.ts`.
- **New domain mutation helper:** add to `src/lib/<domain>-actions.ts`.
- **New DB schema/view/RPC/RLS:** add a migration under `supabase/migrations/<timestamp>_<name>.sql`.

## Notable non-source directories

- `.next/` — Next.js build output (generated).
- `node_modules/` — dependencies (generated).
- `.planning/` — generated planning/codebase docs for GSD workflow.
