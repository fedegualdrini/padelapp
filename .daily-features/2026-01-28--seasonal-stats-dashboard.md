# Feature: Seasonal Stats Dashboard

**Status:** APPROVED

## Why
Currently, all stats in the app show all-time data. While valuable for tracking overall progress, players and groups often want to analyze recent performance to understand current form, identify trends, or see who's been playing well lately. A seasonal/period stats view would add context to rankings and help answer questions like "Who's been the best player this month?" or "Is this pair improving over time?"

## Scope
Add time period filtering across multiple pages:
- Period selector dropdown (All time, Last 7 days, Last 30 days, This month, This quarter, This year)
- Apply filters to player stats, pair stats, and ranking views
- Visual indicators showing period-relative performance
- Preset periods with custom date range option

### Proposed UX
- Add a period filter dropdown to relevant pages (Players, Pairs, Ranking)
- Default view remains "All time" for backward compatibility
- When a period is selected, all stats recalculate based on matches within that period
- Player cards show:
  - ELO at start vs end of period (with ↑↓ indicator)
  - Matches played in period
  - Win rate for the period
- Pair cards show matches played and win rate for the period
- Ranking page can filter timeline to show only matches in the period
- Mobile-responsive dropdown positioned near page title

## Acceptance Criteria
- [ ] Period selector component is created and reusable
- [ ] Players page shows period-filtered stats (matches played, wins, losses, win rate)
- [ ] Player cards show ELO change indicator for the selected period
- [ ] Pairs page shows period-filtered pair statistics
- [ ] Ranking page can filter to show only matches from the period
- [ ] Period filter state persists in URL query params for shareability
- [ ] Custom date range option allows users to select specific start/end dates
- [ ] Empty state shows meaningful message when no matches in selected period
- [ ] All existing features continue to work with "All time" default
- [ ] Must pass: `npm test`

## Data Requirements
- Modify existing queries to accept date range filters:
  - `getPlayerStats(groupId, startDate?, endDate?)` - filter by match date
  - `getPairAggregates(groupId, startDate?, endDate?)` - filter by match date
  - `getEloTimeline(groupId, startDate?, endDate?)` - filter timeline
- New query: `getPlayerEloChange(groupId, playerId, startDate, endDate)` - get ELO at start and end of period
- Reuse existing `getMatches` with `from` and `to` filters (already implemented)

## Test Impact
- Add E2E test for period filter selection
- Add E2E test for period-specific stats accuracy
- Add E2E test for custom date range selection
- Add unit tests for ELO change calculation
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- ELO change calculation needs to handle players who joined mid-period (show only matches they played)
- For ranking view, consider showing the ranking as it was at the end of the selected period
- Period presets should be locale-aware (e.g., "This month" respects user's timezone)
- Custom date range should allow future dates (for planning) but filter results accordingly
- Consider adding a "Compare periods" view in a future iteration (e.g., this month vs last month)
