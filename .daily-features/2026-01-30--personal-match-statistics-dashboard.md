# Feature: Personal Match Statistics Dashboard

**Status:** PROPOSED

## Why
Players want to understand their performance at a glance. While Padelapp already shows individual player pages with ELO charts and streaks, there's no comprehensive dashboard that aggregates all of a player's statistics in one view.

A Personal Match Statistics Dashboard would give players:
- **Quick overview** of their overall performance (matches, win rate, form)
- **Trend analysis** showing improvement over time
- **Pairing insights** - who they play best with
- **Opponent analysis** - their record against different players
- **Streak awareness** - current momentum and best/worst streaks
- **Achievement progress** - what they've unlocked (when achievements are implemented)

This is the player-centric version of the group-level "Pulse de la semana" - but personalized and much more detailed.

## Scope
Create a dedicated statistics dashboard for each player that shows comprehensive match statistics:

### Core Stats Section
- **Overall Performance**:
  - Total matches played
  - Win rate (percentage)
  - Sets won / sets lost
  - Games won / games lost
  - Current ELO ranking and position in group
- **Form (Last 10 matches)**:
  - W-L record in last 10 matches
  - Visual form indicator (e.g., W-W-L-W-W-W-L-W-W-W)
  - Current streak (wins or losses)
  - Win rate in last 10 matches vs overall win rate

### Trend Analysis Section
- **ELO History Chart**: Mini version of existing ELO chart (already exists on player page)
- **Win Rate Over Time**: Line chart showing win rate by month/week
- **Performance Trend Indicator**: Arrow up/down showing if improving or declining

### Best Pairings Section
- **Top 3 Pairs**: Pairs with highest win rate together (minimum 3 matches together)
- For each pair: players' names, matches played together, win rate, last played date
- Click on pair to view detailed pair chemistry (links to existing pair chemistry feature)

### Opponent Analysis Section
- **Head-to-Head Summary**: Record against each opponent
- Show top 5 most frequent opponents with W-L record
- Win rate against each opponent
- Last match date vs opponent
- Link to head-to-head comparison (links to existing feature)

### Streaks Section
- **Current Streak**: Active win or loss streak with start date
- **Best Win Streak**: Longest winning streak with dates
- **Best Loss Streak**: Longest losing streak with dates (shows resilience when broken)
- Visual streak indicators (e.g., 🔥 for hot streaks)

### Achievements Section (if achievements implemented)
- **Unlocked Badges**: Grid of earned achievement badges
- **Progress Indicators**: For achievements in progress (e.g., "8/10 wins streak for 'Hot Streak' badge")
- **Achievement Score**: Total points from unlocked achievements
- Link to full achievements page (when implemented)

### Navigation & Layout
- Access via new "Estadísticas" button on player page
- Or add as a tab on player page: "Resumen | Estadísticas | Comparar"
- Responsive design: single column on mobile, grid on desktop
- Print-friendly layout (for sharing stats)

### Proposed UX
- **Top Section**: Large win rate percentage with visual ring chart, below it matches played and ELO rank
- **Form Section**: Horizontal list of last 10 match results with color-coded badges (green W, red L)
- **Charts Section**: Two side-by-side charts (ELO history, win rate trend) on desktop
- **Best Pairings**: Card-style layout for each pair with win rate prominently displayed
- **Opponent Analysis**: Table or list format for quick scanning
- **Streaks**: Visual timeline or badge-style display for current and best streaks
- **Achievements**: Grid of circular badges with tooltips on hover

### Visual Design
- **Color Palette**: Use existing theme colors (accent, ink, muted, card-glass)
- **Charts**: Reuse existing TradingViewChart component for consistency
- **Form Indicators**: Small circles with checkmark (W) or X (L) icons
- **Win Rate Ring**: Circular progress chart showing win rate (green for >50%, red for <50%)
- **Pairing Cards**: Card layout with player avatars (if available) or initials
- **Streak Indicators**: Flame icon for hot streaks, ice cube for cold streaks

