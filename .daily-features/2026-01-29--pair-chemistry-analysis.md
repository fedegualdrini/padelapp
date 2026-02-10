# Feature: Pair Chemistry Analysis

**Status:** PROPOSED

## Why
The existing pair statistics show basic win rate and match count, but they don't reveal the deeper story of how pairs evolve over time. In padel, pair chemistry is complex — some pairs start slow and develop synergy over months, others start strong but plateau or decline, and some pairs have special "magic" against specific opponents.

The `mv_pair_aggregates` view only shows cumulative stats, which hides important trends:
- A 70% win rate could be from 20 matches 6 months ago (stale chemistry)
- A pair might be 5-0 in their last 5 matches despite having an overall 50% win rate
- Some pairs perform exceptionally well against certain opponents but poorly against others
- Recent matches matter more than matches from months ago for predicting future performance

Adding pair chemistry analysis would:
1. **Show trends** - Is this pair improving or declining over time?
2. **Reveal form** - How have they performed in their last N matches?
3. **Head-to-head** - How well do they play against specific other pairs?
4. **Chemistry score** - A composite metric indicating how well the pair works together

This helps captains make smarter lineup decisions: "Juan & Maria have great chemistry with a 4-match win streak, even though their overall stats are average."

## Scope
Add advanced pair chemistry analysis that goes beyond basic win/loss stats:
- Pair performance trend over time (chart)
- Recent form analysis (last 5, 10, 20 matches)
- Head-to-head pair vs pair performance
- Chemistry score (consistency + recent form + trend)
- Pair compatibility recommendations

### Proposed UX
- **Pair Detail Page** (`/g/[slug]/pairs/[playerAId]/[playerBId]`):
  - Header: Player A + Player B names with "Pair Chemistry" badge
  - **Chemistry Score Card**: Large, prominent score (0-100) with:
    - Trend indicator (↗️ improving, ↘️ declining, ➡️ stable)
    - "Great", "Good", "Average", "Needs Work" label based on score
    - Last updated timestamp
  - **Performance Trend Chart**: Line chart showing rolling win rate over time
    - X-axis: Matches played (1, 2, 3, ... N)
    - Y-axis: Rolling win rate (0-100%)
    - Highlight last 10 matches with different color
    - Show individual matches as dots (win = green, loss = red)
  - **Stats Summary**:
    - Total matches played
    - Overall win rate
    - Last 5 matches: W-L record + win rate
    - Last 10 matches: W-L record + win rate
    - Current streak (wins/losses)
    - Best streak (longest win streak)
  - **Head-to-Head vs Other Pairs**:
    - Table showing record vs each opponent pair
    - Columns: Opponent Pair, Matches, Wins, Losses, Win Rate, Trend
    - Sort by matches played (most frequent opponents first)
    - Filter to pairs with 2+ matches
  - **Chemistry Breakdown**:
    - Consistency score: How consistent is their win rate? (std dev based)
    - Form score: Performance in recent matches (last 10 weighted higher)
    - Trend score: Slope of performance over time (improving/declining)
    - Synergy indicators: "Strong on clay", "Better in tie-breaks", etc. (if data available)
  - **Compatibility Insights**:
    - "Top 3 opponent pairs this pair struggles against"
    - "Top 3 opponent pairs this pair dominates"
    - "Best partners for Player A (excluding Player B)"
    - "Best partners for Player B (excluding Player A)"

### Sample Chemistry Score Calculation
```
Chemistry Score (0-100) = (
  Base Win Rate (0-50) +
  Consistency Bonus (0-20) +
  Recent Form Bonus (0-20) +
  Trend Bonus (0-10)
)

Base Win Rate: 50 × (wins / total_matches)
Consistency: 20 × (1 - std_dev) where std_dev is normalized to [0,1]
Recent Form: 20 × (win_rate_last_10)
Trend: 10 × (slope_of_rolling_win_rate)
```

**Example:**
- Pair has 30 matches, 18 wins (60% win rate) → Base: 30
- Consistent performer (low std dev) → Consistency: 15
- Last 10 matches: 8-2 (80% win rate) → Recent Form: 16
- Improving trend (slope +0.02) → Trend: 8
- **Total: 69/100** → "Good Chemistry ↗️"

