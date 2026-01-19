# Padel Tracker

A multi-group padel tracker built with Next.js + Supabase. Track matches, players, pairs, and ELO ratings per group with passphrase-based access (no email/password needed).

## Highlights
- **Multi-group** data isolation (matches, players, pairs, stats, ELO).
- **Passphrase access** per group (`/g/{slug}/join`).
- **Anonymous auth + RLS**: membership-based policies for all group tables.
- **Stats & rankings**: materialized views for players and pairs + ELO leaderboard.
- **Fast SSR** with Supabase cookies via `@supabase/ssr`.

## Live Pages
- **Home**: list groups and access links
- **Group join**: `/g/{slug}/join`
- **Dashboard**: `/g/{slug}`
- **Matches**: `/g/{slug}/matches`
- **New match**: `/g/{slug}/matches/new`
- **Players**: `/g/{slug}/players`
- **Pairs**: `/g/{slug}/pairs`

## Tech Stack
- **Next.js 16** (App Router, Turbopack)
- **Supabase** (Postgres, Auth, RLS)
- **TypeScript**
- **Tailwind CSS** (utility classes with custom theme tokens)

## Core Data Model
- **groups**: one group per community
- **group_members**: membership based on passphrase join
- **players**: `usual` + `invite`
- **matches**, **match_teams**, **match_team_players**, **sets**, **set_scores**
- **elo_ratings**: per match snapshot
- **audit_log**: change tracking via triggers

## Access & Security
- Each group has a **passphrase hash** stored in DB.
- Joining inserts a row into **group_members**.
- RLS policies gate access to all group-scoped tables.
- Anonymous auth sessions are created for users without accounts.

## Stats Pipeline
- **mv_player_stats**: wins/losses/win rate per player
- **mv_pair_stats** and **mv_pair_aggregates**: pair chemistry
- Refresh with `refresh_stats_views()` when needed.

## Local Development

### 1) Install
```bash
npm install
```

### 2) Environment
Create `.env.local` at repo root:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3) Supabase Migrations
```bash
supabase db reset
```
Or:
```bash
supabase db push
```

### 4) Seed
```bash
supabase db reset
```
Or:
```bash
supabase db query < supabase/seed.sql
```

### 5) Run
```bash
npm run dev
```

## Deployment (Vercel)
Set the same env vars in **Production** and **Preview**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Repo Structure (Key Folders)
```
src/
  app/            Next.js app routes
  components/     UI components
  lib/            Supabase helpers + data access
supabase/
  migrations/     DB migrations
  seed.sql        Seed data
```

## Notable Migrations
- `20260118_000001_init.sql` base schema
- `20260118_000004_groups_slug.sql` group slugs
- `20260118_000005_group_auth.sql` passphrase + membership + RLS
- `20260118_000006_groups_public_select.sql` public group list
- `20260119_000006_audit_log_policy.sql` audit log insert policy

## Common Tasks
- **Refresh stats views**:
  - `select refresh_stats_views();`
- **Recompute ELO**:
  - `select recompute_all_elo();`

## Troubleshooting
- **No pairs showing**: ensure the match has a winner (complete sets) and refresh materialized views.
- **RLS errors on insert**: verify the user is a group member and the audit log policy exists.
- **Missing data after match**: run `refresh_stats_views()`.

## Repo Notes
- Internal docs live in `/docs`.

---

Questions or ideas? Open an issue or ping me with the feature you want next.
