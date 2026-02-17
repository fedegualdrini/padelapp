# Padelapp Roadmap

> Last updated: 2026-02-16
> Owner: Padel Team

## Vision

A multi-group padel tracker with ELO rankings, match history, and group management - helping padel communities organize and compete.

---

## Current Sprint: Sprint 2 (2026-02-16 to 2026-03-02)

### Goals
✅ **COMPLETED**: Audit codebase and document findings
✅ **COMPLETED**: Verify CI/CD setup
🔥 **IN PROGRESS**: Identify quick wins for UX improvements
🔥 **IN PROGRESS**: Assign feature development tasks
🔥 **IN PROGRESS**: Complete monetization analysis

### Sprint 2 Focus
**Phase: Execution (Move from Audit → Ship)**

**Key Priorities (per Fede 2026-02-16):**

**PHASE: Product-First** (Monetization on hold until product + UX + user base are solid)

1. 🔥 **Mobile Responsiveness** - @Jordan to fix mobile UX issues **OWNER PRIORITY #1**
2. 🔥 **UX Quick Wins** - @Maya to finalize top 3 improvements from audit **OWNER PRIORITY #2**
3. 🔥 **User Growth & Retention** - @Sam to analyze what drives engagement (NOT monetization) **OWNER PRIORITY #3**
4. **DB Optimization** - @Chris to add suggested indexes from audit
5. **CI/CD Hardening** - @Taylor to merge PR #14 (dependency updates) + add E2E to CI
6. **Feature Assignment** - Assign owners for quick win implementations

**What's Changed:** Monetization pilot on hold. Focus shifted to product polish + user base growth first.

**Owner Constraints (Do Not Touch):**
- ❌ No ELO calculation changes without Fede's approval
- ❌ No paywalls on core features (monetize clubs, not players)

**Task Assignments:**
| Task | Owner | Priority | Due | Status | Notes |
|------|-------|----------|-----|--------|-------|
| **Mobile responsiveness fix** | @Jordan | 🔥 **High** | Feb 20 | In Progress | **Fede's top priority #1** |
| **UX Quick Wins (top 3)** | @Maya | 🔥 **High** | Feb 17 | In Progress | **Fede's priority #2** |
| **User growth & retention analysis** | @Sam | 🔥 **High** | Feb 25 | In Progress | **Pivot: NOT monetization** Analyze engagement drivers |
| Add DB indexes | @Chris | High | Feb 19 | Ready | Per Fede's feedback |
| UI/UX audit completion | @Jordan | High | Feb 18 | In Progress | Includes mobile audit |
| Merge PR #14 + CI E2E | @Taylor | High | Feb 17 | Ready | |
| Quick Win #1 assignment | TBD | High | Feb 18 | Pending | |
| Quick Win #2 assignment | TBD | Medium | Feb 21 | Pending | |
| Quick Win #3 assignment | TBD | Medium | Feb 24 | Pending | |

**Sprint Success Criteria:**
- [ ] Top 3 UX quick wins identified and prioritized
- [ ] Monetization analysis document complete
- [ ] CI runs full test suite (lint + build + E2E)
- [ ] Feature owners assigned for Sprint 3

---

## Previous Sprint: Sprint 1 (2026-02-02 to 2026-02-15)

### Goals
✅ **COMPLETED**: Audit codebase and document findings
✅ **COMPLETED**: Verify CI/CD setup
- [x] Initial team onboarding
- [x] Repository structure review
- [x] Tech stack documentation

### Summary
Sprint 1 focused on comprehensive codebase audit. Successfully documented:
- Full feature inventory (15+ features identified)
- Tech stack confirmation (Next.js 16 + React 19 + Supabase)
- CI/CD gaps identified (E2E tests not running in CI)
- Database architecture review complete
- Test coverage baseline established

**Key Findings:**
- Strong foundation with ELO rankings, match history, group management
- Missing: E2E tests in CI, coverage reporting
- Opportunity: 3 clear UX quick wins from audit

