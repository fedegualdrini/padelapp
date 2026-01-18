# Padel App (Supabase)

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
- The migration file is located at `supabase/migrations/20260118_000001_init.sql`.
- The seed file is `supabase/seed.sql`.
- `refresh_stats_views()` refreshes the materialized stats views.
- `recompute_all_elo()` rebuilds ELO ratings across all matches.

## Supabase Environment
Create a `.env.local` file in the repo root with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
