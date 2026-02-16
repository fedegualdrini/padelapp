# Tech Stack

## Frontend

- **React 19.2.3** with TypeScript 5
- **Next.js 16.1.3** (App Router)
- **Tailwind CSS v4** for styling (`@tailwindcss/postcss`, `tailwindcss`)
- **next-themes** for dark mode
- **lucide-react** for icons
- **SWR** for data fetching
- **date-fns** for date handling

## Backend

- **Next.js 16 App Router** (API routes in `app/api/`)
- **Supabase** for auth, database, RLS
  - `@supabase/supabase-js` v2.90.1
  - `@supabase/ssr` v0.8.0
- **PostgreSQL** via Supabase

## Testing

- **Playwright** v1.57.0 for E2E tests
- **Vitest** v4.0.18 for unit tests
- **Testing Library** for React component testing
  - `@testing-library/react` v16.3.2
  - `@testing-library/jest-dom` v6.9.1
- **jsdom** for DOM simulation

## Development Tools

- **TypeScript 5** for type safety
- **ESLint 9** with `eslint-config-next`
- **npm-run-all** for running multiple scripts
- **pg** for direct PostgreSQL access in tests

## Other

- **lightweight-charts** for data visualization
- **Supabase CLI** v2.72.8 for local development and migrations

## Commands

```bash
# Development
npm run dev                 # Start dev server

# Testing
npm run test               # Run all tests (typecheck + lint + unit + db + e2e)
npm run test:unit          # Run Vitest unit tests
npm run test:e2e           # Run Playwright E2E tests
npm run test:db            # Test database reset
npm run test:e2e:full      # Full E2E suite with script

# Code Quality
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking
npm run build              # Production build
```
