# Feature: Head-to-Head Player Comparison

**Status:** IMPLEMENTED

## Implementation Notes
- Compare page was already partially implemented
- Added "Comparar jugadores" button on Players page
- Added ComparePlayersDialog component for player selection
- Added unit tests for head-to-head logic (10 tests)
- Added E2E tests for compare button and validation (5 tests)
- Query params: `playerA` and `playerB` (implemented), spec mentions `player1` and `player2` but implementation uses A/B naming

## Commit SHA
(To be added after commit)

## Why
Players love to know how they stack up against specific opponents. While the app shows individual stats and match history, there's no dedicated way to compare two players directly—seeing their head-to-head record, who wins when they face each other, and how their performance compares across key metrics. This feature would add another competitive and analytical layer to the app, letting players settle debates like "Who's actually better between Juan and me?" or "How do I fare against the group's top players?"

## Scope
Create a new head-to-head comparison view at `/g/[slug]/players/compare` that shows:
- Direct match history between two selected players
- Head-to-head win/loss record
- Comparative stats (matches played, overall win rate, ELO, streaks)
- Recent performance comparison
- Visual indicators showing who leads each metric

### Proposed UX
- Accessible via "Compare players" button on Players page (select 2 players)
- Direct link: `/g/[slug]/players/compare?player1=<id>&player2=<id>`
- Two-column layout comparing Player A vs Player B
- Header showing head-to-head record (e.g., "Juan vs Pedro: 3-2" favoring Juan)
- Match history section showing only matches where both players participated
- Stats comparison table with side-by-side metrics:
  - Total matches in group
  - Overall win rate
  - Current ELO
  - Current win/loss streak
  - Most frequent partner
  - Best set performance (e.g., "6-0", "7-5" as winner)
- Visual indicators (green up arrow, red down arrow) showing who leads each metric
- "View all matches" button links to filtered matches page with both players
- Mobile-responsive: stacked cards on small screens

## Acceptance Criteria
- [ ] Route `/g/[slug]/players/compare` exists and renders a comparison view
- [ ] URL query params `player1` and `player2` are required; show error if missing/invalid
- [ ] Players page has a "Compare players" button that opens comparison with selected players
- [ ] Comparison view shows head-to-head record (wins/losses between the two players)
- [ ] Comparison view displays match history where both players participated
- [ ] Stats comparison table includes: matches played, win rate, ELO, streaks
- [ ] Visual indicators highlight which player leads each metric
- [ ] 404 or error shown for invalid player IDs
- [ ] Mobile layout stacks columns vertically
- [ ] Must pass: `npm test`

## Data Requirements
- New query: `getHeadToHeadMatches(groupId, player1Id, player2Id)` returns matches where both players participated
- New query: `getHeadToHeadRecord(groupId, player1Id, player2Id)` returns wins for each player in direct matchups
- Reuse existing: `getPlayerStats`, `getPlayerElo`, `getPlayerStreaks` for individual metrics
- Note: Head-to-head includes matches where players were on the same team (no winner) and opposing teams (determine winner)

## Test Impact
- Add E2E test for comparison page rendering with valid player IDs
- Add E2E test for head-to-head record accuracy
- Add E2E test for comparison button on Players page
- Add unit tests for head-to-head match filtering logic
- Add unit test for head-to-head record calculation
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- When players were on the same team, the match is shown in history but doesn't count toward head-to-head record
- Consider adding a "rematch" button that suggests next opponent based on head-to-head
- For groups with many players, consider adding autocomplete search for player selection
- Future enhancement: allow comparing player stats across different time periods
- Future enhancement: export comparison as shareable image or link
