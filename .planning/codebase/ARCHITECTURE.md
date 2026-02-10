# Architecture (padelapp)

Date: 2026-02-05

## High-level system

- **App type:** Next.js App Router application (server components + client components) under `src/app/`.
- **Backend:** Supabase (Postgres + PostgREST + RPC SQL functions + RLS). DB schema and server-side logic live in `supabase/migrations/*.sql`.
- **Primary domain:** Multi-group padel match tracker (groups → players → matches/sets/ELO/achievements/venues/rackets/tournaments/attendance).

## Runtime boundaries (what runs where)

### Server-only (Node / Next.js server)

- **Server Actions** (`"use server"`) mutate data and redirect:
  - Group creation: `src/app/actions.ts` (`createGroup` → Supabase RPC `create_group_with_passphrase`)
  - Match creation: `src/app/matches/new/actions.ts` (`createMatch` → inserts rows + RPC refresh/achievement/challenge updates)
  - Group join: `src/app/g/[slug]/join/actions.ts` (join flow; used from `src/app/g/[slug]/join/JoinForm.tsx`)
  - Other domain actions live in `src/lib/*-actions.ts` (e.g. `src/lib/racket-actions.ts`, `src/lib/venue-actions.ts`, `src/lib/streaks-actions.ts`).

- **Data fetching for server components** is done via Supabase server client:
  - Legacy monolith: `src/lib/data.ts` (very large; contains demo-mode mocks + many query functions)
  - Modularized data access: `src/lib/data/` with a barrel export `src/lib/data/index.ts` (preferred direction).

- **Supabase server client** uses Next.js cookies to persist auth:
  - `src/lib/supabase/server.ts` (`createSupabaseServerClient`, `hasSupabaseEnv`).

### Client-side (browser)

- Interactive UI components are standard React components under `src/components/`.
- Route-level client components are occasionally embedded in route segments (e.g. `src/app/g/[slug]/(protected)/NextMatchCardClient.tsx`).
- Theme switching is handled client-side via `next-themes` in `src/app/layout.tsx` and `src/components/ThemeToggle.tsx`.

### Edge middleware

- `src/middleware.ts` runs for most routes. When Supabase env vars exist, it:
  - Creates a Supabase SSR client with cookie adapters.
  - Ensures there is a user session by calling `supabase.auth.getUser()` and falling back to `supabase.auth.signInAnonymously()`.

## Routing + page composition

### Route groups and layouts

- Root layout: `src/app/layout.tsx` (global fonts, theme provider, background styling).
- Home page (group picker + setup gate): `src/app/page.tsx`.

- Group-scoped area under `src/app/g/[slug]/`:
  - Protected layout: `src/app/g/[slug]/(protected)/layout.tsx`
    - If env missing and slug is `demo`, it renders a demo shell.
    - If env missing and not demo, it renders a shell without navigation.
    - If env exists, it loads group with `getGroupBySlug` and enforces membership via `isGroupMember`.
  - Protected page: `src/app/g/[slug]/(protected)/page.tsx`.
  - Join flow: `src/app/g/[slug]/join/*`.

### Feature routes

Feature routes live under `src/app/` and/or within group-scoped route trees:

- Matches:
  - List: `src/app/matches/page.tsx`
  - Detail: `src/app/matches/[id]/page.tsx`
  - Create: `src/app/matches/new/page.tsx` + server actions `src/app/matches/new/actions.ts`
  - Prediction helpers: `src/app/matches/new/prediction-actions.ts`

- Players:
  - List: `src/app/players/page.tsx`
  - Server actions: `src/app/players/actions.ts`

- Pairs:
  - `src/app/pairs/page.tsx`

### API routes

- Next.js Route Handlers provide JSON endpoints where needed:
  - Partnerships query endpoint: `src/app/api/partnerships/route.ts` (GET; calls `src/lib/partnership-data.ts` and returns cached response).

## Data access layer

### Supabase client construction

