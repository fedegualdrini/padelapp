# STACK (Padelapp)

**Last mapped:** 2026-02-05

## Runtime / Platform
- **Node.js** runtime (not pinned in-repo; no `.nvmrc` / `.node-version` detected)
- **Package manager:** npm
  - Manifest: `package.json`
  - Lockfile: `package-lock.json`

## Language / Type System
- **TypeScript** (strict)
  - Config: `tsconfig.json`
  - Notable settings: `"strict": true`, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`
  - Path alias: `@/*` → `src/*` (see `compilerOptions.paths` in `tsconfig.json`)

## Web Framework
- **Next.js (App Router)**
  - Version: `next@16.1.3` (`package.json`)
  - App Router root: `src/app/**`
  - Middleware: `src/middleware.ts`
  - Next config: `next.config.ts`
    - Enables `experimental.serverComponentsExternalPackages` for `@supabase/ssr` and `@supabase/supabase-js`.

## UI / Rendering
- **React 19**
  - `react@19.2.3`, `react-dom@19.2.3` (`package.json`)
- **Theming:** `next-themes` (`package.json`)
- **Icons:** `lucide-react` (`package.json`)
- **Charts:** `lightweight-charts` (`package.json`)
- **Client data fetching/cache:** `swr` (`package.json`)
- **Dates:** `date-fns` (`package.json`)

## Styling
- **Tailwind CSS v4**
  - Dependencies: `tailwindcss`, `@tailwindcss/postcss` (`package.json`)
  - PostCSS config: `postcss.config.mjs`
- **Fonts via Next.js:** `next/font/google`
  - Example: `src/app/layout.tsx`

## Data / Backend / Persistence
- **Supabase (primary backend)**
  - Packages: `@supabase/supabase-js`, `@supabase/ssr` (`package.json`)
  - Browser client: `src/lib/supabase/client.ts` (uses `createBrowserClient`)
  - Server client (SSR + cookie bridge): `src/lib/supabase/server.ts` (uses `createServerClient`)
  - Auth bootstrapping middleware: `src/middleware.ts` (ensures anonymous session)
- **Postgres (via Supabase)**
  - SQL migrations: `supabase/migrations/*.sql`
  - Seed: `supabase/seed.sql`
  - Node scripts using raw Postgres driver `pg`: `scripts/*.mjs` (e.g. `scripts/wacli-thursday-bot.mjs`, `scripts/push-remote-migrations.mjs`)

## Authentication
- **Supabase Auth**
  - Anonymous auth enforced in middleware: `src/middleware.ts` (`supabase.auth.signInAnonymously()`)
  - Server-side user check: `src/lib/supabase/server.ts`

## Tooling: Lint / Typecheck
- **ESLint 9**
  - Config: `eslint.config.mjs`
  - Script: `npm run lint` (`package.json`)
- **Typecheck:** `tsc --noEmit`
  - Script: `npm run typecheck` (`package.json`)
- **EditorConfig:** `.editorconfig`

## Testing
- **Unit tests:** Vitest
  - Config: `vitest.config.ts`
  - Setup: `vitest.setup.ts`
  - Script: `npm run test:unit` (`package.json`)
- **E2E tests:** Playwright
  - Config: `playwright.config.ts`
  - Test roots: `tests/`, `test-scenarios/` (repo-level)
  - Script: `npm run test:e2e` (`package.json`)
- **DOM test utilities:** `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` (`package.json`)

## Repo Automation / Ops Scripts
- Shell/Node scripts under `scripts/` are invoked via npm scripts in `package.json`.
  - Test DB reset helper: `scripts/test-db-reset.mjs` (`npm run test:db`)
  - E2E orchestration: `scripts/run-e2e-tests.sh`, `scripts/test-with-timeout.sh`
  - Cron/gateway helpers: `scripts/check-gateway-health.sh`, `scripts/retry-cron-op.sh`, `scripts/safe-cron-update.sh`
  - Remote DB migration push helpers (raw `pg`): `scripts/push-remote-migrations.mjs`, `scripts/push-remote-venues-only.mjs`

## Deployment / Hosting
- **Vercel** is referenced as the intended Next.js hosting target.
  - Env var guidance in `README.md` ("## Vercel")
  - App copy references `vercel env pull`: `src/app/page.tsx`

## Prescriptive: how to extend the stack
- Add runtime deps to `dependencies` and tooling/test deps to `devDependencies` in `package.json`.
- For Supabase access:
  - Server code: use `createSupabaseServerClient()` from `src/lib/supabase/server.ts`.
  - Client components: use `supabase` from `src/lib/supabase/client.ts`.
- For schema changes: add a new migration under `supabase/migrations/` and keep RLS/policies in the same migration file.
