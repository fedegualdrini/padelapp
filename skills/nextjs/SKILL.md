---
name: nextjs-16
description: >
  Next.js 16 App Router patterns for this repo.
  Trigger: when working with routing, layouts, server components, middleware, or data fetching.
license: Apache-2.0
metadata:
  author: padel-app
  version: "1.0"
---

## App Router structure used here

```
src/app/
  layout.tsx                 # Root layout
  page.tsx                   # Home
  g/[slug]/layout.tsx        # Group gate + layout
  g/[slug]/join/page.tsx     # Join with passphrase
  g/[slug]/matches/*         # Match routes
  g/[slug]/players/*         # Player routes
  g/[slug]/pairs/*           # Pair stats
```

## Server Components (default)

Use Server Components for data fetching and page composition.

```ts
import { getPlayers } from "@/lib/data";

export default async function Page({ params }: { params: { slug: string } }) {
  const players = await getPlayers(params.slug);
  return <PlayersTable players={players} />;
}
```

## Client Components (only when needed)

Use "use client" for forms, toggles, or interactive UI. Keep data fetching in
Server Components or in server actions.

```ts
"use client";

export function ToggleThemeButton() {
  // client-only logic
}
```

## Data fetching

- Prefer `src/lib/data.ts` for all data access.
- Do parallel fetches with `Promise.all` when needed.
- Avoid client fetching for protected data; rely on RLS + server.

```ts
const [players, matches] = await Promise.all([
  getPlayers(slug),
  getMatches(slug),
]);
```

## Middleware

`src/middleware.ts` guarantees an anonymous Supabase session for every request.
Do not bypass or remove it without updating auth flow.

## Route handlers

Use Route Handlers only when necessary. Prefer Server Components and server
actions for most mutations.

## Keywords
nextjs, next.js, app router, server components, middleware, data fetching
