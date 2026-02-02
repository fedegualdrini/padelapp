# UI/UX Review (claudio branch) — AppShell / layout / navigation consistency audit

**Date:** February 2, 2026  
**Agent:** ui-implementation-specialist  
**Branch:** claudio  

---

## What I checked
- All routes under `src/app/g/[slug]/**` plus legacy top-level routes (`/matches`, `/players`, `/pairs`).
- Where `AppShell` is applied (only via layouts).
- Container/spacing patterns, heading patterns, nav/back patterns, color/token usage, dark-mode/responsive risks.

---

# 1) Routes/pages with **Shell / Container** inconsistencies

## A. Group routes that **do NOT use AppShell at all** (no layout wrapper)
These routes render directly under `src/app/layout.tsx` and therefore miss:
- consistent header ("Padel Tracker" header area),
- consistent `NavBar`,
- consistent `main` max-width/padding,
- consistent `QuickActionsFAB` behavior (when expected).

### Missing AppShell (and therefore missing group navigation)
1. `src/app/g/[slug]/achievements/page.tsx` → `/g/:slug/achievements`
2. `src/app/g/[slug]/challenges/page.tsx` → `/g/:slug/challenges`
3. `src/app/g/[slug]/partnerships/page.tsx` → `/g/:slug/partnerships`
4. `src/app/g/[slug]/partnerships/[player1Id]/[player2Id]/page.tsx` → `/g/:slug/partnerships/:p1/:p2`
5. `src/app/g/[slug]/venues/page.tsx` → `/g/:slug/venues`
6. `src/app/g/[slug]/venues/[venueSlug]/page.tsx` → `/g/:slug/venues/:venueSlug`
7. `src/app/g/[slug]/venues/[venueSlug]/rate/page.tsx` → `/g/:slug/venues/:venueSlug/rate`
8. `src/app/g/[slug]/ranking-share/[token]/page.tsx` → `/g/:slug/ranking-share/:token` (this one may be intentionally "public/share", but it's still visually inconsistent)

**Impact:** these pages feel like a different product vs the rest of the authenticated group experience (matches/players/pairs/dashboard).

---

## B. Pages that **do use AppShell** via layouts (good baseline)
- `/g/:slug/(protected)/*` via `src/app/g/[slug]/(protected)/layout.tsx`
- `/g/:slug/matches/*` via `src/app/g/[slug]/matches/layout.tsx`
- `/g/:slug/players/*` via `src/app/g/[slug]/players/layout.tsx`
- `/g/:slug/pairs/*` via `src/app/g/[slug]/pairs/layout.tsx`
- `/g/:slug/join/*` via `src/app/g/[slug]/join/layout.tsx` (AppShell with `showNavigation={false}`)

---

## C. Legacy non-group route with inconsistent shell
- `src/app/matches/[id]/edit/page.tsx` → `/matches/:id/edit`  
  This page is *not* wrapped in `AppShell` and doesn't even apply a top-level container consistently. It also does group membership checks and redirects, so it behaves "group-like" but looks "non-group".

(Other legacy routes like `/matches`, `/matches/new`, `/players`, `/pairs` just `redirect("/")` and are fine.)

---

# 2) Page-by-page **specific issues**

## `/g/:slug/(protected)` dashboard — `src/app/g/[slug]/(protected)/page.tsx`
- **Critical:** `QuickActionsFAB` is rendered *twice*:
  - once in `AppShell` (`{showNavigation && <QuickActionsFAB slug={slug} />}`)
  - and again at the bottom of the dashboard page (`<QuickActionsFAB slug={slug} />`)
  **Result:** duplicated floating action button / overlapping UI.

- Minor: page structure is consistent with AppShell typography tokens.

## `/g/:slug/join` — `src/app/g/[slug]/join/page.tsx`
- **Double container padding:** AppShell already provides `main` with `max-w-6xl px-4 sm:px-6`. Join page adds `px-4 sm:px-6` again inside `max-w-lg`, creating "extra padded" feel vs other pages.
- Heading hierarchy differs (uses `<h1>` inside content). In AppShell, the global title is already `<h1>Padel Tracker`; most other internal pages use `<h2>...`.

## `/g/:slug/achievements` — `src/app/g/[slug]/achievements/page.tsx`
- **No AppShell** → no NavBar, no consistent group header.
- Uses the "design system" CSS variables (`var(--ink)`, `var(--card-glass)` etc.) which *suggests* it was intended to live inside AppShell; without it, the page feels abruptly different.
- Adds its own back button ("← Volver a jugadores") but no consistent group nav.

## `/g/:slug/challenges` — `src/app/g/[slug]/challenges/page.tsx` + dashboard component
- **No AppShell** (renders a full-screen alternate UI).
- **Visual system mismatch:** `ChallengesDashboard` uses a *full-screen* `min-h-screen` dark gradient background (`from-slate-900 ...`) that fights the global background and AppShell visual language.
- **Navigation inconsistency:** no `NavBar`, no consistent back link to group area.
- **Access behavior inconsistency:** if not member it returns `notFound()` (404) instead of redirecting to `/g/:slug/join` like other protected routes.

## `/g/:slug/partnerships` — `src/app/g/[slug]/partnerships/page.tsx`
- **No AppShell**.
- **Container mismatch:** uses `container mx-auto px-4 py-8 max-w-6xl` rather than AppShell's `main` container.
- **Design token mismatch:** uses `bg-white dark:bg-gray-900`, `text-gray-*`, "blue-600" etc. rather than `var(--*)` tokens.
- Copy is in English ("Partnership Analytics", "Reset", "Previous/Next") while most app copy is Spanish/rioplatense.

## `/g/:slug/partnerships/:p1/:p2` — `src/app/g/[slug]/partnerships/[player1Id]/[player2Id]/page.tsx`
- **No AppShell**.
- **Strong design divergence:** gradients, blue/purple avatars, `bg-white`, `text-gray-*`, English locale date formatting (`toLocaleDateString("en-US")`).
- Back link styling doesn't match the rest of the app (and uses English "Back to Partnerships").

## `/g/:slug/venues*` — venues list/detail/rate pages
- **No AppShell**.
- Mixed styling system: uses `text-slate-*`, `bg-white dark:bg-slate-800`, and shadcn `Button` — looks like a different UI kit than the main "glass + var() tokens" design.
- Containers are self-managed (`container mx-auto ...`), so spacing differs from AppShell-wrapped sections.
- Navigation: pages rely on local "Volver…" links rather than the consistent `NavBar`.

## `/g/:slug/ranking-share/:token` — `src/app/g/[slug]/ranking-share/[token]/page.tsx`
- No AppShell (likely intentional for bot screenshots).
- If the intention is "public share", this is fine; but the styling is closer to AppShell pages (uses var tokens). Consider either:
  - a minimal "ShareShell" for consistent padding/typography, or
  - explicitly keep it "shell-less" but ensure it has consistent container.

## `/matches/:id/edit` — `src/app/matches/[id]/edit/page.tsx`
- No AppShell; appears as an "orphan" UI.
- Should probably redirect to the group-scoped edit route or reuse the same shell/layout pattern.

---

# 3) Recommended fixes + implementation approach

## A. **Unify group shell & membership** with a single protected layout (preferred)
Goal: every group-authenticated route lives under a single segment layout that:
- checks group existence,
- checks membership,
- wraps with `AppShell showNavigation={true}`.

**Approach options:**

### Option 1 (cleanest): move all group-auth routes under `(protected)`
Move these folders into `src/app/g/[slug]/(protected)/...`:
- `matches/`
- `players/`
- `pairs/`
- `achievements/`
- `challenges/` (if intended to be part of the standard app shell)
- `partnerships/`
- `venues/`
- already there: `ranking/`, `events/`, `calendar/`, dashboard page.

Then delete the now-redundant layouts:
- `src/app/g/[slug]/matches/layout.tsx`
- `src/app/g/[slug]/players/layout.tsx`
- `src/app/g/[slug]/pairs/layout.tsx`

### Option 2 (less invasive): add `src/app/g/[slug]/layout.tsx` AppShell + membership
This would wrap *all* `/g/:slug/*` routes automatically, but you'd need exclusions for:
- `/g/:slug/join` (should be `showNavigation={false}` and no membership requirement)
- `/g/:slug/ranking-share/:token` (public/share; should not require membership)

You can solve this by route grouping:
- `g/[slug]/(public)/ranking-share/...`
- `g/[slug]/(auth)/...` with AppShell+membership
- `g/[slug]/join/...` with AppShell `showNavigation={false}`

## B. Normalize containers inside pages
Once AppShell is used, most pages should return content like:
- `<div className="flex flex-col gap-6">...</div>`
…and **avoid** reintroducing `container mx-auto px-4 ...` (double padding / inconsistent width).

Specifically:
- `join/page.tsx`: drop inner `px-4 sm:px-6` (keep max-width/centering only).
- venues/partnerships pages: remove `container mx-auto ...` once AppShell wraps them.

## C. Make visual design consistent (tokens + components)
- Decide whether the app's primary design system is:
  - the CSS variable + "glass card" style (current AppShell pages), or
  - the shadcn "white/slate" style (venues pages), or
  - a blended approach with a shared token mapping.
- For consistency, recommend migrating venues/partnerships/challenges to the AppShell token style:
  - replace `bg-white dark:bg-slate-800` with `bg-[color:var(--card-glass)]` etc.
  - replace `text-gray-* / text-slate-*` with `text-[var(--ink)] / text-[var(--muted)]`
  - unify buttons to the same pill style used elsewhere (or wrap shadcn button with consistent variants).

## D. Fix navigation patterns
- Once pages are inside AppShell, they get `NavBar`. Still:
  - keep "Back" links for deep pages (venue detail, partnership detail) but style them consistently (same pill/button style used in player profile).
  - ensure language consistency (Spanish vs English).

## E. Fix the duplicated QuickActions FAB
- Remove `<QuickActionsFAB slug={slug} />` from `src/app/g/[slug]/(protected)/page.tsx` (dashboard), since AppShell already renders it when `showNavigation=true`.

## F. Deprecate or redirect legacy `/matches/:id/edit`
- Easiest: `redirect("/")` or redirect to computed group path (if you can resolve slug quickly).
- Better: remove the route if not used.
- If it must exist, wrap it in a small shell or re-route to `/g/:slug/matches/:id/edit`.

---

# 4) Priority order (Critical → Nice-to-have)

## Critical
1. **Duplicate `QuickActionsFAB` on group dashboard** (`(protected)/page.tsx`) — visible UI bug.
2. **Missing AppShell on major group routes** (`achievements`, `challenges`, `partnerships`, `venues`) — breaks navigation and core IA consistency.
3. **Inconsistent membership handling** (`challenges` returns 404 vs redirect join) — confusing UX and inconsistent auth story.

## High
4. **Design system divergence** (venues/partnerships/challenges using gray/slate + gradients vs var-token glass UI) — feels like multiple apps stitched together.
5. **Heading hierarchy + page header consistency** (some pages using `h1`, others `h2`; some missing the eyebrow label pattern).

## Medium
6. **Double padding / container nesting** on join page (and any other pages that add `container` inside AppShell).
7. **Language consistency** (English strings and en-US date formatting in partnerships pages).

## Nice-to-have
8. Add a lightweight "ShareShell" for `/ranking-share` to standardize padding/typography while staying screenshot-friendly.
9. Unify "back" link components (create a shared `BackButton`/`SubPageHeader` pattern).

---

# Notes for Implementation
The UI specialist agent mentioned: "If you want, I can also propose a concrete 'target structure' for `src/app/g/[slug]/(protected)/...` (folder moves + which layouts to delete) to minimize churn while achieving full shell consistency."

This can be requested when starting the implementation phase.