# Feature: Win/Loss Streaks Tracking

**Status:** IMPLEMENTED (commit: 643e605)

## Why
While players can see their overall stats and recent matches, there's no easy way to track winning or losing streaks over time. Streaks are a powerful metric for understanding a player's current form—someone on a 5-game winning streak is playing differently than someone who's lost their last 3. This adds a fun gamification element and can help with team balancing decisions (e.g., "Fede's on a hot streak, let's give him a slightly weaker partner this week").

## Scope
Add streak tracking for individual players:
- Calculate current win/loss streak (consecutive wins or losses in their most recent matches)
- Track longest win streak and longest loss streak
- Display streak indicators on player cards and profile pages
- Add streak history timeline showing streak changes over time

### Proposed UX
- Player cards in Players directory show streak badge (e.g., "🔥 5W" for 5-game winning streak, "❄️ 3L" for 3-game losing streak)
- Player profile page shows:
  - Current streak with visual indicator (flame for wins, snowflake for losses)
  - Longest win streak all-time
  - Longest loss streak all-time
  - Streak history timeline (chart showing when streaks started/ended)
- Streak indicators update in real-time as matches are recorded
- No indicator shown when streak is 0 (just played their first match or broke even)

## Acceptance Criteria
- [ ] Player cards display current streak badge when streak >= 2
- [ ] Player profile page shows current streak, longest win streak, and longest loss streak
- [ ] Streak history chart visualizes streak changes over time
- [ ] Streaks are calculated correctly across all matches in the group
- [ ] Streaks update immediately after a new match is added or edited
- [ ] Empty state handled for new players (no streak shown)
- [ ] Streak indicators use appropriate colors/icons (red/orange for win streaks, blue/gray for loss streaks)
- [ ] Must pass: `npm test`

## Data Requirements
- New query: `getPlayerStreaks(groupId, playerId)` returns:
  - `currentStreak`: number (positive for wins, negative for losses, 0 for neutral)
  - `longestWinStreak`: number
  - `longestLossStreak`: number
  - `streakHistory`: array of `{streak, type, startMatchId, endMatchId, startDate, endDate}`
- Streak calculation logic:
  - Traverse matches chronologically from most recent to oldest
  - Count consecutive wins (+1) or losses (-1) until streak breaks
  - Track maximum streaks across entire match history

## Test Impact
- Add unit test for streak calculation with various scenarios:
  - Single win/loss streaks
  - Alternating win/loss patterns
  - Broken streaks (win, win, loss, win)
  - New players with no matches
- Add E2E test for streak badge display on player cards
- Add E2E test for streak history on player profile
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Consider adding streak achievements/badges for milestones (e.g., "🏆 10 Wins in a Row")
- Streaks are per-player and independent of partners
- For group events, could highlight players on notable streaks (e.g., "🔥 Juan is on a 5-game win streak!")
- Future enhancement: Pair streaks (track consecutive wins/losses for specific partner combinations)
