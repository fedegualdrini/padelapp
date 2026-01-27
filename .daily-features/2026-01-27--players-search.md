# Feature: Player list search + quick status filter

**Status:** APPROVED

## Why
As groups grow, the Players page becomes harder to navigate. A simple search box (by name) + a quick status filter (all/usual/invite) makes it much faster to find and manage players.

## Scope
- On `/g/[slug]/players` add:
  - a search input that filters visible players by name (case-insensitive)
  - a small status toggle (all/usual/invite) if not already present, or reuse existing filter UI
- Keep filtering client-side if the list is already loaded; otherwise add server-side query support.
- Persist filters in URL query params (e.g. `?q=juan&status=usual`) so it’s shareable.

## Acceptance criteria
- [ ] Search input filters the list as you type (debounced or immediate).
- [ ] Status filter can be applied alone or together with search.
- [ ] URL query params reflect current filters.
- [ ] Refreshing the page preserves filters.
- [ ] Must pass: `npm test`.

## Test impact
- Update Playwright E2E if it depends on the unfiltered player list.
- Add/adjust unit test for query parsing/filtering helper if introduced.

## Estimated size
small
