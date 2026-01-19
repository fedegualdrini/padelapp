# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-group padel tennis tracker with group-scoped data, ELO rankings, and match statistics. Built on Next.js 16 (App Router) with Supabase for PostgreSQL backend and authentication.

**Key characteristics:**
- Anonymous authentication (no email/password accounts)
- Passphrase-based group access with bcrypt hashing
- Row-Level Security (RLS) for data isolation between groups
- Group-scoped routing pattern: `/g/[slug]/*`

## Development Commands

### Local Development
```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint checks
npm start            # Production server
```

### Database Management
```bash
supabase db reset    # Run all migrations + seed data
supabase db push     # Apply pending migrations only
```

**Seed data:** Default group with slug `padel` and passphrase `padel`.

## Architecture Patterns

### Multi-Group Data Isolation

All data is scoped to groups via `group_id` foreign keys. Access control is enforced through:

1. **Membership table** (`group_members`): Links anonymous Supabase users to groups
2. **RLS policies**: All queries filtered by `group_id` based on membership
3. **Join flow**: Users join groups via `/g/[slug]/join` with passphrase verification

**Important:** When creating queries for group-scoped data (players, matches, pairs, stats), always filter by `group_id` and rely on RLS to enforce access.

### Supabase SSR Pattern

**Server Components:**
```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabase = await createSupabaseServerClient();
const { data } = await supabase.from("players").select("*");
```

**Client Components:**
```typescript
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();
```

**Middleware:** (`src/middleware.ts`) Ensures anonymous session exists on every request. Runs before all routes except static assets.

### Data Layer Organization

**Primary data access:** `src/lib/data.ts` (713 lines)
- Contains typed query functions for all entities
- Returns typed objects with joined relations
- Example: `getMatches(groupId)`, `getPlayers(groupId)`, `getPairStats(groupId)`

**Pattern:** Server Components call data layer functions → data layer uses server Supabase client → RLS enforces access.

### Routing Structure

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

**Layout pattern:**
- `src/app/layout.tsx`: Root layout with theme provider
- `src/app/g/[slug]/layout.tsx`: Group layout wrapper (verifies membership)

### Component Patterns

**Server vs Client Components:**
- **Server** (default): Data fetching, layouts, static content
- **Client** (`"use client"`): Forms, interactive UI, theme toggles

**Key components:**
- `AppShell.tsx`: Main layout wrapper with navigation
- `NavBar.tsx`: Client component for navigation menu
- `NewMatchForm.tsx`: Match creation form (11.5 KB, complex state management)
- `MatchCard.tsx`: Match display with set scores

## Database Patterns

### Schema Overview

**Core tables:**
- `groups`: Group definitions (name, slug, passphrase hash)
- `group_members`: User-to-group membership (for RLS)
- `players`: Player profiles (group-scoped)
- `matches`: Match records (group-scoped)
- `match_teams`: Team associations (team 1 vs team 2)
- `match_team_players`: Player-to-team assignments
- `sets`: Individual set data
- `set_scores`: Game scores per set
- `player_elo`: ELO rankings per player
- `pair_stats`: Materialized view of pair statistics

### Database Helper Functions

**Refresh statistics:**
```sql
select refresh_stats_views();
```
Refreshes materialized views for pair stats.

**Recompute ELO ratings:**
```sql
select recompute_all_elo();
```
Rebuilds ELO ratings across all matches (use after data corrections).

### Passphrase Authentication

Groups use bcrypt password hashing via `pgcrypto` extension:

```sql
select create_group_with_passphrase('Group Name', 'group-slug', 'passphrase123');
```

This function:
1. Creates the group with hashed passphrase
2. Adds creating user to `group_members`
3. Returns the group record

**Verification:** Join flow in `src/app/g/[slug]/join` calls RPC function to verify passphrase and add membership.

### RLS Policy Pattern

All group-scoped tables have policies like:
```sql
create policy "Members can select" on players
  for select using (
    exists (
      select 1 from group_members
      where group_members.group_id = players.group_id
      and group_members.user_id = auth.uid()
    )
  );
```

**Public access:** Only `groups` table allows public `SELECT` (for listing groups on home page).

## Key Conventions

### TypeScript Patterns
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Type definitions in same file as queries (`src/lib/data.ts`)

### Match Data Structure
- Best-of-3 or best-of-5 sets
- Each match has 2 teams (team_number: 1 or 2)
- Each team has 2 players (doubles format)
- Sets tracked with game scores (e.g., 6-4, 7-5)

### Player Status
- `usual`: Regular group member
- `invite`: Guest player (can be assigned to matches)

### Styling
- Tailwind CSS 4 with custom CSS variables
- Theme support: `dark` and `light` modes via `next-themes`
- Fonts: Fraunces (display), Space Grotesk (sans-serif)

## Environment Setup

Required `.env.local` variables:
```
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Supabase requirements:**
- Anonymous Auth enabled (Dashboard → Auth → Providers → Anonymous)
- `pgcrypto` extension enabled
- Migrations applied in order

## Migration Files

Located in `supabase/migrations/`:
- `20260118_000001_init.sql`: Base schema (tables, enums)
- `20260118_000002_rls.sql`: RLS policies
- `20260118_000003_elo_margin.sql`: ELO calculation with margin
- `20260118_000004_groups_slug.sql`: Add slug field to groups
- `20260118_000005_group_auth.sql`: Passphrase + membership + RLS
- `20260118_000006_groups_public_select.sql`: Public group listing

Apply sequentially or use `supabase db reset` to apply all at once.
