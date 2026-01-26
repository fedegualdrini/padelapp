# Testing (Local + Pre-PR)

## One command before opening a PR

```bash
npm test
```

This runs, in order:
1. Typecheck
2. Lint
3. Unit tests (Vitest)
4. Database reset (drop + recreate `public` schema, apply migrations, apply seed)
5. Playwright E2E

---

## Requirements

### DB reset step (required for `npm test`)
The test suite resets the database to a known-good state on every run.

Set these environment variables:

- `DATABASE_URL` – Postgres connection string for a **dedicated test database**.
- `TEST_DB_ALLOW_RESET=true` – safety latch; required because the reset step **drops the `public` schema**.

Example:

```bash
export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres'
export TEST_DB_ALLOW_RESET=true
npm test
```

Notes:
- Use a **separate Supabase project** (or separate database) for tests.
- Do **not** point this at production.

---

## Unit tests

```bash
npm run test:unit
```

Files:
- `tests/unit/**/*.test.ts(x)`
- `src/**/*.test.ts(x)`

---

## E2E tests

```bash
npm run test:e2e
```

Playwright config: `playwright.config.ts`

The E2E tests expect the seed data from `supabase/seed.sql` to be present:
- group slug: `padel`
- passphrase: `padel`
