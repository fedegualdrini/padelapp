# Padel App (Supabase)

> Multi-group padel tracker with group-scoped data, ELO rankings, and passphrase-based access.

## Quick Start

```bash
npm install
npm run dev
```

## Project Overview

Padel App is a multi-group padel tracker built on Next.js (App Router) with Supabase.
It uses anonymous auth with passphrase-based group access and strict RLS for data isolation.

Key characteristics:
- Anonymous authentication (no email/password accounts)
- Passphrase-based group access with bcrypt hashing
- Row-Level Security (RLS) for data isolation between groups
- Group-scoped routing pattern: `/g/[slug]/*`

## Features

- Group-scoped matches, players, pairs, stats, and ELO
- Join flow at `/g/[slug]/join`
- Public group listing on `/` (names and slugs only)
- Materialized stats views and ELO recomputation helpers
- Supabase SSR auth cookies via `@supabase/ssr`
- Middleware ensures an anonymous session

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Supabase (Postgres, RLS, anonymous auth)
- Tailwind CSS v4 + `next-themes`

## Local Development

```bash
npm run dev      # Dev server
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint
```

## Database

Apply migrations:
```bash
supabase db reset
```

Apply pending migrations only:
```bash
supabase db push
```

Seed data:
```bash
supabase db reset
```

Or manually:
```bash
supabase db query < supabase/seed.sql
```

## Data Model Notes

Core tables:
- `groups`, `group_members`
- `players`, `matches`, `match_teams`, `match_team_players`
- `sets`, `set_scores`
- `player_elo`, `pair_stats` (materialized view)

Helpers:
```sql
select refresh_stats_views();
select recompute_all_elo();
```

## Routes

```
/                           # Home: group listing + creation
/g/[slug]/                  # Group dashboard (requires membership)
/g/[slug]/join              # Join group with passphrase
/g/[slug]/matches           # Match listing
/g/[slug]/matches/new       # Create match
/g/[slug]/matches/[id]/edit # Edit match
/g/[slug]/players           # Player listing
/g/[slug]/pairs             # Pair statistics
```

## Environment

Create `.env.local` in the repo root:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Supabase setup checklist:
- Enable Anonymous Auth (Dashboard -> Auth -> Providers -> Anonymous)
- Ensure `pgcrypto` is available (`create extension if not exists pgcrypto;`)
- Run migrations in order (or `supabase db reset`)

## AI Agent Skills

Repository skills live under `skills/` and are registered in `AGENTS.md`.

| Skill | Description | File |
|-------|-------------|------|
| `nextjs-16` | App Router patterns for this repo | `skills/nextjs/SKILL.md` |
| `react-19` | Client component and UI interaction patterns | `skills/react/SKILL.md` |
| `supabase-rls` | Supabase auth, RLS, and data access conventions | `skills/supabase/SKILL.md` |
| `tailwind-4` | Tailwind CSS v4 styling conventions | `skills/tailwind/SKILL.md` |
| `skill-creator` | Create new skills following the Agent Skills spec | `skills/skill-creator/SKILL.md` |
| `agent-usage-reporting` | Report agent + skills used at end of every response | `skills/agent-usage-reporting/SKILL.md` |
| `skill-sync` | Sync skill metadata to AGENTS auto-invoke tables | `skills/skill-sync/SKILL.md` |
| `vercel-deploy` | Deploy apps to Vercel with preview + claimable links | `C:/Users/Fede/.codex/skills/vercel-deploy-claimable/SKILL.md` |
| `vercel-react-best-practices` | React/Next.js performance optimization guidelines | `C:/Users/Fede/.codex/skills/react-best-practices/SKILL.md` |
| `web-design-guidelines` | Review UI code for Web Interface Guidelines compliance | `C:/Users/Fede/.codex/skills/web-design-guidelines/SKILL.md` |
| `skill-installer` | Install Codex skills from curated list or repo | `C:/Users/Fede/.codex/skills/.system/skill-installer/SKILL.md` |

### How skills are discovered
1. The assistant checks `AGENTS.md` for the registered skills.
2. It matches the task context (routing, UI, DB, styling, etc.) to a skill.
3. It reads the matching `skills/{name}/SKILL.md` file(s) before editing code.
4. If multiple contexts apply, it loads multiple skills (e.g., React + Tailwind).

## Vercel

Set these environment variables in Vercel (Production + Preview):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
