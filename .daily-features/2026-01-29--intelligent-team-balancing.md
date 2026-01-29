# Feature: Intelligent Team Balancing

**Status:** PROPOSED

## Why
The current team balancing algorithm is a simple "1-4, 2-3" ELO sort. While functional, it ignores critical factors that actually determine match competitiveness:

- **Partner chemistry matters**: Two players may have similar ELOs but terrible chemistry (low win rate together). Conversely, an experienced pair may outperform their individual ELOs.
- **Recent form**: A player on a 5-game win streak is playing differently than when their ELO was calculated.
- **Set performance**: Players who clutch in third sets should be paired strategically.
- **Pair history**: Some pairs consistently over/under-perform their combined ELO.

Players currently ignore the team suggestions and manually adjust because they don't trust the "random" pairings. A smarter algorithm would increase adoption and produce more balanced, competitive matches.

## Scope
Enhance team balancing with multi-factor optimization:

### Core Improvements
- **Partner synergy scoring**: Calculate historical win/loss rates for each pair combination
- **Recent form weighting**: Boost/reduce effective ELO based on current streak (± ELO offset)
- **Set performance integration**: Consider clutch factor (3rd set specialists) and start strength
- **Smart constraints**: Avoid pairing players who've played together recently (rotation fairness)
- **Quality scoring**: Show users a "balance quality" score (0-100) with breakdown

### Algorithm
Instead of simple sort, use a weighted scoring model:
```
Score = w1 * elo_balance + w2 * partner_synergy + w3 * recent_form + w4 * rotation_fairness
```

Where:
- `elo_balance`: Minimize ELO difference between teams
- `partner_synergy`: Maximize historical pair win rates
- `recent_form`: Factor in streaks (hot/cold players get +25/-25 ELO adjustment)
- `rotation_fairness`: Penalize pairing same players as last N matches

### Proposed UX
**Team suggestion modal enhancement:**
- Show "Balance Quality: 87/100" with visual meter (green >75, yellow 50-75, red <50)
- Expandable breakdown:
  - ELO balance: ✅ Excellent (±15 difference)
  - Partner synergy: ⚠️ Fair (both pairs 45-55% win rate together)
  - Recent form: ✅ Hot streak considered (+20 effective ELO for Juan)
  - Rotation: ✅ Fresh pairs (no repeat in last 5 matches)
- "Why this pairing?" tooltip explains reasoning for each player placement
- Alternative suggestions: Show top 3 pairings with scores, users can cycle through
- Quick swap button: "Swap for better balance" if top suggestion is declined by user

**Settings (future):**
- Group admin can adjust weights (w1-w4) to prioritize ELO vs synergy vs rotation
- Toggle "enforce rotation" (never repeat pairs within N matches)
- Toggle "consider recent form" (ignore streaks for consistent balancing)

## Acceptance Criteria
- [ ] Team suggestion modal shows balance quality score (0-100)
- [ ] Algorithm considers partner history in scoring
- [ ] Recent streaks influence pairing decisions
- [ ] Users can see alternative pairings (top 3 options)
- [ ] "Why this pairing?" explains each decision
- [ ] Rotation fairness prevents repeat pairings when configured
- [ ] Balance quality meter has correct color coding
- [ ] Empty state handled when <4 confirmed players
- [ ] Performance: calculations complete within 2 seconds for typical groups (≤20 players)
- [ ] Backwards compatible: falls back to ELO-only if insufficient partner data
- [ ] Must pass: `npm test`

## Data Requirements
**New queries:**
- `getPairHistory(groupId, playerIds[])`: Returns win/loss record for each pair combination
  ```typescript
  {
    pairId: "player1-player2",
    player1Id: string,
    player2Id: string,
    matchesPlayed: number,
    matchesWon: number,
    winRate: number,
    lastPlayedAt: ISODate
  }[]
  ```

- `getPlayerRecentForm(groupId, playerId)`: Current streak, recent matches trend
  ```typescript
  {
    currentStreak: number, // positive for wins, negative for losses
    streakType: "win" | "loss" | "neutral",
    last5Matches: { won: boolean, playedAt: ISODate }[],
    avgRecentElo: number // ELO trend over last 10 matches
  }
  ```

**Enhanced `balanceTeams` function:**
```typescript
export async function balanceTeamsSmart(
  players: PlayerWithElo[],
  options: {
    weights?: { elo: number, synergy: number, form: number, rotation: number },
    minMatchesForSynergy?: number, // default: 3
    rotationWindow?: number, // avoid repeats in last N matches
    returnAlternatives?: number // return top N alternatives
  }
): Promise<{
  best: SuggestedTeamsWithScore,
  alternatives: SuggestedTeamsWithScore[],
  factors: { // explanation for user
    eloBalance: { score: number, message: string },
    partnerSynergy: { score: number, message: string },
    recentForm: { score: number, message: string },
    rotation: { score: number, message: string }
  }
}>
```

**Helper calculations:**
- Effective ELO: `baseElo + (currentStreak * 5)` (e.g., +25 for 5-win streak)
- Partner synergy bonus: `+10` if pair win rate >55%, `-10` if <45% (and have ≥3 matches together)
- Rotation penalty: `-5` for each time this pair played in last `rotationWindow` matches

## Test Impact
**Unit tests:**
- Test partner synergy calculation with various win rates
- Test recent form ELO adjustments (positive/negative streaks)
- Test rotation penalty logic
- Test weighting system (verify changing weights changes outcomes)
- Test fallback to ELO-only when insufficient data
- Test performance with 20 players (should complete <2s)

**E2E tests:**
- Verify balance quality score displays correctly
- Verify "Why this pairing" explanation shows
- Verify alternative pairings cycle correctly
- Verify fallback to simple balancing for new groups (no pair history)

**Edge cases:**
- Groups with 4 players (only 1 pairing option)
- Players with no partner history (new players)
- Groups where everyone has played with everyone (rotation constraints make balancing impossible)

Must pass: `npm test`

## Estimated Size
large

## Notes
- Start with conservative weights (ELO 50%, synergy 25%, form 15%, rotation 10%)
- Default `minMatchesForSynergy = 3` to avoid overfitting on small samples
- For rotation, check `match_team_players` table for recent occurrences
- Cache pair history in materialized view for performance (refresh weekly or on-demand)
- Consider A/B testing: track if users accept smart suggestions more often than ELO-only
- Future: Add "team rating" metric that predicts match outcome probability

## Implementation Phases (for planning)
**Phase 1:** Core algorithm + pair history query
- Implement multi-factor scoring
- Add `getPairHistory` query
- Basic quality score display

**Phase 2:** UX enhancements
- "Why this pairing" explanations
- Alternative pairings (top 3)
- Visual balance quality meter

**Phase 3:** Advanced features
- Recent form integration
- Rotation fairness settings
- Group admin customization of weights