## Acceptance Criteria
- [ ] New "Estadísticas" button/option available on player page
- [ ] Dashboard shows overall stats: matches played, win rate, sets/games won/lost, ELO rank
- [ ] Form section shows last 10 match results with visual W/L indicators
- [ ] Trend section includes ELO chart and win rate over time
- [ ] Best pairings section shows top 3 pairs with win rate and matches played
- [ ] Opponent analysis shows record against most frequent opponents
- [ ] Streaks section shows current streak, best win streak, best loss streak
- [ ] If achievements exist, show unlocked badges and progress indicators
- [ ] All charts are responsive and readable on mobile
- [ ] Links to existing features (pair chemistry, head-to-head) work correctly
- [ ] Dashboard is printable without extra CSS needed
- [ ] Performance: page loads in <2 seconds for players with 50+ matches
- [ ] Must pass: `npm test`

## Technical Notes
- Create new page: `src/app/g/[slug]/players/[id]/stats/page.tsx`
- Reuse existing data functions from `@/lib/data`:
  - `getMatches` - filter by player
  - `getPlayerStats` - create new function to aggregate stats
  - `getPairStats` - for best pairings analysis
  - `getHeadToHead` - for opponent analysis
- Create new component: `src/components/PlayerStatsDashboard.tsx`
- Create helper functions for calculating:
  - Win rate trends over time
  - Pair statistics and win rates
  - Head-to-head records
  - Streak analysis (current, best win, best loss)
- Charts: Reuse `TradingViewChart` component with custom datasets
- Form indicator: Create small reusable component for W/L badges
- Achievements integration: Check if achievements table exists, if so query for player's achievements
- For pairing analysis, ensure minimum matches threshold (e.g., 3 matches together) to avoid skewed stats
- Cache calculations using React Query or similar for performance
- Use TypeScript interfaces for all data structures

## Data Requirements
- **New DB queries/functions**:
  - `getPlayerStats(playerId)`: Returns aggregated match statistics
  - `getPairWinRate(playerId, partnerId)`: Calculates win rate for a pair
  - `getTopPairs(playerId)`: Returns top pairs by win rate (min 3 matches)
  - `getOpponentRecord(playerId)`: Returns W-L record against each opponent
  - `getPlayerStreaks(playerId)`: Returns current, best win, best loss streaks
  - `getWinRateTrend(playerId)`: Returns win rate by month/week
- **Achievements data** (if implemented):
  - Query player's unlocked achievements from achievements table
  - Query progress for in-progress achievements

## Test Impact
- Add unit tests for new data functions:
  - `getPlayerStats` returns correct aggregates
  - `getTopPairs` filters correctly and sorts by win rate
  - `getOpponentRecord` calculates correct W-L for each opponent
  - `getPlayerStreaks` correctly identifies streaks
- Add unit tests for `PlayerStatsDashboard` component:
  - Renders all sections correctly
  - Shows correct statistics
  - Handles empty state (player with no matches)
  - Links navigate correctly
- Add E2E test:
  - Navigate to player stats dashboard
  - Verify all sections display correctly
  - Verify statistics are accurate
  - Test on mobile viewport
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Consider adding "export to PDF" button for sharing stats
- Consider adding "share stats" link that generates a public URL (similar to ranking share)
- For large groups (>50 players), ensure queries are optimized with proper indexing
- Consider showing "vs group average" comparison for each stat
- If achievements are not yet implemented, show placeholder message "Logros próximamente"
- Long-term: Add "compare to previous period" (e.g., "Your win rate improved 5% vs last month")
- Long-term: Add AI-powered insights (e.g., "You play better on Fridays" or "You win more when paired with X")
- For form indicators, consider showing opponent name on hover for more context
- Ensure accessibility: all charts have alt text, keyboard navigation works, colors meet WCAG standards
