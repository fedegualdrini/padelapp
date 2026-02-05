# INTEGRATIONS (Padelapp)

**Last mapped:** 2026-02-05

This document lists external services, CLIs, and third-party systems the repo integrates with, including where the integration lives in code and which env vars/configs are required.

## Supabase (Database + Auth + RPC)
**What it is:** Primary backend providing Postgres, Row-Level Security (RLS), auth, and SQL RPC functions.

**Where it’s used (app runtime):**
- Next.js middleware uses Supabase SSR to ensure a user session exists:
  - `src/middleware.ts`
- Server-side Supabase client (SSR cookie bridge):
  - `src/lib/supabase/server.ts`
- Browser-side Supabase client:
  - `src/lib/supabase/client.ts`

**Environment variables (required):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Both are validated at runtime in `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`.

**Schema / policies / SQL surface area:**
- Supabase migrations:
  - `supabase/migrations/*.sql`
- Seed file:
  - `supabase/seed.sql`
- The SQL layer includes RLS policies and RPC functions referenced from app code (examples):
  - Supabase RPC calls in server actions/pages (e.g. `supabase.rpc(...)`):
    - `src/app/g/[slug]/(protected)/players/[id]/page.tsx`
    - `src/app/g/[slug]/(protected)/matches/actions.ts`
    - `src/app/g/[slug]/(protected)/events/actions.ts`

**Operational guidance (prescriptive):**
- Use `createSupabaseServerClient()` from `src/lib/supabase/server.ts` for server actions / server components.
- Use the exported `supabase` browser client from `src/lib/supabase/client.ts` for client components.
- Put schema changes in a new file under `supabase/migrations/` and include corresponding RLS/policies in the same migration.

## Postgres (Direct connection for automation scripts)
**What it is:** Direct database access (service-level) used by Node scripts outside the Next.js runtime.

**Where it’s used:**
- WhatsApp automation bot connects via `pg`:
  - `scripts/wacli-thursday-bot.mjs` (imports `pg`, uses `new Client(...)`)

**Environment variables / config:**
- `BOT_DATABASE_URL` (documented in `scripts/wacli-thursday-bot.mjs` header comment)

**Notes:**
- This is separate from the browser/server Supabase client pattern; it’s intended for server-side automation where a raw Postgres connection string is available.

## WhatsApp (via `wacli` CLI / WhatsApp Web session)
**What it is:** Integration with a WhatsApp group chat using the unofficial `wacli` command-line tool (WhatsApp Web session) to ingest/send messages.

**Where it’s used:**
- Primary bot implementation:
  - `scripts/wacli-thursday-bot.mjs`
- Participant mapping helper:
  - `scripts/wacli-map-participants.mjs`
- Design/plan doc:
  - `docs/WHATSAPP_THURSDAY_ATTENDANCE_BOT_PLAN.md`

**Local-only config files (gitignored, required to run bot):**
- `.wacli-bot.json` (documented in `scripts/wacli-thursday-bot.mjs` and `docs/WHATSAPP_THURSDAY_ATTENDANCE_BOT_PLAN.md`)
  - Expected shape includes: `{ groupJid, padelGroupId, adminPhone }`
- `.wacli-bot-state.json` (created/updated by script)
  - Used for cursors/deduping and menu state; see `loadState()`/`saveState()` in `scripts/wacli-thursday-bot.mjs`.

**Database tables supporting WhatsApp identity mapping:**
- `whatsapp_identities` and `whatsapp_sender_identities` are created/configured in migrations:
  - `supabase/migrations/20260126_000001_attendance_planning.sql`
  - `supabase/migrations/20260126_000002_whatsapp_sender_identities.sql`

**Operational guidance (prescriptive):**
- Treat `wacli` as an external runtime dependency; the repo scripts assume `wacli` is installed and already authenticated.
- Restrict bot processing to a single configured group JID (implemented in `scripts/wacli-thursday-bot.mjs`).

## “Gateway / cron” automation tooling (Clawdbot/OpenClaw ecosystem)
**What it is:** Shell wrappers that interact with a local gateway daemon and cron job configuration managed outside this repo’s runtime.

**Where it’s used:**
- Health check and cron job manipulation scripts:
  - `scripts/check-gateway-health.sh` (calls `clawdbot health`, checks `clawdbot-gateway` process)
  - `scripts/retry-cron-op.sh`
  - `scripts/safe-cron-update.sh` (edits `/home/ubuntu/.clawdbot/cron/jobs.json`)

**Notes:**
- These scripts integrate with external binaries (`clawdbot`, gateway daemon) and external state paths under `/home/ubuntu/.clawdbot/`.
- This is operational tooling rather than an app runtime dependency.

## Vercel (hosting / env management)
**What it is:** Hosting platform commonly used for Next.js; the repo references Vercel environment workflows.

**Where it’s referenced:**
- User-facing instructions mention `vercel env pull`:
  - `src/app/page.tsx`

**Operational guidance (prescriptive):**
- Ensure Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are set in the deployment environment.

## Google Fonts (Next.js built-in integration)
**What it is:** Next.js font optimization pipeline pulling fonts from Google.

**Where it’s used:**
- `next/font/google` import in:
  - `src/app/layout.tsx`

**Notes:**
- This is a framework-provided integration; no explicit API keys are used.
