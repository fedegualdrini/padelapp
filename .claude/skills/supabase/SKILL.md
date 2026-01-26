---
name: supabase-rls
description: >
  Supabase patterns for this repo: anonymous auth, group membership, RLS-first access.
  Trigger: when touching database schema, RLS, auth, or Supabase queries.
license: Apache-2.0
metadata:
  author: padel-app
  version: "1.0"
---

## Auth model

- Anonymous auth only (no email/password).
- Group access is passphrase-based.
- Membership is tracked in `group_members` and enforced by RLS.

## RLS-first data access

- All group data is scoped by `group_id`.
- Policies check `auth.uid()` membership in `group_members`.
- Never use service keys in app code.

## Supabase clients

Server:
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

Client:
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

Middleware ensures an anonymous session for every request.

## Passphrase flow

- Group creation hashes passphrase in the DB (pgcrypto/bcrypt).
- Join flow verifies passphrase via RPC and inserts membership.
- Keep passphrase logic in SQL functions/migrations.

## Data layer conventions

- All queries live in `src/lib/data.ts`.
- Always pass `group_id` for group-scoped tables.
- Let RLS be the source of truth for access control.

## Database helpers

```sql
select refresh_stats_views();
select recompute_all_elo();
```

## Migrations

- Add new schema or RLS changes in `supabase/migrations/`.
- Apply with `supabase db reset` or `supabase db push`.

## Keywords
supabase, rls, anonymous auth, group_members, pgcrypto, rpc
