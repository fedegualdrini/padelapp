# Feature: Player Profile Page

**Status:** IMPLEMENTED (commit: 3242593)

## Why
Currently, player information is scattered across the app: basic stats appear in the Players directory, match history can be filtered on the Matches page, and ELO history is only visible in the group-wide Ranking chart. A dedicated player profile page would provide a unified view of a player's journey—showing their match history, ELO progression, partner chemistry, and personal stats all in one place. This creates a more engaging experience and makes it easier to track individual improvement over time.

## Scope
Create a new page at `/g/[slug]/players/[id]` that displays:
- Player header with name, status (usual/invite), and overall stats
- ELO progression chart (mini version showing just this player's history)
- Recent matches list (last 10-20 matches the player participated in)
- Partner statistics (win rates with different teammates)
- Win/loss streak indicator
- Link back to filtered match history for complete archive

## Proposed UX
- Player names in the Players directory become clickable links to their profile
- The profile page has a consistent card-based layout matching the rest of the app
- ELO chart shows the player's rating changes over time with match markers
- Recent matches show result (W/L), score, date, and partner
- Partner stats show top teammates ranked by matches played and win rate
- "Ver todos los partidos" button links to `/g/[slug]/matches?playerId=<id>`

## Acceptance Criteria
- [ ] Route `/g/[slug]/players/[id]` exists and renders a player profile
- [ ] Player names in PlayerDirectory link to their profile page
- [ ] Profile displays: name, status badge, total matches, wins, losses, current ELO
- [ ] Profile shows a line chart of ELO history over time
- [ ] Profile lists recent matches with result indicators
- [ ] Profile shows partner win rates (top 5 most played with)
- [ ] Win/loss streak is calculated and displayed
- [ ] "Back to players" and "View all matches" navigation works
- [ ] 404 shown for invalid player IDs or players not in the group
- [ ] Must pass: `npm test`

## Data Requirements
- Reuse existing `getPlayerStats`, `getEloTimeline`, `getMatches` data functions
- New query needed: partner statistics per player (wins/losses per teammate)
- New query needed: match results with partner identification for recent matches list

## Test Impact
- Add E2E test for player profile navigation
- Add E2E test for profile data accuracy
- Update PlayerDirectory tests if they assert on non-clickable names
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Consider adding shareable URL for player profiles (future enhancement)
- Could add "Compare with another player" button linking to head-to-head
- Mobile layout should stack sections vertically
