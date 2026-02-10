# Social Tournament Manager

**Status:** IMPLEMENTED ✅  
**Commit:** 6d445c1  
**Date:** 2026-01-30

## Implementation Summary
- ✅ Database schema with 5 new tables (tournaments, participants, rounds, matches, standings)
- ✅ RLS policies for security
- ✅ RPC functions for tournament CRUD operations
- ✅ Americano format partner rotation algorithm
- ✅ TypeScript types and data fetching utilities
- ✅ Server actions for tournament management

**Note:** UI components (Phase 6.3-6.4) not yet implemented - backend API is ready.

## Summary
A flexible tournament system for padel groups to organize and manage social tournaments, starting with the Americano format (rotating partners, individual scoring). This enables groups to host structured social events with automatic match pairings, partner rotation, and individual standings.

## Background
The Americano tournament format is highly popular in the padel community:
- Partners rotate after each round
- Players score individually (not as fixed teams)
- Everyone plays with and against different participants
- Great for social interaction and inclusivity

Current Padelapp only supports individual matches. Adding tournament management would:
1. Enable groups to host social events
2. Reduce manual pairing work for organizers
3. Track individual tournament standings
4. Provide a competitive but social experience

## User Stories

### As a group organizer, I want to:
- Create a tournament and select the format (Americano, Round Robin, Bracket)
- Set tournament rules (scoring system, court count, time slots)
- Add or remove participants before the tournament starts
- See the full match schedule with partner assignments
- Track individual standings in real-time
- End the tournament and see final rankings

### As a player, I want to:
- See the tournament schedule and know my partners/opponents each round
- View my individual points and ranking
- See who's leading the tournament
- Get notifications when the tournament starts and matches are scheduled

## Core Features

### 1. Tournament Creation
- UI: `/g/[slug]/tournaments/new`
- Fields:
  - Tournament name
  - Format: Americano (v1), Round Robin (future), Bracket (future)
  - Start date/time
  - Court count (affects how many matches run in parallel)
  - Scoring system: Standard (21 pts for win, 0 for loss) or Custom
  - Participants: Select from group members
- Auto-generate match schedule based on format and participants
- Validate minimum participants (4 for Americano)

### 2. Americano Format (v1)
- Partner rotation: Each round, partners change according to algorithm
- Individual scoring: Points awarded to individual players, not fixed teams
- Schedule generation: Each player partners with different opponents across rounds
- Algorithm ensures balanced pairings (everyone plays with everyone if possible)

### 3. Tournament Dashboard
- UI: `/g/[slug]/tournaments/[id]`
- Display:
  - Tournament name, format, status (Upcoming, In Progress, Completed)
  - Current standings: Player rankings with points
  - Match schedule by round (Partner A + Partner B vs Opponent C + Opponent D)
  - Court assignments if multiple courts
- Actions:
  - Mark matches as complete (with scores)
  - Recalculate standings
  - End tournament / Generate final report

### 4. Match Management
- Integrate with existing match system
- Tournament matches link back to tournament for context
- Auto-populate teams based on tournament schedule
- Support score entry per match
- Auto-update individual standings based on match results

### 5. Standings & Rankings
- Real-time ranking update after each match
- Points breakdown per player (wins/losses per round)
- Tiebreaker support if needed

## Technical Approach

### Database Schema
```
tournaments
  - id
  - group_id (FK)
  - name
  - format (enum: americano, round_robin, bracket)
  - status (enum: upcoming, in_progress, completed)
  - start_date
  - scoring_system (enum: standard_21, custom)
  - court_count
  - created_at
  - created_by (FK to players)

tournament_participants
  - id
  - tournament_id (FK)
  - player_id (FK)
  - seed_position

tournament_rounds
  - id
  - tournament_id (FK)
  - round_number
  - scheduled_time

tournament_matches
  - id
  - tournament_id (FK)
  - round_id (FK)
  - match_id (FK to existing matches)
  - court_number
  - status (scheduled, in_progress, completed)

tournament_standings
  - id
  - tournament_id (FK)
  - player_id (FK)
  - points
  - wins
  - losses
  - rank
```

### Partner Rotation Algorithm (Americano)
1. Generate all unique pairings
2. Schedule rounds ensuring:
   - No player plays twice in the same round
   - Partners rotate fairly
   - Everyone plays with as many different partners as possible
3. Example for 6 players:
   - Round 1: (A+B) vs (C+D), (E+F) sit out
   - Round 2: (A+C) vs (E+F), (B+D) sit out
   - Continue until all combinations covered

### Integration with Existing System
- Leverage `matches`, `match_teams`, `match_team_players` tables
- Reuse ELO and stats tracking where applicable
- Tournament-specific views for standings and schedules

## Acceptance Criteria

### v1 - Americano Format
- [ ] Organizer can create an Americano tournament
- [ ] System validates minimum 4 participants
- [ ] Tournament schedule auto-generates with partner rotations
- [ ] Dashboard shows standings, schedule, and round breakdown
- [ ] Matches link to existing match system for score entry
- [ ] Standings update automatically when matches complete
- [ ] Tournament can be ended with final rankings displayed
- [ ] Tournaments scoped to group (same RLS as other features)

### UI Requirements
- [ ] Tournament creation page with form fields
- [ ] Tournament dashboard with tabs (Schedule, Standings, Details)
- [ ] Match cards showing partner assignments
- [ ] Standings table with player rankings and points
- [ ] Mobile-responsive design (padel players use phones courtside)

### Edge Cases
- [ ] Odd number of participants: handle "sit out" rounds fairly
- [ ] Last-minute participant additions: allow schedule regeneration
- [ ] Match cancellations: allow rescheduling within tournament
- [ ] Ties in standings: configurable tiebreaker rules

## Future Enhancements (Not v1)
- Round Robin format (fixed teams play all opponents)
- Bracket format (elimination tournament)
- Mixed gender formats (PadelMix style)
- Handicap system for uneven skill levels
- Tournament templates and presets
- Export tournament results to PDF/CSV
- Invite participants from outside the group
- Tournament history and analytics

## Design Notes
- Keep tournament management optional - don't disrupt existing match flow
- Tournament matches are just regular matches with extra metadata
- Standings should be simple and transparent (points, wins, losses)
- Focus on social/fun aspect, not hardcore competitive complexity
