# Padel Team Education Plan

**STATUS: ✅ APPROVED — Installation in Progress**

> Created: 2026-02-16
> Approved: 2026-02-16 (by Fede)
> Author: Padel Education Lead (AI Agent)
> Target: Padel Agent Team (Jordan, Chris, Taylor, Maya, Sam, Alex)

## Current Installation Status (Updated: 2026-02-16)

| Skill | Version | Status | Notes |
|-------|---------|--------|-------|
| `playwright-browser-automation` | 2.0.0 | ✅ Installed | Ready for Taylor |
| `ui-ux-pro-max` | 0.1.0 | ✅ Installed | Ready for Maya + Jordan |
| `accessibility` | 0.1.0 | ✅ Installed | Ready for Jordan |
| `lb-supabase-skill` | - | ⏳ Pending | Rate limits - will retry tomorrow |
| `supabase-optimization` | 1.0 (custom) | ✅ Created | Workaround for Chris |
| `pr-reviewer` | 1.0.0 | ✅ Installed | Ready for All |

**Quickstart Guides Created:** ✅ All 5 skills have role-specific quickstarts in `/docs/education/QUICKSTARTS/`

**Skills Matrix:** ✅ Documented in `/docs/education/SKILLS_MATRIX.md`

**Workaround:** Created custom `supabase-optimization` skill for Chris since ClawHub rate limits prevented lb-supabase-skill installation. Will retry lb-supabase-skill tomorrow.

---

## Executive Summary

This education plan proposes 5 high-impact skills from ClawHub to address current roadmap priorities and pain points. Each skill maps directly to active sprint tasks and team member responsibilities.

