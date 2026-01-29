# Feature: Stats Leaderboards

**Status:** PROPOSED

## Why
The current ranking page shows ELO ratings, which tracks overall skill, but it doesn't highlight recent performance or short-term achievements. Players love recognition and competition — seeing who's "hot this month" or "most improved" adds gamification and keeps people engaged.

Adding stats leaderboards would:
1. **Increase engagement** - Players compete for top spots on weekly/monthly leaderboards
2. **Highlight trends** - Show who's currently performing well, not just who has the highest overall ELO
3. **Celebrate achievements** - Multiple categories give more players chances to be recognized (not just #1 ELO)
4. **Motivate participation** - Friendly competition encourages players to attend more events and play more matches
5. **Fresh content** - Leaderboards reset periodically, creating new opportunities and stories

Most sports and gaming apps use leaderboards because they drive engagement and create talking points: "Did you see Juan's on top this month?"

## Scope
Add leaderboards page with multiple categories and timeframes:
- Multiple leaderboard categories (wins, win rate, matches played, most improved, MVPs, etc.)
- Different timeframes (This Week, This Month, Last Month, All-Time)
- Visual rankings with position badges (🥇 🥈 🥉)
- Highlight changes from previous period (↗️ new entry, ↘️ dropped, → unchanged)
- Responsive design: full table on desktop, compact cards on mobile
- Easy sharing of leaderboard achievements

### Proposed UX
- **Leaderboard Page**: New route at `/g/[slug]/leaderboards` (also accessible from ranking page)
  - Header: "Leaderboards" with timeframe selector
  - Tabs for different categories:
    1. **Most Wins** - Players with most wins in timeframe
    2. **Best Win Rate** - Players with highest win % (min 3 matches)
    3. **Most Matches** - Players who played the most matches
    4. **Most Improved** - Players with biggest ELO increase
    5. **MVP Count** - Players with most MVP awards
    6. **Streak Leader** - Players with longest active win streak
  - **Timeframe Selector**: Buttons for [This Week] [This Month] [Last Month] [All-Time]
  - **Leaderboard Table** (for Most Wins, Best Win Rate, Most Matches):
    - Columns: Rank, Player, Stat, Change indicator
    - Rank shows badge for top 3: 🥇 🥈 🥉, otherwise number
    - Player name links to player profile
    - Stat column shows the metric (e.g., "8 wins", "75%")
    - Change indicator shows:
      - ↗️ +X for players who entered the top 10 (show previous rank)
      - ↘️ -X for players who dropped (show previous rank)
      - → for unchanged position
      - New for players not in previous top 10
  - **Compact Cards** (mobile view):
    - Each player shown as card with rank badge, name, stat, change
    - Horizontal scroll for long leaderboards
    - Tap to view player profile
- **Visual Highlights**:
  - Top player gets special highlighting (border, background color, trophy icon)
  - Top 3 get gradient or shadow effects
  - "You" indicator if current user is on leaderboard (based on anonymous session)
- **Sharing**:
  - "Share" button on each leaderboard
  - Generates shareable text/image: "🏆 This Week's Top Performer: Juan with 8 wins! #padel"
  - Copy to clipboard option
- **Performance Periods**:
  - **This Week**: Matches played in current calendar week (Mon-Sun)
  - **This Month**: Matches played in current calendar month
  - **Last Month**: Matches played in previous calendar month
  - **All-Time**: All historical matches (same as current ranking page)

### Data Requirements
- Query matches by timeframe (played_at between start/end dates)
- Calculate per-player metrics for each category:
  - **Most Wins**: Count matches where player was on winning team
  - **Best Win Rate**: Wins / Total matches (filter for players with ≥3 matches)
  - **Most Matches**: Count all matches player participated in
  - **Most Improved**: (Latest ELO - ELO at start of timeframe)
  - **MVP Count**: Count matches where player was MVP
  - **Streak Leader**: Longest consecutive win streak in timeframe
- Compare with previous timeframe to calculate rank changes
- Cache leaderboard data (refresh on page load, no real-time needed)

### Proposed Database Changes
No schema changes required - all data exists in current tables:
- `matches` (played_at)
- `match_teams`, `match_team_players` (to identify winning teams)
- `elo_ratings` (for ELO changes)
- `sets`, `set_scores` (to determine match winners)
- MVP award may need new column or flag (can be inferred from match data or added later)

Consider adding `mvp_player_id` to `matches` table for explicit MVP tracking (separate feature).

### Implementation Notes
- Create new page: `src/app/g/[slug]/(protected)/leaderboards/page.tsx`
- Create client component for leaderboard: `src/components/StatsLeaderboards.tsx`
- Server action: `getLeaderboard(group_id, category, timeframe)` - returns ranked players with stats and rank changes
- Timeframe helper functions:
  - `getThisWeekRange()` - returns Mon-Sun of current week
  - `getThisMonthRange()` - returns 1st to last day of current month
  - `getLastMonthRange()` - returns 1st to last day of previous month
  - `getAllTimeRange()` - returns null (no filter)
- Rank change calculation:
  - Get leaderboard for current timeframe
  - Get leaderboard for previous timeframe (e.g., last week for "this week" view)
  - Compare positions, calculate ↗️ ↘️ → indicators
- Minimum match filters:
  - Best Win Rate: require ≥3 matches in timeframe
  - Most Improved: require ≥3 matches and ELO change ≥10 points
- Responsive design:
  - Desktop: Table view with all columns
  - Mobile: Card view with horizontal scroll
- Use Tailwind for styling, follow existing color scheme (var(--accent), var(--ink), etc.)
- Navigation: Add "Leaderboards" link to NavBar
- SEO: Add meta tags for page title and description

### UX Polish
- Loading skeleton while fetching leaderboard data
- Empty state: "No matches played this week/month" with CTA to create match
- Error handling: Show message if leaderboard calculation fails
- Hover effects on table rows (highlight player, show action buttons)
- Click row to navigate to player profile
- Show "Your position: X" if logged-in player is not in top 10
- Smooth transitions when switching timeframes or categories (fade animation)
- Accessibility: Table headers properly labeled, keyboard navigation, ARIA labels

### Categories Detail

**1. Most Wins**
- Metric: Count of wins in timeframe
- Tie-breaker: Win rate, then total matches, then latest match
- Column: "X victorias"

**2. Best Win Rate**
- Metric: Wins / Total matches (percentage)
- Filter: Only players with ≥3 matches
- Tie-breaker: Total wins, then latest match
- Column: "XX% (X-X)"

**3. Most Matches**
- Metric: Total matches played in timeframe
- Tie-breaker: Win rate, then latest match
- Column: "X partidos"

**4. Most Improved**
- Metric: ELO at end of timeframe - ELO at start
- Filter: Only players with ≥3 matches and ELO change ≥10
- Tie-breaker: Absolute ELO change, then total wins
- Column: "+XX puntos"

**5. MVP Count**
- Metric: Count of MVP awards (if tracked)
- Tie-breaker: Win rate, then total matches
- Column: "X MVPs"
- Note: May need MVP tracking implementation first (can use simple heuristic like highest individual contribution if not tracked)

**6. Streak Leader**
- Metric: Longest consecutive win streak in timeframe
- Tie-breaker: Streak end date (more recent), then total wins
- Column: "X partidos seguidos"

### Future Enhancements
- Pair leaderboards (best performing pairs)
- Historical leaderboard snapshots (compare this month vs same month last year)
- Custom timeframes (date range picker)
- Leaderboard notifications ("You're #3 this week! Keep it up!")
- Achievements for leaderboard positions ("Top of the Month" badge)
- Filter by player status (usual vs invite)
- Leaderboard predictions (who's likely to make the cut?)
- Export leaderboard to CSV/PDF

## Acceptance Criteria
- [ ] Leaderboard page exists at `/g/[slug]/leaderboards`
- [ ] "Leaderboards" link exists in NavBar
- [ ] Page shows 6 categories as tabs
- [ ] Timeframe selector has 4 buttons: This Week, This Month, Last Month, All-Time
- [ ] "Most Wins" leaderboard shows top 10 players sorted by wins
- [ ] "Best Win Rate" leaderboard shows top 10 players sorted by win % (min 3 matches)
- [ ] "Most Matches" leaderboard shows top 10 players sorted by match count
- [ ] "Most Improved" leaderboard shows top 10 players sorted by ELO gain (min 3 matches, min 10 pts)
- [ ] "MVP Count" leaderboard shows top 10 players sorted by MVP awards (or shows N/A if not tracked)
- [ ] "Streak Leader" leaderboard shows top 10 players sorted by longest win streak
- [ ] Top 3 players show 🥇 🥈 🥉 badges
- [ ] Rank 4+ players show numeric rank
- [ ] Change indicators show: ↗️ +X (new entry), ↘️ -X (dropped), → (unchanged), New
- [ ] Player names link to player profile pages
- [ ] Stat column shows appropriate format (count, percentage, etc.)
- [ ] Tapping row navigates to player profile (mobile)
- [ ] Hovering row highlights player and shows actions (desktop)
- [ ] "You" indicator shows if current user is on leaderboard (not in top 10)
- [ ] Top player gets special visual treatment (border, background, trophy icon)
- [ ] Empty state shows when no matches in timeframe
- [ ] Loading skeleton shows while fetching data
- [ ] Switching categories updates leaderboard without page reload
- [ ] Switching timeframes updates leaderboard without page reload
- [ ] Mobile view uses horizontal scrolling cards
- [ ] Desktop view uses table layout
- [ ] "Share" button generates shareable text for leaderboard
- [ ] Copy to clipboard works for sharing
- [ ] Page is responsive (mobile, tablet, desktop)
- [ ] Page follows design system (colors, spacing, typography)
- [ ] Must pass: `npm test`

## Technical Notes
- Server action: `getLeaderboardData(group_id, category, timeframe)` - returns { players, timeframeStart, timeframeEnd }
- Query performance: Add database indexes on `matches.played_at`, `match_teams.match_id`, `match_team_players.player_id`
- Consider materialized view for leaderboards if performance issues (refresh on match create/update)
- Use PostgreSQL window functions for rank calculations (ROW_NUMBER(), RANK())
- Example query for Most Wins:
  ```sql
  WITH player_wins AS (
    SELECT
      p.id,
      p.name,
      COUNT(*) FILTER (WHERE mt.won = true) AS wins,
      COUNT(*) AS total_matches
    FROM players p
    JOIN match_team_players mtp ON mtp.player_id = p.id
    JOIN match_teams mt ON mt.id = mtp.match_team_id
    JOIN matches m ON m.id = mt.match_id
    WHERE m.group_id = $1
      AND m.played_at >= $2 AND m.played_at < $3
    GROUP BY p.id, p.name
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY wins DESC, (wins::float / NULLIF(total_matches, 0)) DESC, MAX(m.played_at)) AS rank,
    id,
    name,
    wins,
    total_matches,
    ROUND((wins::float / NULLIF(total_matches, 0)) * 100, 1) AS win_rate
  FROM player_wins pw
  JOIN matches m ON m.id IN (
    SELECT DISTINCT mt.match_id
    FROM match_teams mt
    JOIN match_team_players mtp ON mtp.match_team_id = mt.id
    WHERE mtp.player_id = pw.id
  )
  GROUP BY id, name, wins, total_matches
  ORDER BY wins DESC, win_rate DESC
  LIMIT 10;
  ```
- For rank changes: Query previous period leaderboard, map player_id → rank, compare with current period
- Client component uses `useState` for current category and timeframe
- Use `useEffect` to refetch data when category/timeframe changes
- Debounce rapid timeframe/category switches to avoid excessive queries
- Cache leaderboard data in React Query or similar (consider for future)
- Accessibility: Use `<table>` with proper headers on desktop, use semantic HTML for mobile cards

## Test Impact
- Add unit tests for leaderboard queries:
  - getMostWins returns correct ordering
  - getBestWinRate filters players with <3 matches
  - getMostImproved calculates ELO change correctly
  - getStreakLeader identifies longest consecutive win streak
- Add unit tests for leaderboard client component:
  - Renders correct category
  - Switches between categories
  - Switches between timeframes
  - Shows correct rank badges
  - Shows correct change indicators
  - Handles empty state
  - Handles loading state
- Add E2E tests for leaderboard page:
  - Navigate to /g/[slug]/leaderboards
  - Verify categories tabs exist
  - Verify timeframe buttons exist
  - Click category, verify leaderboard updates
  - Click timeframe, verify leaderboard updates
  - Verify top 3 have badges
  - Click player row, verify navigates to player profile
  - Verify "You" indicator when logged-in player is on leaderboard
  - Verify share button generates correct text
- Add E2E tests for leaderboard calculations:
  - Create 3 matches in current week
  - Verify "This Week" leaderboard shows correct results
  - Verify "Last Month" leaderboard shows no matches
  - Create matches last month
  - Verify "Last Month" leaderboard shows correct results
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Leaderboards should refresh automatically when new matches are added (page reload or next navigation)
- For "Most Improved", calculate ELO at start of timeframe from elo_ratings table (first rating in or before timeframe)
- For "Streak Leader", scan matches chronologically and track consecutive wins per player
- For MVP count, if not explicitly tracked in database, use simple heuristic: player on winning team with highest individual contribution (based on set scores, margins, etc.) — document this in code
- Consider adding "Best Pair" category for pair leaderboards (separate feature)
- Timeframe boundaries should use UTC or group's local timezone (use group's timezone if stored, otherwise UTC)
- For "This Week", consider using Monday as start of week (ISO standard) vs Sunday (US standard) — pick one and document
- Add database migration if MVP tracking is needed: `ALTER TABLE matches ADD COLUMN mvp_player_id uuid REFERENCES players(id);`
- Consider adding `leaderboard_snapshot` table to save historical leaderboards (future feature)
- Leaderboard page should be accessible from ranking page with a "Leaderboards" button or tab
- Use existing color scheme and design tokens (var(--accent), var(--ink), var(--card-solid), etc.)
- For large groups (50+ players), consider pagination or "Show all" button to see beyond top 10
- Consider adding "Compare with previous period" toggle to show side-by-side comparison
- Long-term: Add gamification with achievements for leaderboard positions (e.g., "Top 10 - January 2026")