### Audit Results (2026-02-16)

**Tech Stack Confirmed:**
- Next.js 16.1.3 + React 19.2.3 + TypeScript 5
- Supabase (anonymous auth, RLS, Postgres)
- Tailwind CSS v4 + next-themes
- Playwright (E2E) + Vitest (Unit tests)

**Existing Features:**
- Multi-group padel tracker with passphrase-based access
- Match recording (create, edit, view) with set scores
- Player management (regular + invite players)
- Pair statistics and ELO rankings
- Head-to-head player comparisons
- Match predictions based on ELO
- Recent form tracking (streaks, hot/cold indicators)
- Calendar/events view for scheduling
- Partnership analysis
- Venues with ratings
- Racket tracking per player
- Achievements system
- Challenges/tournaments support

**CI/CD Status:**
- GitHub Actions workflow: `/github/workflows/ci.yml`
- Runs: lint, build on push to main/Preview
- MISSING: E2E tests in CI, deployment steps

**Test Coverage:**
- Unit tests: 4 test files (smoke, head-to-head, streaks, quick-actions)
- E2E tests: 16+ spec files covering core flows
- Issue: CI only runs lint/build, not full test suite

**Database:**
- 15+ tables with RLS policies
- Materialized views for stats (`mv_player_stats_v2`, `mv_pair_aggregates`)
- ELO calculation system with history tracking
- Migration files in `supabase/migrations/`

### Task Assignments

| Team Member | Task | Priority | Details |
|-------------|------|----------|---------|
| @Maya | Feature inventory & user flows | High | Document all existing features, identify gaps |
| @Sam | Monetization research | Medium | Analyze revenue opportunities for padel groups |
| @Chris | DB audit complete | High | Review migrations, indexes, query performance |
| @Jordan | UI/UX audit | High | Accessibility check, responsive design audit |
| @Taylor | CI/CD health | High | Fix CI to run full test suite, add coverage |

### Assigned
- @Alex (Orchestrator): Sprint coordination, repo audit ✓ COMPLETE
- @Maya (Product): Feature inventory, user flow analysis
- @Sam (Growth): Monetization opportunities research
- @Chris (Backend): DB audit, migration review
- @Jordan (Frontend): UI/UX audit, accessibility check
- @Taylor (QA): Test coverage audit, CI/CD health

---

## Backlog

### 🔥 Priority: High (Must Have)

| ID | Feature | Owner | Status | Notes |
|----|---------|-------|--------|-------|
| P1 | TBD | - | - | First audit will populate |

### ⭐ Priority: Medium (Should Have)

| ID | Feature | Owner | Status | Notes |
|----|---------|-------|--------|-------|
| S1 | TBD | - | - | First audit will populate |

### 💡 Priority: Low (Could Have)

| ID | Feature | Owner | Status | Notes |
|----|---------|-------|--------|-------|
| C1 | TBD | - | - | First audit will populate |

### 💰 Revenue/Monetization

| ID | Feature | Owner | Status | Notes |
|----|---------|-------|--------|-------|
| R1 | TBD | - | - | First audit will populate |

---

## Completed

| Sprint | Date | Summary |
|--------|------|---------|
| - | - | - |

---

## Technical Debt

| Issue | Priority | Owner | Status |
|-------|----------|-------|--------|
| TBD | - | - | - |

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-16 | Create AI agent team | Scale development, enable proactive improvements |
| 2026-02-16 | Prioritize mobile responsiveness | Fede: Core UX blocker for casual players |
| 2026-02-16 | Pilot B2B monetization first | Fede: Validate with clubs before other models |
| 2026-02-16 | Keep free tier generous | Fede: Monetize clubs, not players |

---

## Metrics to Track

- Active groups
- Matches recorded
- Player retention
- Feature usage

---

*This roadmap is maintained by the Padel Team agents. Updated every sprint.*