- Server client: `src/lib/supabase/server.ts`.
- Browser client: `src/lib/supabase/client.ts`.
- Shared helpers (SSR patterns): `src/lib/supabase/achievements.ts` (domain helpers built on top of Supabase).

### Query patterns

- Server components and server actions call Supabase directly (no separate repository/service layer).
- Complex reads are often done by querying:
  - Materialized views (e.g. `mv_player_stats_v2`, `mv_pair_aggregates`) and
  - Enriched views to work around PostgREST relationship limitations (documented inline in `src/lib/data.ts`).
- Writes commonly:
  - Insert base rows, then insert child rows (match → match_teams → match_team_players → sets → set_scores), then
  - Call Supabase RPC functions to keep derived stats in sync (e.g. `refresh_stats_views`), and to run domain side-effects (achievements, weekly challenges) as seen in `src/app/matches/new/actions.ts`.

### Module split direction

- Preferred import surface for new code: `src/lib/data/index.ts`.
- Existing code still imports from the monolith `src/lib/data.ts` in places (e.g. `src/app/page.tsx`, `src/app/g/[slug]/(protected)/layout.tsx`).
- If adding new data functions, place them in `src/lib/data/<domain>.ts` and export from `src/lib/data/index.ts`.

## Domain modules (by responsibility)

- **Matches + ELO + stats:** `src/lib/data.ts`, `src/lib/data/matches.ts`, `src/lib/elo-utils.ts`.
- **Groups + membership:** `src/lib/data.ts`, `src/lib/data/groups.ts`.
- **Partnership analytics:** `src/lib/partnership-data.ts`, `src/lib/partnership-types.ts`, API handler `src/app/api/partnerships/route.ts`.
- **Attendance/events:** functions and types in `src/lib/data.ts` (backed by migrations like `supabase/migrations/20260126_000001_attendance_planning.sql`).
- **Achievements + challenges:** UI in `src/components/Achievement*` and DB logic via Supabase RPCs invoked from `src/app/matches/new/actions.ts`.
- **Venues:** `src/lib/venue-data.ts`, `src/lib/venue-types.ts`, `src/lib/venue-actions.ts`, UI via `src/components/VenueCard.tsx`.
- **Rackets:** `src/lib/racket-data.ts`, `src/lib/racket-types.ts`, `src/lib/racket-actions.ts`, UI via `src/components/Racket*`.
- **Tournaments:** `src/lib/tournament-data.ts`, `src/lib/tournament-types.ts`, server actions `src/app/tournament-actions.ts`.
- **Streaks:** `src/lib/streaks.ts`, `src/lib/streaks-group.ts`, `src/lib/streaks-actions.ts`.

## Authorization + tenancy model

- Tenancy is **group-scoped**.
- Identity is established via anonymous Supabase auth in `src/middleware.ts`.
- Membership gating for group pages happens in the protected layout `src/app/g/[slug]/(protected)/layout.tsx` using `isGroupMember`.
- Database-level enforcement is done via RLS policies and RPC functions defined in `supabase/migrations/*.sql` (e.g. group auth, RLS rules).

## UI architecture

- Pages are composed from:
  - Route components in `src/app/**/page.tsx`
  - Shared components in `src/components/`
  - A shared shell layout component `src/components/AppShell.tsx` used by group routes.

- Reusable primitives/components:
  - Minimal UI primitives under `src/components/ui/` (e.g. `src/components/ui/button.tsx`).

## Practical rules for new work (prescriptive)

- Put **routing + layouts** in `src/app/` (App Router).
- Put **server-only writes** in server actions (`"use server"`) either:
  - close to the route (e.g. `src/app/<route>/actions.ts`), or
  - in a domain action module (e.g. `src/lib/<domain>-actions.ts`).
- Put **read/query functions** in `src/lib/data/<domain>.ts` and export via `src/lib/data/index.ts`.
- Prefer enforcing access in both:
  - the **routing layer** (membership checks in layouts), and
  - the **database layer** (Supabase RLS + RPC), with migrations in `supabase/migrations/`.
