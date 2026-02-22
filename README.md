# Padel App (Supabase)

[![CI](https://github.com/fedegualdrini/padelapp/actions/workflows/ci.yml/badge.svg)](https://github.com/fedegualdrini/padelapp/actions/workflows/ci.yml)

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

## Terminology

- **Pairs**: Two players playing together on the same team (preferred terminology)
- **Partnerships**: Used interchangeably with "pairs" in some contexts (materialized views and APIs)

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

### Core Tables
- `groups` - Group profiles
- `group_members` - Anonymous user to group membership
- `group_admins` - Group administration
- `players` - Player profiles within groups

### Match System
- `matches` - Match records with date, best_of format, MVP
- `match_teams` - Teams per match (team 1 and 2)
- `match_team_players` - Players assigned to teams
- `sets` - Sets per match
- `set_scores` - Scores per set (team1_games, team2_games)
- `elo_ratings` - ELO ratings tracked per player per match

### Stats & Analytics
- `v_set_winners` - View: winner of each set
- `v_match_team_set_wins` - View: set wins per team per match
- `v_match_winners` - View: match winners
- `v_player_match_results` - View: player wins/losses per match
- `mv_player_stats` - Materialized view: player win rates
- `mv_pair_stats` - Materialized view: pair match history
- `mv_pair_aggregates` - Materialized view: pair win rates and totals
- `materialized_partnerships` - Materialized view: detailed partnership metrics

### Achievement System
- `achievement_definitions` - Achievement criteria and metadata
- `achievements` - Unlocked achievements per player

### Weekly Challenges & Streaks
- `weekly_challenges` - Weekly challenge targets per group
- `player_weekly_progress` - Player progress on weekly challenges
- `streaks` - Current and longest streak tracking
- `badges` - Badge definitions
- `player_badges` - Earned badges per player
- `group_challenge_settings` - Group-specific challenge settings

### Venue Rating System
- `venues` - Venue profiles (name, address, surface, amenities)
- `venue_ratings` - Multi-dimensional ratings (court_quality, lighting, comfort, amenities, accessibility, atmosphere)
- `venue_rating_helpful_votes` - Helpful votes on reviews
- `venue_comments` - Comments on reviews
- `venue_analytics` - Materialized view: venue statistics and analytics

### Tournament System
- `tournaments` - Tournament definitions (format, status, scoring)
- `tournament_participants` - Players in tournaments
- `tournament_rounds` - Tournament rounds
- `tournament_matches` - Matches within tournaments
- `tournament_standings` - Tournament leaderboards

### Racket Performance Tracker
- `rackets` - Player racket inventory (brand, model, weight, balance)
- `match_rackets` - Links matches to rackets used

### Attendance Planning
- `attendance_planning` - Attendance tracking and planning

### Public Ranking Share
- `public_ranking_shares` - Token-based ranking sharing

### Audit & Tracking
- `audit_log` - Change tracking for audit purposes

### Helpers
```sql
select refresh_stats_views();        -- Refresh player/pair stats materialized views
select recompute_all_elo();          -- Recalculate all ELO ratings
```

## Routes

### Public Routes
```
/                           # Home: group listing + creation
/matches                    # Public match listing
/matches/new                # Create match (public)
/matches/[id]               # View match details (public)
/matches/[id]/edit          # Edit match (public)
/players                    # Public player listing
/pairs                      # Public pair statistics
```

### Group Routes (Require Membership)
```
/g/[slug]/                  # Group dashboard (requires membership)
/g/[slug]/join              # Join group with passphrase
/g/[slug]/ranking-share     # Public ranking share (token-based)
/g/[slug]/ranking-share/[token]  # View shared ranking
```

### Protected Group Routes (Require Authentication + Membership)
```
/g/[slug]/achievements       # Achievement system and leaderboard
/g/[slug]/calendar          # Calendar view for matches and events
/g/[slug]/challenges         # Weekly challenges dashboard
/g/[slug]/events            # Events management
/g/[slug]/labs              # Experimental features / lab
/g/[slug]/matches           # Match listing
/g/[slug]/matches/new       # Create match
/g/[slug]/matches/[id]      # View match details
/g/[slug]/matches/[id]/edit # Edit match
/g/[slug]/pairs             # Pair statistics (materialized view)
/g/[slug]/partnerships      # Partnership statistics and analysis
/g/[slug]/partnerships/[player1Id]           # View player partnerships
/g/[slug]/partnerships/[player1Id]/[player2Id]  # View specific partnership details
/g/[slug]/players           # Player listing
/g/[slug]/players/[id]      # View player profile
/g/[slug]/players/[id]/stats # Player statistics and performance
/g/[slug]/players/[id]/rackets     # Player rackets management
/g/[slug]/players/[id]/rackets/[racketId]  # View/edit racket details
/g/[slug]/players/compare    # Compare multiple players
/g/[slug]/ranking           # ELO ranking and leaderboard
/g/[slug]/venues            # Venue listing and management
/g/[slug]/venues/new        # Create new venue
/g/[slug]/venues/[venueSlug]      # View venue details
/g/[slug]/venues/[venueSlug]/rate  # Rate a venue
```

### API Routes
```
/api/groups                 # Group listing endpoint
/api/groups/[groupId]       # Get group details
/api/groups/[groupId]/skip-week  # Skip weekly challenge week
/api/partnerships           # Partnership statistics endpoint
/api/partnerships/player    # Get player partnerships
/api/partnerships/[player1Id]  # Get partnerships for player
/api/partnerships/[player1Id]/[player2Id]  # Get specific partnership
/api/partnerships/player/best-partners  # Get best partnerships for player
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

### How skills are discovered
1. The assistant checks `AGENTS.md` for the registered skills.
2. It matches the task context (routing, UI, DB, styling, etc.) to a skill.
3. It reads the matching `skills/{name}/SKILL.md` file(s) before editing code.
4. If multiple contexts apply, it loads multiple skills (e.g., React + Tailwind).

## Vercel

Set these environment variables in Vercel (Production + Preview):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
