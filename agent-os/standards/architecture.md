# Architecture

## Project Structure

```
padelapp/
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── (auth)/            # Auth routes (login, signup)
│   │   ├── (home)/            # Home page routes
│   │   ├── g/
│   │   │   └── [slug]/        # Group-specific routes
│   │   │       ├── (protected)/  # Protected group pages
│   │   │       │   ├── calendar/
│   │   │       │   ├── challenges/
│   │   │       │   ├── matches/
│   │   │       │   ├── players/
│   │   │       │   ├── ranking/
│   │   │       │   └── venues/
│   │   │       └── join/      # Join group public page
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # UI library components
│   │   ├── matches/          # Match-related components
│   │   ├── players/          # Player-related components
│   │   └── widget/           # Widget components
│   └── lib/                   # Utility functions
│       └── supabase/         # Supabase clients
├── tests/
│   ├── e2e/                  # Playwright E2E tests
│   │   ├── auth/
│   │   ├── groups/
│   │   └── matches/
│   └── unit/                 # Vitest unit tests
├── supabase/
│   ├── migrations/           # Database migrations
│   └── functions/            # Edge functions
├── skills/                   # Agent skills documentation
│   ├── nextjs/
│   ├── react/
│   ├── supabase/
│   └── tailwind/
├── public/                   # Static assets
└── agent-os/                 # Agent OS standards
    └── standards/
```

## Conventions

### File Organization
- **Components**: Group by domain in `src/components/{domain}/`
- **Pages**: Next.js App Router in `src/app/`
- **Tests**: Separate unit and E2E tests in `tests/`
- **Lib**: Shared utilities in `src/lib/`
- **Skills**: Documentation in `skills/`

### Naming Conventions
- **Components**: PascalCase (`MatchCard.tsx`)
- **Files**: camelCase for utilities (`formatDate.ts`)
- **Routes**: lowercase with hyphens (`match-history`)
- **Folders**: lowercase, descriptive

### Import Patterns
```typescript
// Components
import { MatchCard } from '@/src/components/matches/MatchCard';

// Lib utilities
import { formatDate } from '@/src/lib/utils';

// Supabase
import { createClient } from '@/src/lib/supabase/client';
```

### Route Structure
- `/` - Home/landing
- `/g/[slug]/` - Group dashboard
- `/g/[slug]/join` - Join group
- `/g/[slug]/matches` - Match history
- `/g/[slug]/players` - Player list
- `/g/[slug]/ranking` - ELO rankings

### Protected Routes
Routes under `/(protected)/` require authentication via Supabase middleware.

## Anti-patterns (Avoid)
- Don't put business logic in components - use custom hooks
- Don't access Supabase directly from components - use lib functions
- Don't create circular dependencies between components
