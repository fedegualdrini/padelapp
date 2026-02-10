# CONVENTIONS

Updated: 2026-02-05

This project is a **Next.js App Router** codebase written in **TypeScript**. Conventions below describe the *current* code patterns and should be followed when adding or changing code.

## Formatting & Style

### Indentation / whitespace
- Use **2 spaces** for indentation (enforced via `.editorconfig`).
  - Config: `.editorconfig`
- Use **LF** line endings, **UTF-8**, trim trailing whitespace, and ensure a final newline.
  - Config: `.editorconfig`

### Quotes / semicolons
- In `src/`, code predominantly uses **double quotes** and **semicolons**.
  - Example: `src/app/actions.ts`, `src/components/QuickActionsFAB.tsx`, `src/middleware.ts`
- In `tests/` and `scripts/`, single quotes are also common.
  - Example: `tests/unit/smoke.test.ts`, `scripts/test-db-reset.mjs`

**Recommendation for new code:** match the surrounding file’s existing style; when creating new files under `src/`, default to **double quotes** + **semicolons**.

### React directives
- Client components include the directive at the top of the module:
  - `"use client";` (example: `src/components/QuickActionsFAB.tsx`)
- Server actions modules include:
  - `"use server";` (example: `src/app/actions.ts`)

## TypeScript

### Strict type checking
- TypeScript is configured in **strict mode**.
  - Config: `tsconfig.json` (`"strict": true`)

### Path alias
- Use the `@/` alias for imports from `src/`.
  - Config: `tsconfig.json` → `compilerOptions.paths` maps `"@/*"` to `"./src/*"`
  - Example: `src/app/page.tsx` imports `getGroups` from `@/lib/data`

### Type-only imports
- Use `import type { ... }` for type-only imports.
  - Example: `src/app/layout.tsx` (`import type { Metadata } from "next";`)

## Module / file organization

### App Router structure
- Route segments live under `src/app/**`.
  - Page components: `src/app/page.tsx`, `src/app/matches/page.tsx`, `src/app/players/page.tsx`
  - Layout: `src/app/layout.tsx`
- Server actions are placed as colocated modules under `src/app/**`.
  - Example: `src/app/actions.ts`

### Components
- Shared UI and feature components live under `src/components/**`.
  - PascalCase filenames for React components.
  - Examples: `src/components/QuickActionsFAB.tsx`, `src/components/MatchCard.tsx`
- Lower-level “UI primitives” live under `src/components/ui/**`.
  - Example: `src/components/ui/button.tsx`

### Middleware
- Next.js middleware lives at `src/middleware.ts`.
  - Example: anonymous Supabase sign-in to ensure auth exists (`src/middleware.ts`)

## Imports

### Import ordering (practical convention)
Follow the existing pattern:
1. React / framework imports
2. Third-party libraries
3. Next.js imports
4. Local imports via `@/…`

Example pattern:
- `src/components/QuickActionsFAB.tsx` imports React hooks, then `lucide-react`, then `next/*`.
- `src/app/page.tsx` imports `next/link`, then local modules via `@/…`.

## Error handling & logging

- Server-side operations throw user-readable `Error` messages for validation failures.
  - Example: `src/app/actions.ts` throws Spanish error messages when form values are missing.
- When external calls fail, code logs structured context to `console.error` before throwing.
  - Example: `src/app/actions.ts` logs `{ authError }` and `{ error }` before throwing.

## Data / Supabase conventions (as used by app code)

- Server-side Supabase client creation is centralized.
  - `src/lib/supabase/server.ts` exports `createSupabaseServerClient()` and `hasSupabaseEnv()`.
- Middleware uses `@supabase/ssr` `createServerClient` directly to read/set cookies on the `NextResponse`.
  - `src/middleware.ts`

## Accessibility & UI behavior

- Components use ARIA attributes and keyboard handlers for interactive UI.
  - Example: `src/components/QuickActionsFAB.tsx` uses `aria-label`, `aria-expanded`, `role`, `tabIndex`, and handles `Escape`, `Enter`, Space, and arrow keys.

## Tooling gates (local workflow)

### Linting
- Linting is run via `npm run lint` and uses ESLint 9 + Next.js configs.
  - Config: `eslint.config.mjs`

### Pre-push hook
- A git pre-push hook runs the full check suite (typecheck, lint, unit tests, db reset, e2e).
  - Hook: `.githooks/pre-push`

## When adding new code

- Place new routes under `src/app/<segment>/...` and keep route-specific server actions colocated.
  - Examples: `src/app/actions.ts`, `src/app/players/actions.ts`
- Put reusable components under `src/components/` and prefer PascalCase filenames.
- Use `@/` alias for internal imports.
- Keep TypeScript strictness in mind; avoid `any` in app code.
