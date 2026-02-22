# Padel App AI Agent Guidelines

> **Single Source of Truth** - This file is the master for all AI assistants working in this repo.

This repository is a multi-group padel tracker built on Next.js (App Router) with Supabase.
It uses anonymous auth with passphrase-based group access and strict RLS for data isolation.

## Quick Start

When working on this project, review `README.md` and `CLAUDE.md` for full architecture and
database guidance. Use the commands below to run or verify changes.

## Available Skills

Repository skills live under `skills/`:

| Skill | Description | File |
|-------|-------------|------|
| `nextjs-16` | App Router patterns for this repo | `skills/nextjs/SKILL.md` |
| `react-19` | Client component and UI interaction patterns | `skills/react/SKILL.md` |
| `supabase-rls` | Supabase auth, RLS, and data access conventions | `skills/supabase/SKILL.md` |
| `tailwind-4` | Tailwind CSS v4 styling conventions | `skills/tailwind/SKILL.md` |
| `skill-creator` | Create new skills following the Agent Skills spec | `skills/skill-creator/SKILL.md` |
| `agent-usage-reporting` | Report agent + skills used at end of every response | `skills/agent-usage-reporting/SKILL.md` |
| `skill-sync` | Sync skill metadata to AGENTS auto-invoke tables | `skills/skill-sync/SKILL.md` |

## Auto-invoke Skills

When performing these actions, invoke the corresponding skill first:

| Action | Invoke First | Why |
|--------|--------------|-----|
| Editing routes, layouts, middleware, or data fetching | `nextjs-16` | App Router conventions |
| Working on interactive UI or client components | `react-19` | Client component patterns |
| Changing DB schema, RLS, or Supabase queries | `supabase-rls` | Auth + RLS enforcement |
| Editing styles or layout classes | `tailwind-4` | Tailwind v4 conventions |
| Creating a new skill or agent instruction | `skill-creator` | Skill structure and checklist |
| Any user request (always) | `agent-usage-reporting` | Consistent skill/agent usage disclosure |
| Regenerating auto-invoke tables for skills | `skill-sync` | Keep AGENTS.md auto-invoke sections in sync |

## Agent roles and skills

When working as a specialized padel agent (Chris, Jordan, Taylor, Maya, Sam), invoke these skills for your role. See `IDENTITY.md` to confirm your role, and `docs/education/SKILLS_MATRIX.md` for quickstarts.

| Agent | Role | Skills to use |
|-------|------|---------------|
| **Chris** | Database + Performance | `supabase-rls`, `supabase-optimization`, `nextjs-16`, `pr-reviewer` |
| **Jordan** | Frontend + Mobile | `react-19`, `tailwind-4`, `nextjs-16`, `ui-ux-pro-max`, `accessibility`, `pr-reviewer` |
| **Taylor** | QA + E2E Tests | `playwright-browser-automation`, `nextjs-16`, `pr-reviewer` |
| **Maya** | UX Lead | `ui-ux-pro-max`, `accessibility` |
| **Sam** | Growth + Analytics | `nextjs-16`, `react-19` (analytics hooks); growth/retention specs per ROADMAP |

## How skills are discovered

1. The assistant checks this file for registered skills.
2. It matches the task context (routing, UI, DB, styling, etc.) to a skill.
3. It reads the matching `skills/{name}/SKILL.md` file(s) before editing code.
4. If multiple contexts apply, it loads multiple skills (e.g., React + Tailwind).
5. If working as a padel agent, also use the skills listed for your role in the table above.

## ⚠️ Pre-Push Validation (MANDATORY)

Before pushing ANY code changes to a PR branch, you MUST run these checks:

1. **Fetch and merge latest base branch:**
   ```bash
   git fetch origin claudio
   git merge origin/claudio
   ```
   If there are conflicts, RESOLVE THEM before proceeding.

2. **Run linting:**
   ```bash
   npm run lint
   ```
   Fix ALL errors before pushing. Warnings are acceptable.

3. **Run TypeScript check:**
   ```bash
   npx tsc --noEmit
   ```
   Fix ALL type errors before pushing.

4. **Commit and push only after all checks pass.**

If you skip these checks, your PR will fail CI and waste human time fixing it.

## Key Commands

```bash
npm run dev      # Dev server
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint
```

### Database
```bash
supabase db reset    # Migrations + seed
supabase db push     # Apply pending migrations
```

## Project Overview

- Multi-group padel tracker with group-scoped data (matches, players, pairs, stats, ELO)
- Passphrase-based access per group (no email/password accounts)
- Anonymous Supabase Auth + `group_members` for membership-based RLS
- Group join flow at `/g/[slug]/join`
- Public group listing on `/` (names + slugs only)
- Materialized stats views + ELO recomputation helpers

## Architecture and Data Access

### Group scoping and RLS
All group data is scoped by `group_id`. Access is enforced through:
1. `group_members` table (links anonymous user to group)
2. RLS policies on group-scoped tables
3. Join RPC verifies passphrase and grants membership

### Supabase clients
Server components use:
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

Client components use:
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

Middleware (`src/middleware.ts`) ensures an anonymous session for every request.

### Data layer
Primary data access is centralized in `src/lib/data.ts`.
Keep new queries and mutations in this file and return typed results.

## Routing

```
/                       # Home: group listing + creation
/g/[slug]/              # Group dashboard (requires membership)
/g/[slug]/join          # Join group with passphrase
/g/[slug]/matches       # Match listing
/g/[slug]/matches/new   # Create match
/g/[slug]/matches/[id]/edit
/g/[slug]/players       # Player listing
/g/[slug]/pairs         # Pair statistics
```

## Conventions

- Prefer Server Components for data fetches; use Client Components for interactivity.
- Always pass `group_id` for reads/writes on group-scoped tables.
- Do not use Supabase service keys in app code; rely on RLS.
- Keep RLS logic in SQL migrations under `supabase/migrations/`.

## Database Helpers

```sql
select refresh_stats_views();
select recompute_all_elo();
```

Use these after significant data changes or corrections.

## Environment Setup

Create `.env.local` in the repo root:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Supabase requirements:
- Anonymous auth enabled
- `pgcrypto` extension enabled
- Migrations applied in order (or `supabase db reset`)

## When Changing Data Logic

If you add or change tables or policies:
1. Add a new migration in `supabase/migrations/`.
2. Update data access in `src/lib/data.ts`.
3. Consider whether `pair_stats` refresh or ELO recompute is needed.

## Testing and Validation

There are no automated tests currently; rely on:
- `npm run lint`
- Manual verification of group creation, join flow, and match CRUD.
