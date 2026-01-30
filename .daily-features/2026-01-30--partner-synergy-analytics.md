# Partner Synergy Analytics

## Summary
Analyze and display which player pairs have the best chemistry when playing together on the same team. Calculate partnership metrics including win rate, average ELO change when paired, and common opponents beaten. Help groups make informed decisions about player rotations and team formation.

## Background
In padel, pairing chemistry matters significantly. Some players work exceptionally well together regardless of their individual ELO ratings, while others struggle to find rhythm even with similar skill levels. Current features like "Head-to-Head Player Comparison" show how players compete *against* each other, but there's no way to see how well players perform *together* as partners.

## Goals
- Calculate partnership metrics for all player pairs that have played together
- Display top-performing and underperforming partnerships
- Help users make informed decisions about team formation and player rotations
- Provide insights into partnership dynamics beyond individual ELO ratings

## Scope
**In scope:**
- Partnership discovery: identify all player pairs that have played together on the same team
- Partnership metrics:
  - Total matches played together
  - Win/loss record and win rate
  - Average ELO rating change when paired (vs. individual average)
  - Common opponents beaten (and lost to)
- Partnership views:
  - Player profile view: show best and worst partners for a player
  - Partnership leaderboard: rank all pairs by synergy score
  - Partnership detail view: show match history together, performance trends

**Out of scope:**
- Partnership suggestions/recommendations (future enhancement)
- Opposition analysis (how a pair performs against specific opponents - can be derived from existing match history)
- Historical partnership tracking for former players who left the group
- Partnership decay (how synergy changes over time without playing together)

## Data Model Changes
No schema changes required. Use existing tables:
- `match_teams`, `match_team_players`: identify player pairs
- `matches`, `sets`, `set_scores`: determine match outcomes
- `elo_ratings`: calculate ELO changes when paired

## API Endpoints

### GET /api/partnerships
List all partnerships with summary metrics.

**Query params:**
- `player_id` (optional): filter partnerships for a specific player
- `min_matches` (optional): minimum matches played together (default: 3)
- `sort_by` (optional): sort by field (`win_rate`, `matches_played`, `elo_change_delta`)
- `limit` (optional): pagination

**Response:**
```typescript
{
  partnerships: [
    {
      player1_id: uuid,
      player2_id: uuid,
      player1_name: string,
      player2_name: string,
      matches_played: number,
      wins: number,
      losses: number,
      win_rate: number,
      avg_elo_change_when_paired: number,
      avg_individual_elo_change: number,
      elo_change_delta: number,
      common_opponents_beaten: number,
      last_played_together: timestamptz
    }
  ],
  total: number
}
```

### GET /api/partnerships/:player_id/best-partners
Get top N and bottom N partners for a specific player.

**Response:**
```typescript
{
  player_id: uuid,
  player_name: string,
  best_partners: PartnershipSummary[],  // sorted by synergy score descending
  worst_partners: PartnershipSummary[],  // sorted by synergy score ascending
  total_partnerships: number
}
```

### GET /api/partnerships/:player1_id/:player2_id
Get detailed partnership statistics and match history.

**Response:**
```typescript
{
  player1: { id: uuid, name: string, current_elo: number },
  player2: { id: uuid, name: string, current_elo: number },
  partnership: {
    matches_played: number,
    wins: number,
    losses: number,
    win_rate: number,
    avg_elo_change_when_paired: number,
    avg_individual_elo_change: number,
    elo_change_delta: number,
    first_played_together: timestamptz,
    last_played_together: timestamptz
  },
  match_history: [
    {
      match_id: uuid,
      played_at: timestamptz,
      team: number,  // 1 or 2
      opponent_team_players: [{ id: uuid, name: string }],
      result: 'win' | 'loss',
      score_summary: string,  // e.g., "6-4, 6-3"
      elo_change_player1: number,
      elo_change_player2: number
    }
  ]
}
```

## Synergy Score Formula
Calculate a composite synergy score for each partnership:

```
synergy_score = (win_rate * 0.5) + (normalized_elo_delta * 0.3) + (opponent_quality_factor * 0.2)

Where:
- win_rate: wins / matches_played (0 to 1)
- normalized_elo_delta: (avg_elo_when_paired - avg_individual_elo) / 100, clamped [-1, 1]
- opponent_quality_factor: weighted by average opponent ELO (higher opponents = higher factor)
```

This gives:
- Primary weight to actual win rate
- Secondary weight to whether players perform better together than individually
- Tertiary weight to quality of opponents beaten

## Frontend Components

### `PartnershipLeaderboard` (page: /partnerships)
Table showing all partnerships sorted by synergy score. Columns:
- Players (names, avatars)
- Matches played (with badge: ≥10 = "Established", ≥5 = "Developing")
- Win/Loss record and win rate
- ELO delta badge (📈 positive, 📉 negative, ➖ neutral)
- Last played together
- Actions: "View Details"

### `PlayerPartnerships` (component on player profile)
Show best and worst partners for a player. Two sections:
- "Great Chemistry" (top 3 partnerships)
- "Room for Improvement" (bottom 3 partnerships, min 3 matches)

### `PartnershipDetail` (page: /partnerships/:player1_id/:player2_id)
Detailed view of a specific partnership:
- Partnership overview card (metrics, synergy score)
- Performance trend chart (win rate over time, ELO changes)
- Match history timeline (list view with scores and opponents)
- Common opponents summary (who they've beaten/lost to together)

### `PartnershipCard` (reusable component)
Compact card showing partnership summary:
- Player names and avatars
- W/L record and win rate (badge colored by tier: >70% = green, 50-70% = yellow, <50% = red)
- Matches played
- Last played

## UI/UX Notes
- Use color coding for win rates: green (>70%), yellow (50-70%), red (<50%)
- Show "minimum matches" threshold badge to indicate reliable data
- Add tooltips explaining metrics (especially ELO delta)
- On player profile, partnership section should be below stats but above match history
- Consider adding "filter" to partnership leaderboard (min matches, player, time range)

## Performance Considerations
- Partnership data can be materialized via a view or materialized view since it's computed from match history
- Recompute partnership stats after each match is recorded
- Cache partnership summaries for leaderboards (5-minute TTL)
- For large groups (100+ players), pagination is essential

## Acceptance Criteria
1. Partnership leaderboard displays all player pairs with min 3 matches played together
2. Partnership leaderboard is sortable by matches played, win rate, and ELO delta
3. Clicking a partnership shows detailed view with match history
4. Player profile shows best/worst partners section (min 3 matches)
5. Partnership detail view shows correct match history with scores and opponents
6. Synergy score is correctly calculated and displayed
7. All partnership stats update correctly after a new match is recorded
8. E2E test covers partnership leaderboard navigation and detail view

## Technical Notes
- Use PostgreSQL window functions to identify player pairs from `match_team_players`
- Materialized view `materialized_partnerships` for efficient querying
- Refresh trigger after match insertion/updates
- TypeScript types for partnership metrics in `types/partnership.ts`
