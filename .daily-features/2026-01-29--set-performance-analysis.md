# Feature: Set-by-Set Performance Analysis

**Status:** PROPOSED

## Why
Padel matches are won or lost set by set, but the app currently only shows aggregate match-level stats. A player who loses their first two sets but wins the third in close battles looks the same as someone who gets swept 0-2. Understanding set-by-set performance provides critical insights:

- **Clutch factor**: Who performs best in decisive third sets?
- **Start strength**: Who comes out hot in the first set vs who needs time to warm up?
- **Comeback ability**: How often does a player bounce back from losing the first set?
- **Choking rate**: Who tends to fold after winning the first set?

These insights help with team balancing (e.g., "Juan is great in third sets, pair him carefully") and give players a deeper understanding of their own game.

## Scope
Add set-level performance tracking and visualization:
- Track win rates by set number (1st, 2nd, 3rd)
- Visualize performance trends across sets (improving vs declining)
- Highlight clutch players (third set specialists)
- Track comeback and fold statistics
- Display set performance on player cards and profile

### Proposed UX
- Add "Sets" button to Player Card in Players directory
- Opens detailed set performance breakdown showing:
  - Win rate per set (Set 1: 65%, Set 2: 58%, Set 3: 72%)
  - Games won/lost per set with bar chart
  - Comeback rate (matches won after losing first set)
  - Fold rate (matches lost after winning first set)
  - Trend indicator: "Improving as match progresses" or "Starts strong, fades"
- Player profile page shows:
  - Set performance summary card with sparkline chart
  - "Clutch factor" badge if 3rd set win rate is notably higher than average
  - Recent matches with set-by-set breakdown
- Color coding: Green for high win rate, orange for average, red for low win rate per set
- Compare set performance to group average to identify relative strengths/weaknesses

## Acceptance Criteria
- [ ] Players page shows set performance indicator on player cards
- [ ] Player profile page displays set performance summary with win rates per set
- [ ] Set performance detail view shows games won/lost per set with visualization
- [ ] Comeback and fold statistics are calculated correctly
- [ ] Trend indicator shows player's performance pattern across sets
- [ ] "Clutch" badge awarded for exceptional third set performance
- [ ] Empty state handled for players with insufficient set data
- [ ] Set performance updates after new match is added or edited
- [ ] Mobile-responsive layout for set performance cards
- [ ] Must pass: `npm test`

## Data Requirements
- New query: `getSetPerformance(groupId, playerId)` returns:
  - `setsPlayed`: total sets where player participated
  - `winRateBySet`: array of `{setNumber, winRate, gamesWon, gamesLost, setsWon, setsLost}`
  - `comebackRate`: matches won after losing first set / matches that went to 3 sets
  - `foldRate`: matches lost after winning first set / matches that went to 3 sets
  - `trend`: "improving" | "declining" | "stable" based on win rate progression
  - `clutchFactor`: third set win rate vs overall win rate
- Calculation logic:
  - For each set the player participated in, determine if they won or lost the set
  - Track games won/lost per set from set_scores table
  - Determine comeback/fold by comparing first set result to final match result
  - Trend calculation: compare win rates across sets (e.g., if set 3 rate > set 2 rate > set 1 rate = "improving")
- Reuse existing: `getMatches`, `getPlayerStats` for context

## Test Impact
- Add unit tests for set performance calculation:
  - Single set matches (no third set)
  - Three-set matches with various patterns (comeback, fold, sweep)
  - Players with insufficient data
- Add E2E test for set performance indicator on player cards
- Add E2E test for set performance detail view accuracy
- Add E2E test for clutch badge display
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Set performance is independent of partners (shows individual contribution per set)
- Minimum data threshold (e.g., 5 sets) before showing set performance to avoid noise
- Clutch badge: award if third set win rate is 20%+ higher than overall win rate and player has played 10+ third sets
- Trend indicator should use smoothing to avoid overreacting to small sample sizes
- Consider adding "set performance vs partner" comparison in future iteration
- For groups with limited data, show "Need more matches" message instead of incomplete stats
