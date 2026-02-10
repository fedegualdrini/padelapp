# Feature: MVP on Match Creation (UI)

**Status:** IMPLEMENTED

**Implemented in:** 5837ebd

## Why
Right now MVP can only be set when editing an existing match. When we’re logging a match right after playing, it’s annoying to save → open edit → set MVP.

## Scope
- Add an optional **MVP** selector to the **New Match** page.
- Persist MVP into `matches.mvp_player_id` on match creation.

## UX / Behavior
- MVP is optional (default: “(Sin MVP)”).
- MVP options must be restricted to **the 4 selected players** (same rule as edit).
- If the selected MVP is not one of the 4 players, server must reject with a clear error.

## Acceptance Criteria
1) On `/g/[slug]/matches/new`, there is an MVP dropdown.
2) MVP dropdown updates as team/player selects change, and only shows the currently selected 4 players.
3) Creating a match with MVP stores it in `matches.mvp_player_id`.
4) Creating a match without MVP stores `NULL`.
5) Server-side validation ensures MVP ∈ {team1p1, team1p2, team2p1, team2p2}.
6) `npm test` passes.

## Test impact
- No new tests required if existing E2E suite passes.
- If needed, adjust any snapshot/screenshots impacted by the New Match UI.

## Estimated size
small → medium
