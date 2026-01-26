# E2E Stabilization TODO

## Goal
Make the E2E suite deterministic on this small host (avoid flaky join/session + avoid timeouts).

## Current symptoms
- Flaky auth/join: tests sometimes stay on `/g/padel/join` (passphrase input missing / session missing).
- Head-to-head tests intermittently fail to find dropdowns on `/players/compare`.
- Occasional SIGKILL / aborted runs when multiple dev servers pile up.

## Plan

### 1) Suite-wide auth (fixes both Ranking + Head-to-Head)
- [x] Add `tests/e2e/global-setup.ts` to join group once and save `storageState`.
- [x] Configure Playwright to reuse `storageState` for all tests.
- [ ] Ensure Playwright always starts a fresh dev server (no reuse) so `.env.local` is applied consistently.
- [ ] Verify `tests/e2e/.auth/state.json` gets created and is reused.

### 2) Ranking spec
- [x] Fix false-positive timeframe assertion ("ALL" matched Player Status: All).
- [x] Remove per-test join logic; rely on global auth.
- [ ] Rerun `ranking.spec.ts` alone until green.

### 3) Head-to-Head specs
- [ ] Remove per-test join helpers or make them no-op (rely on storageState).
- [ ] Add a deterministic wait for compare page readiness (dropdowns visible + options loaded).
- [ ] After stability, address product bug: comparison section not visible after selecting two players.

### 4) Run strategy
- [ ] Run small scopes while iterating:
  - `ranking.spec.ts`
  - head-to-head specs
  - full suite
