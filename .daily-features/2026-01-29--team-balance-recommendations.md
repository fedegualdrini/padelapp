# Feature: Team Balance Recommendations

**Status:** PROPOSED

## Why
Creating balanced teams is a common challenge in padel. Players often struggle to distribute skill evenly across teams, leading to lopsided matches that are less fun for everyone. While ELO ratings provide a good indicator of player strength, users currently have to manually calculate and balance teams. This feature would automatically suggest optimal team combinations based on ELO ratings, making it easy to create fair, competitive matches every time.

## Scope
Add team balance recommendations to the "Create Match" page that:
- Analyzes all 4 selected players' ELO ratings
- Suggests the optimal team split (which players should team up together)
- Shows the predicted balance margin (ELO difference between teams)
- Highlights the most balanced option when multiple 4-player combinations are possible

### Proposed UX
- On `/g/[slug]/matches/new`, after selecting 4 players (2 per team)
- Add a "Suggest balanced teams" button below player selectors
- When clicked, analyzes all possible team combinations and shows recommendations:
  - Primary recommendation: Most balanced split with ELO margin displayed
  - Shows "Team A: X + Y (avg ELO: 1250)" vs "Team B: Z + W (avg ELO: 1245) - margin: 5"
  - One-click "Apply recommendation" buttons to auto-fill the team selectors
- Add visual indicators:
  - Green checkmark for balanced teams (margin < 20)
  - Yellow warning for slightly unbalanced (margin 20-50)
  - Red alert for very unbalanced (margin > 50)
- Show current team balance in real-time as players are selected:
  - "Current balance: Team A avg 1280 vs Team B avg 1220 (margin: 60)" - highlighted in red
  - Updates live as players change

## Acceptance Criteria
- [ ] "Suggest balanced teams" button visible on create match page when 4 players selected
- [ ] Clicking the button shows team balance recommendations with ELO margins
- [ ] "Apply recommendation" buttons update the team selectors with suggested players
- [ ] Real-time balance indicator shows current team ELO margin
- [ ] Color-coded indicators (green/yellow/red) based on balance margin
- [ ] Recommendations sort by most balanced (lowest margin) first
- [ ] Works with any group that has at least 4 players with ELO ratings
- [ ] Gracefully handles players without ELO ratings (uses default 1000)
- [ ] Mobile-responsive layout
- [ ] Must pass: `npm test`

## Data Requirements
- New query: `getPlayerEloForGroup(groupId)` returns all players with current ELO
- New query: `getTeamBalance(playerIds)` returns optimal team splits with margins
- Reuse existing: ELO calculation logic from `elo_ratings` table
- Balance algorithm: For 4 players, evaluate all 3 possible 2v2 splits and rank by smallest ELO margin
- ELO margin = |(avg team A ELO) - (avg team B ELO)|

## Test Impact
- Add E2E test for "Suggest balanced teams" button visibility and interaction
- Add E2E test for applying a team recommendation
- Add E2E test for real-time balance indicator updates
- Add unit tests for team balance calculation algorithm
- Add unit test for ELO margin calculation with default ratings
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- ELO margin thresholds: <20 (balanced/green), 20-50 (fair/yellow), >50 (unbalanced/red) - can be tuned based on user feedback
- For groups with more than 4 players, recommendation only considers the 4 currently selected
- Consider adding "auto-balance" toggle that always suggests balanced teams when players are selected
- Future enhancement: support 3v3 or doubles tournaments with multiple balanced teams
- Future enhancement: account for pair chemistry/synergy from pair_stats alongside ELO
- Future enhancement: balance recommendations could suggest which player to swap to improve balance