### Pair List Page Enhancement (`/g/[slug]/pairs`):
- Add "Chemistry" column with score (0-100)
- Add "Trend" column with emoji indicator (↗️, ↘️, ➡️)
- Add "Recent 5" column showing W-L record
- Allow sorting by Chemistry Score, Trend, or Recent Form
- Add "Best Chemistry" and "Needs Work" quick filters

### Player Profile Enhancement:
- Add "Best Pair" section showing player's highest-scoring pair
- Add "Recent Pair Performance" showing chemistry with last 3 partners

## Acceptance Criteria
- [ ] Pair detail page shows chemistry score (0-100) with trend indicator
- [ ] Performance trend chart displays rolling win rate over time
- [ ] Chart highlights last 10 matches distinctly
- [ ] Stats summary shows total matches, win rate, last 5/10 form, streaks
- [ ] Head-to-head table shows record vs each opponent pair
- [ ] Head-to-head table filters to pairs with 2+ matches
- [ ] Chemistry breakdown shows consistency, form, and trend scores
- [ ] Compatibility insights suggest best/worst opponent pairs
- [ ] Compatibility insights suggest best alternative partners
- [ ] Pair list page has Chemistry and Trend columns
- [ ] Pair list can be sorted by chemistry or trend
- [ ] Empty state handled for pairs with < 5 matches (show "Not enough data")
- [ ] Mobile-responsive layout (charts readable on small screens)
- [ ] Charts render correctly with proper tooltips and legends
- [ ] Chemistry score updates after each match
- [ ] Must pass: `npm test`

## Data Requirements
- New view: `v_pair_chemistry` (calculates chemistry metrics per pair)
  ```sql
  create or replace view v_pair_chemistry as
  with pair_matches as (
    select
      player_a_id,
      player_b_id,
      match_id,
      is_win,
      played_at,
      row_number() over (partition by player_a_id, player_b_id order by played_at) as match_num
    from mv_pair_stats ps
    join matches m on m.id = ps.match_id
  ),
  rolling_win_rates as (
    select
      player_a_id,
      player_b_id,
      match_num,
      is_win,
      sum(is_win::int)::numeric / count(*)::numeric over (
        partition by player_a_id, player_b_id
        order by match_num
        rows between unbounded preceding and current row
      ) as rolling_win_rate
    from pair_matches
  ),
  pair_stats as (
    select
      player_a_id,
      player_b_id,
      count(*) as total_matches,
      sum(is_win::int) as wins,
      count(*) filter (where match_num <= 5) as last_5_matches,
      sum(is_win::int) filter (where match_num <= 5) as last_5_wins,
      count(*) filter (where match_num <= 10) as last_10_matches,
      sum(is_win::int) filter (where match_num <= 10) as last_10_wins,
      stddev(rolling_win_rate) as win_rate_stddev
    from rolling_win_rates
    group by player_a_id, player_b_id
  )
  select
    player_a_id,
    player_b_id,
    total_matches,
    wins,
    (wins::numeric / total_matches::numeric) as base_win_rate,
    last_5_matches,
    last_5_wins,
    (last_5_wins::numeric / nullif(last_5_matches, 0)::numeric) as last_5_win_rate,
    last_10_matches,
    last_10_wins,
    (last_10_wins::numeric / nullif(last_10_matches, 0)::numeric) as last_10_win_rate,
    win_rate_stddev,
    50 * (wins::numeric / total_matches::numeric) +
      20 * (1 - coalesce(win_rate_stddev, 0)) +
      20 * (last_10_wins::numeric / nullif(last_10_matches, 0)::numeric) +
      10 as chemistry_score
  from pair_stats
  where total_matches >= 5; -- only analyze pairs with sufficient data
  ```

