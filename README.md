# Padel App (Supabase)

## What it does
- Multi-group padel tracker with group-scoped data (matches, players, pairs, stats, ELO).
- Passphrase-based access per group (no email/password accounts).
- Anonymous Supabase Auth + membership table for real RLS isolation.
- Join flow at `/g/{slug}/join`.
- Group listing on home with join link.
- Materialized stats views + ELO recomputation helpers.

## Features & changes (current)
- Group passphrase hashing in DB (bcrypt via pgcrypto).
- `group_members` table with membership-based RLS across all group tables.
- Public group listing (names/slugs only), protected stats/actions.
- Supabase SSR auth cookies via `@supabase/ssr`.
- Middleware ensures anonymous session.
- Pair stats now include `group_id` and are filtered by group.

## Migrations
Apply migrations with the Supabase CLI:

```bash
supabase db reset
```

Or apply the initial migration manually:

```bash
supabase db push
```

## Seed Data
Load the seed file:

```bash
supabase db reset
```

Or apply the seed script manually:

```bash
supabase db query < supabase/seed.sql
```

## Notes
- Migrations live in `supabase/migrations/`:
  - `20260118_000001_init.sql` base schema
  - `20260118_000004_groups_slug.sql` group slugs
  - `20260118_000005_group_auth.sql` passphrase + membership + RLS
  - `20260118_000006_groups_public_select.sql` public group list
- Seed file: `supabase/seed.sql` (default group slug `padel`, passphrase `padel`).
- `refresh_stats_views()` refreshes materialized stats views.
- `recompute_all_elo()` rebuilds ELO ratings across all matches.

## Supabase Environment
Create a `.env.local` file in the repo root with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase setup checklist
- Enable **Anonymous Auth** (Dashboard ? Auth ? Providers ? Anonymous).
- Ensure `pgcrypto` is available (`create extension if not exists pgcrypto;`).
- Run migrations in order (or `supabase db reset`).

## Vercel
Set these Environment Variables in Vercel (Production + Preview):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
