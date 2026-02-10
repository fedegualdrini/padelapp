# Feature: Match filters on Matches page

**Status:** IMPLEMENTED

**Implemented in:** 7dbc0eb

## Why
The Matches page currently shows a non-functional “Filtrar” button. As match history grows, users need a fast way to find games (by player/date) without scrolling.

## Scope
- Implement a filter UI triggered by the existing **Filtrar** button on `/g/[slug]/matches`.
- Add server-side filtering in the data layer (so URL can be shareable/bookmarkable).

## Proposed UX
- Clicking **Filtrar** opens a small modal/drawer with:
  - **Player** (multi-select or single-select): show members of the group
  - **Date range**: from / to (optional)
  - Buttons: **Apply**, **Clear**
- Filters persist in the URL as query params (e.g. `?playerId=...&from=YYYY-MM-DD&to=YYYY-MM-DD`).

## Acceptance criteria
- [ ] “Filtrar” opens a UI (modal/drawer) with player + date range inputs.
- [ ] Clicking **Apply** updates the URL query params and refreshes the list.
- [ ] Clicking **Clear** removes query params and resets the list.
- [ ] Server returns only matches that satisfy filters:
  - by player: matches where the player participated
  - by date: match date within range
- [ ] No regression to existing matches page styling.

## Test impact
- Update or add unit tests for query parsing / filtering logic.
- Update Playwright E2E if it asserts match list length/order without filters.
- Must pass: `npm test`.

## Estimated size
medium