- New view: `v_pair_head_to_head` (pair vs pair record)
  ```sql
  create or replace view v_pair_head_to_head as
  with pair_matches as (
    -- Match 1: pair_a vs pair_b
    select
      least(p1.player_id, p2.player_id) as player_a_id,
      greatest(p1.player_id, p2.player_id) as player_b_id,
      m.id as match_id,
      mt.team_number,
      case when mw.team_number = mt.team_number then true else false end as is_win,
      -- Get opponent pair
      (
        select least(opp1.player_id, opp2.player_id)
        from match_team_players opp1
        join match_team_players opp2 on opp1.match_team_id = opp2.match_team_id and opp1.player_id < opp2.player_id
        where opp1.match_team_id in (select id from match_teams where match_id = m.id and team_number != mt.team_number)
      ) as opp_a_id,
      (
        select greatest(opp1.player_id, opp2.player_id)
        from match_team_players opp1
        join match_team_players opp2 on opp1.match_team_id = opp2.match_team_id and opp1.player_id < opp2.player_id
        where opp1.match_team_id in (select id from match_teams where match_id = m.id and team_number != mt.team_number)
      ) as opp_b_id
    from matches m
    join match_teams mt on mt.match_id = m.id
    join match_team_players p1 on p1.match_team_id = mt.id
    join match_team_players p2 on p2.match_team_id = mt.id and p1.player_id < p2.player_id
    join v_match_winners mw on mw.match_id = m.id
  )
  select
    player_a_id,
    player_b_id,
    opp_a_id,
    opp_b_id,
    count(*) as matches,
    sum(is_win::int) as wins,
    count(*) - sum(is_win::int) as losses,
    (sum(is_win::int)::numeric / count(*)::numeric) as win_rate
  from pair_matches
  group by player_a_id, player_b_id, opp_a_id, opp_b_id;
  ```

- New query: `getPairChemistry(groupId, playerAId, playerBId)` - returns chemistry metrics
- New query: `getPairHeadToHead(groupId, playerAId, playerBId)` - returns H2H vs all opponent pairs
- New query: `getPairTrendData(groupId, playerAId, playerBId)` - returns data for trend chart
- New query: `getAllPairsChemistry(groupId)` - returns all pairs with chemistry scores for list page

## Technical Notes
- Use Recharts or Chart.js for trend visualization
- Rolling win rate: calculate cumulative win rate after each match
- Trend slope: use linear regression on last N rolling win rate points
- Consistency: calculate standard deviation of rolling win rate points
- Head-to-head queries need to handle asymmetric pair comparisons (A vs B vs B vs A should be the same)
- Chemistry score is cached in the view; refresh after each match update
- For pairs with < 5 matches, show "Not enough data for chemistry analysis"
- Consider adding pair chemistry to `refresh_stats_views()` helper
- Accessibility: ensure charts have proper ARIA labels and descriptions

## Test Impact
- Add unit tests for chemistry score calculation:
  - Exact score for known test dataset
  - Trend calculation (improving vs declining pairs)
  - Consistency calculation (stable vs volatile pairs)
- Add unit tests for head-to-head queries:
  - Correct win rate vs each opponent pair
  - Correct total matches vs each opponent
  - Handles asymmetric pair ordering correctly
- Add E2E test for pair detail page:
  - View chemistry score and trend
  - Verify trend chart displays
  - Check head-to-head table shows correct data
  - Verify chemistry breakdown sections
- Add E2E test for pair list page:
  - Verify chemistry column shows scores
  - Test sorting by chemistry
  - Test filtering by "Best Chemistry" and "Needs Work"
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Chemistry score formula should be tunable via configuration if needed
- Consider adding time-weighted recent form (more recent matches count more)
- Future: Add "pair compatibility prediction" using ML to suggest optimal pairings
- Future: Add "pair synergy breakdown" (serves, returns, volleys, etc.) if detailed stats available
- Future: Add "pair strength vs surface type" if court surface data is tracked
- Mobile: Chart should be swipeable if it gets too wide
- Performance: Head-to-head queries could be expensive; consider caching or pagination
- Chemistry thresholds: 80+ = Great, 65-79 = Good, 50-64 = Average, <50 = Needs Work
- Trend threshold: slope > 0.01 = ↗️ improving, slope < -0.01 = ↘️ declining, else ➡️ stable
- For large groups (>30 players), limit head-to-head table to top 10 most frequent opponents
- Consider adding export to CSV feature for pair chemistry data
