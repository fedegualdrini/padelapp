# Feature: Click player name to filter matches

**Status:** IMPLEMENTED

**Implemented in:** 7e17f74cd37f2950de74524e7d05daf5968c6fb6

## Why
Now that we have match filters, a fast UX win is making the match list itself interactive: clicking a player’s name should instantly filter the match history to that player. This reduces friction and makes “Filtrar” feel integrated instead of hidden.

## Scope
- Make player names in match cards clickable.
- Clicking a player sets `playerId=<id>` in the URL query params on `/g/[slug]/matches`.
- Provide an easy “clear filter” path (reuse existing filter modal’s Clear, and optionally show an inline chip).

## Acceptance criteria
- [ ] In `/g/[slug]/matches`, each player name is clickable.
- [ ] Clicking a player updates the URL with `?playerId=<id>` and the list refreshes.
- [ ] The existing **Filtrar** button reflects the active filter count.
- [ ] Clearing filters removes query params and shows all matches.
- [ ] No visual regressions on match cards.

## Test impact
- Might require updating Playwright screenshots/flows if they depend on unfiltered list.
- Must pass: `npm test`.

## Estimated size
small