**Current Context (Sprint 2):**
- 🔥 Mobile responsiveness (Jordan - #1 priority)
- 🔥 UX Quick Wins (Maya - #2 priority)
- 🔥 User Growth & Retention (Sam - #3 priority)
- DB Optimization (Chris - indexing recommended)
- CI/CD Hardening (Taylor - E2E tests needed in CI)
- PR Hygiene needed for smoother collaboration

---

## Candidate Skills (Top 5)

### 1. Playwright Browser Automation

**Source:** `clawhub search Playwright Browser Automation`
- Slug: `playwright-browser-automation` v2.0.0
- Search query used: "Playwright"
- Score: 3.435

**Summary:**
Complete Playwright framework for browser automation and E2E testing. Covers page objects, test patterns, CI integration, and best practices for reliable test suites.

**Why It Helps THIS Team:**
Directly addresses Taylor's CI/CD hardening task. The roadmap identifies that "E2E tests not running in CI" is a gap. Adding this skill enables Taylor to:
- Integrate existing Playwright tests into GitHub Actions CI workflow
- Improve test reliability and reduce flakiness
- Enable faster feedback loops for PRs

**Agents Who Should Use It:**
- **Taylor** (Primary) - CI/CD hardening, E2E test integration
- **Jordan** (Secondary) - Validate UI changes with E2E tests
- **Alex** (Orchestrator) - Monitor test coverage in sprint reviews

**How It Changes Workflow:**
**Before:** Taylor manually runs E2E tests or they're skipped in CI. PR merges without full test coverage.

**After:**
- Every PR runs full E2E suite automatically in CI
- Test failures block merges, catching regressions early
- Taylor can add new E2E tests with confidence using proven patterns
- Sprint reviews include test coverage metrics (current gap: no coverage reporting)

**Example Use Case:**
Jordan fixes mobile responsiveness bug → PR triggers CI → E2E tests verify mobile viewports (iPhone, iPad) → Merge only if green.

---

### 2. UI/UX Pro Max

**Source:** `clawhub search UI/UX design`
- Slug: `ui-ux-pro-max` v0.1.0
- Search query used: "UX design user experience"
- Score: 1.112

**Summary:**
Comprehensive UI/UX design guidance covering mobile-first principles, accessibility, user psychology, and actionable quick-win strategies. Includes heuristics, pattern libraries, and design system thinking.

**Why It Helps THIS Team:**
Directly supports Jordan's mobile responsiveness (#1 priority) and Maya's UX quick wins (#2 priority). Fede emphasized "mobile-first experience" as critical for casual players. This skill provides:
- Mobile responsiveness best practices and testing strategies
- UX heuristics for identifying quick wins
- Accessibility standards (WCAG) compliance
- Pattern matching for common UX problems

**Agents Who Should Use It:**
- **Maya** (Primary) - Identify top 3 UX quick wins from audit
- **Jordan** (Primary) - Mobile responsiveness fixes and a11y audit
- **Sam** (Secondary) - Analyze user engagement through UX lens

**How It Changes Workflow:**
**Before:** Jordan and Maya use intuition for UX decisions. Mobile fixes are reactive, not systematic.

**After:**
- Maya uses UX heuristics to score existing features, objectively identifying top quick wins
- Jordan applies mobile-first patterns systematically (breakpoints, touch targets, responsive typography)
- UX changes are justified with design principles, not opinions
- Mobile score moves from "?" to measured target (8/10)

**Example Use Case:**
Maya runs UX heuristic evaluation on Events page → scores navigation usability at 5/10 → identifies "add event" button hard to find on mobile → Jordan moves button to thumb zone → retest → score improves to 8/10.

---

### 3. Accessibility (a11y)

**Source:** `clawhub search mobile responsive accessibility a11y`
- Slug: `accessibility` v0.1.0
- Search query used: "accessibility"
- Score: 1.097

**Summary:**
Practical accessibility toolkit for web applications. Covers WCAG 2.1 AA standards, keyboard navigation, screen reader support, color contrast, and mobile touch accessibility. Includes automated testing and audit checklists.

**Why It Helps THIS Team:**
Supports Jordan's mobile responsiveness task (#1 priority) and ensures the app works for all players. Accessibility overlaps heavily with mobile UX (touch targets, keyboard navigation, readable fonts). This skill helps:
- Fix mobile usability issues that also improve a11y (larger touch targets = better for motor impairments)
- Ensure color contrast meets WCAG AA (helps outdoor visibility on mobile)
- Keyboard navigation supports power users and assistive tech

**Agents Who Should Use It:**
- **Jordan** (Primary) - Mobile fixes + a11y audit
- **Maya** (Secondary) - Validate UX quick wins for accessibility
- **Alex** (Orchestrator) - Include a11y in sprint acceptance criteria

**How It Changes Workflow:**
**Before:** Accessibility is an afterthought. Mobile fixes may inadvertently break keyboard nav or screen readers.

**After:**
- Every UI change includes a11y checklist (color contrast, focus management, ARIA labels)
- Jordan catches a11y regressions during mobile fixes (same root causes: small targets, poor focus states)
- Automated a11y tests added to CI (using skill's testing tools)
- App works for players with disabilities, expanding user base

**Example Use Case:**
Jordan fixes mobile nav menu → checks a11y checklist → realizes hamburger menu not keyboard accessible → adds proper focus trap and escape key handling → mobile fix now works for screen reader users too.

---

### 4. Supabase Complete Documentation (lb-supabase-skill)

**Source:** `clawhub search Supabase RLS`
- Slug: `lb-supabase-skill` v0.1.0
- Search query used: "Supabase Complete Documentation"
- Score: 1.034

**Summary:**
Comprehensive Supabase documentation covering RLS policies, performance optimization, indexing strategies, migration best practices, and advanced Postgres features. Includes real-world examples and troubleshooting guides.

**Why It Helps THIS Team:**
Directly supports Chris's DB optimization task. The audit identified that Chris "to add suggested indexes from audit" is pending. This skill provides:
- Performance tuning strategies (indexes, query plans, materialized views)
- RLS policy optimization (currently 15+ tables with RLS)
- Migration workflow guidance
- Connection pooling and edge function patterns

**Agents Who Should Use It:**
- **Chris** (Primary) - DB optimization, indexing, RLS performance
- **Taylor** (Secondary) - Validate Supabase queries in E2E tests

**How It Changes Workflow:**
**Before:** Chris relies on general SQL knowledge. Indexing is manual and based on intuition.

**After:**
- Chris uses Supabase-specific performance patterns (partial indexes, composite indexes for common query patterns)
- RLS policies are optimized to avoid full-table scans
- Materialized views (`mv_player_stats_v2`, `mv_pair_aggregates`) are refreshed efficiently
- Query performance is measurable (pg_stat_statements monitoring)

**Example Use Case:**
Chris analyzes slow leaderboard query → uses skill's query plan analysis → adds composite index on `(group_id, elo_rating DESC)` → query time drops from 800ms to 50ms → mobile leaderboard loads instantly.

---

### 5. PR Reviewer

**Source:** `clawhub search GitHub PR pull request code review`
- Slug: `pr-reviewer` v1.0.0
- Search query used: "PR Reviewer"
- Score: 1.063

**Summary:**
Automated PR review assistant that checks code quality, test coverage, documentation, and best practices. Provides structured review templates and integrates with GitHub Actions for pre-merge checks.

**Why It Helps THIS Team:**
Addresses collaboration friction and PR hygiene. The team has 6 agents working together; consistent PR reviews prevent bugs and knowledge sharing. This skill helps:
- Enforce code quality standards across agents
- Catch issues before they reach CI (reducing wasted compute)
- Provide structured feedback templates (what to check in each PR)
- Track review metrics (time to merge, review coverage)

**Agents Who Should Use It:**
- **All agents** - Everyone should use it for reviewing each other's PRs
- **Alex** (Orchestrator) - Monitor PR health metrics in sprint retros

**How It Changes Workflow:**
**Before:** PRs are reviewed ad-hoc. Some get thorough reviews, others get rubber-stamped. Bugs slip through.

**After:**
- Every PR goes through automated pre-review checklist (test coverage, docs, lint)
- Reviewers use skill's templates for consistent feedback
- Alex tracks PR cycle time (goal: <24h from draft to merge)
- Knowledge sharing improves (reviews teach team members about each other's work)

**Example Use Case:**
Jordan submits mobile fix PR → PR Reviewer skill checks: ✅ E2E tests pass, ✅ Mobile viewports tested, ⚠️ Missing accessibility checklist, ⚠️ No changelog → Jordan fixes gaps → Maya reviews with structured template → PR merges in 4h.

---

## Recommended Rollout Plan

### Week 1: Installation + Quickstart (Feb 17-23)

**Monday Feb 17: Install Skills**
- Install all 5 skills (awaiting Fede approval)
- Run `clawhub install playwright-browser-automation`
- Run `clawhub install ui-ux-pro-max`
- Run `clawhub install accessibility`
- Run `clawhub install lb-supabase-skill`
- Run `clawhub install pr-reviewer`
- Update agent `SKILL.md` files to reference new skills

**Tuesday Feb 18: Team Quickstart Tasks**
- **Taylor**: Run Playwright quickstart, set up sample E2E test
- **Maya**: Run UI/UX Pro Max quickstart, score 3 features with heuristics
- **Jordan**: Run Accessibility quickstart, audit mobile nav menu
- **Chris**: Run Supabase quickstart, review migration patterns
- **All**: Run PR Reviewer quickstart, review one existing PR

**Wednesday-Friday Feb 19-21: Apply to Active Tasks**
- **Taylor**: Integrate E2E tests into CI (GitHub Actions workflow update)
- **Maya**: Use UX heuristics to finalize top 3 quick wins (due Feb 17 target)
- **Jordan**: Fix mobile responsiveness using accessibility patterns
- **Chris**: Add DB indexes using Supabase performance guidance
- **Sam**: Apply UX lens to user growth analysis

### Week 2: Enforce Usage in Agent Prompts (Feb 24-Mar 2)

**Update Agent Prompts:**
Add to each agent's `SKILL.md` or system prompt:

```markdown
### Required Skills
- **playwright-browser-automation**: Use for all E2E tests and CI integration
- **ui-ux-pro-max**: Apply UX heuristics before any UI changes
- **accessibility**: Run a11y checklist on all mobile fixes
- **lb-supabase-skill**: Use Supabase patterns for DB queries and migrations
- **pr-reviewer**: Review all PRs with structured templates before approval
```

**Agent-Specific Prompt Updates:**

**Jordan (Frontend):**
```markdown
Before making mobile changes:
1. Run UI/UX Pro Max heuristics on affected feature
2. Check Accessibility skill for mobile touch targets
3. Add E2E tests using Playwright skill (Taylor to integrate)
4. Validate with PR Reviewer skill before submitting
```

**Maya (Product):**
```markdown
When proposing UX changes:
1. Use UI/UX Pro Max to score current state (0-10)
2. Use Accessibility skill for inclusive design patterns
3. Document expected impact in PR template
4. Review implementation with PR Reviewer skill
```

**Chris (Backend):**
```markdown
For DB changes:
1. Use Supabase skill for migration and RLS patterns
2. Check performance implications (indexes, query plans)
3. Update E2E tests if schema changes
4. Use PR Reviewer for DB review checklist
```

**Taylor (QA):**
```markdown
For CI/CD tasks:
1. Use Playwright skill for E2E test patterns
2. Ensure all UI changes have corresponding E2E tests
3. Run PR Reviewer skill on CI workflow PRs
4. Monitor test coverage and flakiness
```

**Sam (Growth) & Alex (Orchestrator):**
```markdown
For analysis and coordination:
1. Use UI/UX Pro Max for engagement pattern analysis
2. Use PR Reviewer for process improvement insights
3. Track metrics: Mobile score, test coverage, PR cycle time
```

**Success Metrics by End of Week 2:**
- [ ] All 5 skills installed and referenced in agent prompts
- [ ] E2E tests running in CI (Taylor)
- [ ] Top 3 UX quick wins identified and prioritized (Maya)
- [ ] Mobile responsiveness improved (measurable score, Jordan)
- [ ] DB indexes added (Chris)
- [ ] PRs include structured review checklists (All)
- [ ] Average PR review time < 4 hours (Alex)

---

## Summary of Impact

| Priority | Current Pain | Proposed Skill | Expected Outcome |
|----------|--------------|----------------|------------------|
| 🔥 #1 | Mobile UX issues | UI/UX Pro Max + Accessibility | Mobile score → 8/10, better engagement |
| 🔥 #2 | UX quick wins needed | UI/UX Pro Max | Top 3 wins identified by Feb 17 (on track) |
| 🔥 #3 | User growth unclear | UI/UX Pro Max (Sam) | Data-driven growth strategies |
| High | E2E tests not in CI | Playwright | CI runs full suite, faster feedback |
| High | DB performance | Supabase skill | Queries optimized, indexes added |
| High | PR hygiene inconsistent | PR Reviewer | Structured reviews, better collaboration |

**Total Investment:** ~2 weeks installation + prompt updates
**Expected ROI:**
- Faster development cycles (better CI)
- Fewer bugs (E2E + PR reviews)
- Better UX (mobile responsiveness, quick wins)
- Improved performance (DB optimization)
- Smoother collaboration (PR templates)

---

## Approval Request

**Decision Required from Fede:**
1. ✅ Approve installation of these 5 skills? → **APPROVED** ✅
2. ✅ Approve Week 1-2 rollout timeline? → **APPROVED** ✅
3. ✅ Any adjustments to skill selection or rollout? → **NONE** - proceed as planned

**Next Steps After Approval:**
- ✅ Execute Week 1 installation tasks (4/5 complete, 1 pending rate limits)
- 🔄 Update agent prompts (Week 2 - ready to begin)
- 📊 Track metrics in Sprint 2 retrospective
- 📢 Report progress to #padel-team

---

*Local skills.sh script not found (proceeding without it).*
*All skills sourced from ClawHub catalog via `clawhub search`.*
