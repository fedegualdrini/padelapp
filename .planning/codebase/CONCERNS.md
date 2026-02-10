# CONCERNS (Technical Debt & Risks)

Date: 2026-02-05

This document lists concrete technical debt, correctness risks, and maintainability concerns found in the current codebase. Each item includes impact + suggested fix direction and points to exact file paths.

## 1) Routing correctness risk: using **groupId** where routes expect **group slug**

**Why it matters:** Many pages are under `src/app/g/[slug]/...`. Building URLs with a database `group_id` instead of the `slug` will produce broken navigation, missed cache invalidation, and confusing 404s.

**Evidence / hotspots**
- `src/app/tournament-actions.ts`
  - `revalidatePath(`/g/${groupId}`)`
  - `redirect(`/g/${groupId}/tournaments/${tournament.id}`)`
  - Similar uses in `updateTournamentStatusAction`, `addTournamentParticipantAction`, `updateTournamentMatchScoreAction`, `deleteTournamentAction`

**Suggested fix**
- Rename variables to reflect reality: `groupSlug` vs `groupId`.
- Change form payloads to include `group_slug` (or derive slug server-side).
- Add lightweight assertions:
  - If a value is expected to be a slug, validate it (e.g., `^[a-z0-9-]+$`) before using it in a route.

## 2) “God file” data layer: `src/lib/data.ts` is extremely large and mixes many concerns

**Why it matters:** Large, multi-responsibility modules become fragile (hard to refactor safely), hard to test, and tend to accumulate duplicated logic.

**Evidence**
- File size: `src/lib/data.ts` (~3352 lines; top largest TS file in `src/`).
- It contains demo-mode behavior, Supabase access, multiple domain areas, and shared types.

**Related concern: partial split causes duplication/confusion**
- A more modular data layer already exists in `src/lib/data/*`.
  - Example duplication: group functions exist in both `src/lib/data.ts` and `src/lib/data/groups.ts` (e.g., `getGroups`, `getGroupBySlug`, `getGroupByMatchId`, `isGroupMember`).

**Suggested fix**
- Continue the extraction already started under `src/lib/data/`:
  - Move domain functions out of `src/lib/data.ts` into `src/lib/data/{domain}.ts`.
  - Keep `src/lib/data.ts` as a thin re-export layer or delete it after migrations.
- Centralize shared types in one place (e.g., `src/lib/types/*`), avoiding multiple `Group` definitions.

## 3) Demo-mode behavior is implicit and can mask real production failures

**Why it matters:** Automatically switching to demo behavior when env is missing can hide configuration issues in staging/preview environments and can lead to code paths not being exercised.

**Evidence**
- `src/lib/data.ts`
  - `isDemoMode()` enables demo when Supabase env is missing (`return !hasSupabaseEnv();`).
  - Demo constants like `DEMO_GROUP`, `DEMO_PLAYERS` are defined inline.
- `src/app/g/[slug]/(protected)/events/actions.ts`
  - `cancelOccurrence`: demo bypass uses `slug === "demo"`.

**Suggested fix**
- Make demo-mode explicit via an env flag (e.g., `NEXT_PUBLIC_DEMO_MODE=true`) rather than “env missing”.
- Ensure server actions consistently guard demo bypasses and clearly return typed results.

## 4) Server actions have inconsistent error/return contracts

**Why it matters:** Inconsistent server action patterns create UX inconsistencies (some throw, others return `{ ok: true }` / `{ success: false }`), complicate callers, and hide errors.

**Evidence / examples**
- Throws errors (caller must handle exceptions):
  - `src/app/g/[slug]/(protected)/events/actions.ts` (e.g., `updateAttendance`, `createWeeklyEvent`, etc.)
- Returns success/error objects:
  - `src/lib/venue-actions.ts` functions return `{ success: boolean; error?: string }` style.
- Mixed return shapes within the same module:
  - `src/app/g/[slug]/(protected)/events/actions.ts` returns `{ ok: true }` in some places and throws in others.

**Suggested fix**
- Standardize a single pattern per layer:
  - Either always `throw` from server actions and let route/page handle boundaries, or always return discriminated unions (`{ ok: true, data } | { ok: false, error }`).
- Apply consistent typing for every action export.

## 5) Heavy reliance on Supabase RPCs without strong typing or centralized error handling

