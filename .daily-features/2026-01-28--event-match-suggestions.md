# Feature: Event Match Suggestions

**Status:** IMPLEMENTED (commit: fe11a14)

## Why
Currently, the app has two separate workflows:
1. Weekly events for managing attendance (who's coming)
2. Match creation for recording actual matches

When an event has enough confirmed players, there's no easy way to go from "who's confirmed" to "let's create balanced teams and play". Users have to manually copy the confirmed players and navigate to the match creation page, then remember which pairs are balanced based on ELO.

This feature streamlines the workflow by suggesting balanced teams directly from event attendance, making the transition from planning to playing seamless.

## Scope
Add match suggestion capability to the events page:
- When an occurrence has 4 confirmed players (full capacity), show a "Create match" button
- Clicking opens a modal/page suggesting balanced teams based on current ELO
- Teams are auto-balanced using a simple algorithm (highest with lowest)
- User can swap players between teams before confirming
- On confirmation, create the match and link it to the event occurrence (loaded_match_id)
- Navigate to the new match for score entry

### Proposed UX
- On `/g/[slug]/events`, each upcoming occurrence card has a "Crear partido" button when confirmed count >= 4
- Button is disabled if occurrence is not full (< 4 confirmed)
- Clicking opens a modal showing:
  - Two suggested teams (Team A vs Team B) with player names and ELO
  - Combined ELO per team (to show balance)
  - "Swap players" mode where clicking a player moves them to the other team
  - "Confirmar y crear partido" button
- After confirmation, redirect to `/g/[slug]/matches/new?eventId=<occurrenceId>` with teams pre-filled
- The new match is created and linked to the occurrence via `event_occurrences.loaded_match_id`

## Acceptance Criteria
- [ ] "Crear partido" button appears on event cards with 4+ confirmed players
- [ ] Button is disabled/shows tooltip when < 4 confirmed
- [ ] Clicking opens team suggestion modal with balanced teams based on ELO
- [ ] Modal displays player names, ELO, and team total ELO
- [ ] User can click players to move them between teams
- [ ] "Confirmar y crear partido" creates a new match with the selected teams
- [ ] Created match is linked to the event occurrence (loaded_match_id set)
- [ ] User is redirected to the new match edit page for score entry
- [ ] Modal can be cancelled without changes
- [ ] Works on mobile (responsive modal)
- [ ] Must pass: `npm test`

## Data Requirements
- Query to get confirmed players for an occurrence with their ELO ratings
- Simple team balancing algorithm (highest ELO pairs with lowest ELO, or similar)
- Existing `createMatch` function (already in data.ts)
- Update `event_occurrences.loaded_match_id` after match creation

## Test Impact
- Add E2E test for event match suggestion flow
- Add E2E test for team balancing logic
- Add E2E test for match creation from event
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Team balancing can be a simple algorithm initially: sort by ELO, then pair (highest, lowest) vs (second highest, second lowest)
- Future enhancement: allow users to select alternative balancing strategies
- Consider adding a "Skip suggestion" option to go directly to match creation with empty teams
- This feature integrates nicely with existing pair chemistry stats (could show win rates for suggested pairs)
