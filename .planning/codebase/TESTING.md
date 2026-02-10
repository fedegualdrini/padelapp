# TESTING

Updated: 2026-02-05

This repo uses **Vitest** for unit tests and **Playwright** for end-to-end (E2E) tests. The default `npm test` workflow also includes **TypeScript typechecking**, **ESLint**, and a **test database reset** step.

## Quick commands (what to run)

### Full local verification (pre-PR)
```bash
npm test
```
Defined in `package.json`:
- `test`: `npx run-s typecheck lint test:unit test:db test:e2e`

### Typecheck
```bash
npm run typecheck
```
- Uses `tsc -p tsconfig.json --noEmit` (see `package.json`).

### Lint
```bash
npm run lint
```
- ESLint config: `eslint.config.mjs` (Next.js core-web-vitals + typescript presets).

### Unit tests
```bash
npm run test:unit
```
- Runs `vitest run` (see `package.json`).

### Reset test DB (required for `npm test`)
```bash
npm run test:db
```
- Runs `node scripts/test-db-reset.mjs`.

### E2E tests
```bash
npm run test:e2e
```
- Runs `playwright test` (config in `playwright.config.ts`).

## Unit testing (Vitest)

### Configuration
- Config file: `vitest.config.ts`
  - `environment: 'jsdom'`
  - `setupFiles: ['./vitest.setup.ts']`
  - `include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}']`
- Setup file: `vitest.setup.ts`
  - Adds Testing Library matchers via `@testing-library/jest-dom/vitest`.

### Where unit tests live
- `tests/unit/**/*.test.ts(x)`
  - Examples:
    - `tests/unit/smoke.test.ts`
    - `tests/unit/quick-actions-fab.test.tsx`
    - `tests/unit/head-to-head.test.ts`
- `src/**/*.test.ts(x)` (supported by `vitest.config.ts` include pattern)

### Patterns used in unit tests

#### React component tests
- Uses React Testing Library to `render`, interact with DOM, and assert on ARIA/text.
  - Example: `tests/unit/quick-actions-fab.test.tsx`
    - `render(<QuickActionsFAB ... />)`
    - `fireEvent.click(...)`, `fireEvent.keyDown(...)`
    - `waitFor(...)` for async UI updates

#### Next.js module mocking
- Uses `vi.mock(...)` for Next.js App Router hooks.
  - Example: `tests/unit/quick-actions-fab.test.tsx`
    - `vi.mock('next/navigation', () => ({ usePathname, useRouter, useSearchParams }))`

#### Server-side module mocking
- Mocks internal modules via `@/` alias.
  - Example: `tests/unit/head-to-head.test.ts`
    - `vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: ... }))`

## E2E testing (Playwright)

### Configuration
- Config: `playwright.config.ts`
  - `testDir: './tests/e2e'`
  - `globalSetup: './tests/e2e/global-setup.ts'`
  - `workers: 1` (serial-ish to reduce flake)
  - `timeout: 300000` (5 minutes)
  - Reporters: list + html + json (`test-results/results.json`)
  - `use.storageState: './tests/e2e/.auth/state.json'` (auth/session persisted)
  - `use.trace: 'on-first-retry'`, screenshots on, video retain-on-failure
  - Local dev (non-CI) starts `npm run dev` as `webServer`.

### Auth/session bootstrapping
- Global setup logs into/joins the default group and persists auth state:
  - File: `tests/e2e/global-setup.ts`
  - Flow:
    - Visits `/g/padel/join`
    - If join prompt is visible, fills passphrase and submits
    - Verifies `/g/padel/ranking` is reachable
    - Saves storage state to `tests/e2e/.auth/state.json`

### Where E2E tests live
- `tests/e2e/**/*.spec.ts`
  - Examples:
    - `tests/e2e/auth.spec.ts`
    - `tests/e2e/core-flows.spec.ts`
    - `tests/e2e/ranking.spec.ts`

### Common E2E patterns
- Navigate with relative paths and rely on `baseURL`.
  - Example: `tests/e2e/auth.spec.ts` uses `page.goto('/g/padel/ranking')`.
- Prefer resilient locators:
  - `page.getByRole('button', { name: /.../i })` (example: `tests/e2e/global-setup.ts`)
  - Fallback `locator('button:has-text("...")')` patterns exist in some specs.
- Use explicit waits to reduce flakes:
  - `page.waitForLoadState('networkidle')` is frequently used (example: `tests/e2e/auth.spec.ts`).
- When global setup fails, a screenshot is written for debugging.
  - `tests/e2e/global-setup.ts` writes `tests/e2e/.auth/global-setup-failed.png`.

## Test database reset (required for full suite)

### Safety latches
The reset step **drops and recreates the `public` schema**.
- Script: `scripts/test-db-reset.mjs`
- Required env vars:
  - `DATABASE_URL` (must point to a dedicated test database)
  - `TEST_DB_ALLOW_RESET=true` (explicit confirmation)

### What the reset does
- Connects to Postgres using `pg`.
- `DROP SCHEMA IF EXISTS public CASCADE;` then recreates `public`.
- Applies SQL migrations from `supabase/migrations/*.sql` (sorted).
- Applies seed data from `supabase/seed.sql`.

### Helpers for local runs
- Script for verifying the test DB has required tables and seed data:
  - `scripts/verify-test-db.sh` (invoked by `npm run test:verify`)
- Script to run E2E tests using `.env.test` and performing the DB reset first:
  - `scripts/run-e2e-tests.sh` (invoked by `npm run test:e2e:full`)

## Local workflow gates

### Git pre-push
A pre-push hook enforces the full suite before pushing.
- Hook: `.githooks/pre-push`
- Runs: `typecheck`, `lint`, `test:unit`, `test:db`, `test:e2e`
- Loads `.env.test` if present.

## Adding new tests (how to fit in)

### Add a unit test
- Place it under `tests/unit/` with a `*.test.ts` / `*.test.tsx` suffix.
- Use Vitest APIs (`describe/it/expect`) and, for React, React Testing Library.
- If you need Next.js hooks, mock `next/navigation` as done in `tests/unit/quick-actions-fab.test.tsx`.

### Add an E2E test
- Place it under `tests/e2e/` with a `*.spec.ts` suffix.
- Assume the user is already joined/authenticated via `tests/e2e/global-setup.ts` and storageState.
- Prefer role-based locators (`getByRole`, `getByLabel`, etc.) to reduce fragility.