**Why it matters:** RPCs are powerful but easy to call incorrectly (parameter names/types drift), and failures can be silent if not handled consistently. Also, RPC calls are harder to trace/refactor than query-builder calls.

**Evidence**
- Multiple RPC call sites across app and lib:
  - `src/lib/tournament-data.ts` (e.g., `create_tournament`, `update_tournament_status`, `add_tournament_participant`, `update_match_score`)
  - `src/app/tournament-actions.ts` duplicates these RPC calls
  - `src/lib/racket-data.ts` (`get_racket_stats`, `compare_rackets`, etc.)
  - `src/app/matches/new/actions.ts`, `src/app/matches/[id]/edit/actions.ts` (`refresh_stats_views`, achievement checks, ELO recompute)

**Suggested fix**
- Centralize RPC wrappers in a single module per domain (e.g., `src/lib/rpc/tournaments.ts`) and export typed functions.
- Avoid duplicating the same RPC logic in both `src/lib/*` and `src/app/*`.

## 6) Incomplete features / placeholders shipped in data responses

**Why it matters:** Returning empty arrays for not-yet-implemented features can look like “no data” rather than “not supported”, leading to misleading UI and hidden requirements.

**Evidence**
- `src/lib/venue-data.ts`
  - `best_attendance: [] // TODO: Implement when match-venue linking is ready`
  - `most_played: [] // TODO: Implement when match-venue linking is ready`

**Suggested fix**
- Prefer explicit “not implemented” states:
  - Return `null` with `reason` metadata, or add a feature flag that hides UI sections.
- Track the missing dependency (“match-venue linking”) as a first-class task.

## 7) Performance/maintainability: large client components and large data modules

**Why it matters:** Large React client components are difficult to reason about and can carry accidental re-renders, bloated bundles, and duplicated formatting/logic.

**Evidence (largest TS/TSX files)**
- `src/app/g/[slug]/(protected)/events/EventsClient.tsx` (~617 lines)
- `src/app/g/[slug]/(protected)/calendar/CalendarClient.tsx` (~419 lines)
- `src/components/NewMatchForm.tsx` (~448 lines)
- `src/lib/venue-actions.ts` (~559 lines)

**Suggested fix**
- Refactor by extracting:
  - Pure utility functions into `src/lib/*`
  - UI subcomponents into `src/components/*`
  - Shared hooks into `src/hooks/*` (if present/desired)
- Add basic performance guardrails (memoization where appropriate; keep client bundles small).

## 8) Domain types are sometimes too loose (stringly-typed)

**Why it matters:** Using `string` for domain enums leads to invalid states reaching the DB/UI.

**Evidence**
- `src/lib/data.ts`
  - `type PlayerRow = { id: string; name: string; status: string }` (status should be a union like `'usual' | 'invite' | ...`)

**Suggested fix**
- Introduce shared domain unions and reuse them across modules.

## 9) Security/authorization consistency: membership checks exist but are not clearly enforced everywhere

**Why it matters:** Server actions must consistently enforce group membership/admin roles, especially when calling RPCs or mutating data.

**Evidence**
- Membership checks appear in places like:
  - `src/app/g/[slug]/(protected)/events/actions.ts` uses `isGroupMember(group.id)`
- Other action modules (e.g., tournaments in `src/app/tournament-actions.ts`) rely mostly on `auth.getUser()` and form-provided identifiers.

**Suggested fix**
- Make authorization a first-class helper (e.g., `requireGroupMember(slug)` / `requireGroupAdmin(slug)` in `src/lib/authz/*`).
- Avoid trusting `FormData` for `group_id`/`group_slug` without server-side validation.

## 10) Test gaps and “known TODOs” exist outside src (risk of regressions)

**Why it matters:** Missing E2E coverage + known TODO lists indicate behavior changes can break key flows.

**Evidence**
- `E2E_TODO.md` (top-level)
- E2E/test artifacts present: `tests/`, `test-scenarios/`, `test-reports/`

**Suggested fix**
- Convert the most critical items in `E2E_TODO.md` into Playwright tests (align with `playwright.config.ts`).

---

## Quick “next refactor” candidates (high ROI)

1) Fix slug/id routing bug in `src/app/tournament-actions.ts`.
2) Choose one source of truth for group data functions (`src/lib/data/groups.ts` vs `src/lib/data.ts`) and remove duplication.
3) Standardize server action error/return style (start with one domain module).
4) Create typed RPC wrappers to remove duplication and drift.
