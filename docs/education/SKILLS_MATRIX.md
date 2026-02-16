# Padel Team - Skills Matrix

## Installation Status

**Updated:** 2026-02-16

| Skill | Version | Status | Target Roles |
|-------|---------|--------|--------------|
| `ui-ux-pro-max` | 0.1.0 | ✅ Installed | Maya, Jordan |
| `accessibility` | 0.1.0 | ✅ Installed | Jordan |
| `playwright-browser-automation` | 2.0.0 | ✅ Installed | Taylor |
| `pr-reviewer` | 1.0.0 | ✅ Installed | All agents |
| `lb-supabase-skill` | - | ⏳ Pending | Chris |
| `supabase-optimization` | 1.0 (custom) | ✅ Created | Chris |

> **Note:** `lb-supabase-skill` installation hitting persistent rate limits. Created custom `supabase-optimization` skill as workaround. Chris can start immediately with local skill. Will retry ClawHub installation tomorrow.

## Role → Skill Mapping

### Maya (UX Lead)
- ✅ `ui-ux-pro-max` - Design systems, component audits, UX quick wins
- ✅ `accessibility` - Mobile-first design, WCAG compliance

### Jordan (Frontend + Mobile)
- ✅ `ui-ux-pro-max` - UI refinement, design token implementation
- ✅ `accessibility` - Mobile UX optimization, accessibility audits
- ✅ `pr-reviewer` - PR hygiene for frontend code

### Taylor (QA + E2E Tests)
- ✅ `playwright-browser-automation` - E2E test authoring, CI integration
- ✅ `pr-reviewer` - PR hygiene for test code

### Chris (Database + Performance)
- ⏳ `lb-supabase-skill` - DB optimization, indexing, RLS policies
- ✅ `pr-reviewer` - PR hygiene for backend code

## Next Steps

### Week 1 (Current)
- [x] Install 4/5 skills (lb-supabase-skill pending rate limit)
- [ ] Create quick-start guides for each skill
- [ ] Create role-specific task templates
- [ ] Assign quick-start tasks to each role

### Week 2 (Starting Feb 24)
- [ ] Enforce skill usage via role prompts
- [ ] Review first skill-assisted tasks
- [ ] Collect feedback and adjust templates

## Quick-Start Resources

See `/docs/education/QUICKSTARTS/` for skill-specific guides:

- `ui-ux-pro-max-quickstart.md` → Maya + Jordan
- `accessibility-quickstart.md` → Jordan
- `playwright-quickstart.md` → Taylor
- `pr-reviewer-quickstart.md` → All
- `lb-supabase-quickstart.md` → Chris (pending)

---

*This document will be updated as lb-supabase-skill is installed and quickstarts are created.*
