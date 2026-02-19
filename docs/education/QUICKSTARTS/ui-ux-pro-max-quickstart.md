# UI/UX Pro Max Quick Start - For Maya (UX Lead)

**Target Role:** Maya
**Goal:** Design system, UX flows, and mobile-first improvements (Sprint 2 Priorities #1 and #2)
**Skill:** `ui-ux-pro-max` v0.1.0
**Estimated Time:** 45 minutes

---

## Step 1: Understand What This Skill Does

`ui-ux-pro-max` helps you:
- Generate UI concepts and layouts
- Map UX flows and user journeys
- Create design system tokens (colors, spacing, typography)
- Turn UX recommendations into concrete code changes
- Improve existing UI/UX with actionable feedback

**Why Maya needs this:** Padel app needs better UX structure, design tokens, and mobile optimization.

---

## Step 2: Installation (Already Done ✅)

The `ui-ux-pro-max` skill is installed at:
```
/home/ubuntu/.openclaw/workspace/skills/ui-ux-pro-max
```

You can reference it by name in your tasks: "Use ui-ux-pro-max skill"

---

## Step 3: Your First Quick Task (20 minutes)

Create a design system token set for the Padel app:

```
Task: Create a design system with:
1. Color tokens (primary, secondary, success, error, neutral)
2. Spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
3. Typography scale (h1, h2, h3, body, caption)
4. Component states (hover, active, disabled, focus)
5. Dark mode variants (optional but recommended)
```

**Reference:** Read the skill's SKILL.md for guidance:
```bash
cat /home/ubuntu/.openclaw/workspace/skills/ui-ux-pro-max/SKILL.md
```

**Key sections to read:**
- "Triage" — How to ask the right questions
- "Produce Deliverables" — What to output
- "Use Bundled Assets" — Design intelligence data for inspiration
- "Output Standards" — Format requirements

---

## Step 4: Second Task - Mobile UX Audit (15 minutes)

Audit the Padel app's mobile experience:

```
Task: Review mobile UX and identify:
1. Top 3 UX issues on mobile (touch targets, spacing, readability)
2. 5 quick wins that improve mobile experience
3. Any accessibility concerns (contrast, focus states, keyboard nav)
```

**Combine with `accessibility` skill** for a complete mobile-first audit.

---

## Step 5: Third Task - Component Spec (10 minutes)

Create a spec for a new component:

```
Task: Design a "Book Court" button component:
1. Visual description (color, size, icon)
2. States (default, hover, pressed, disabled, loading)
3. Mobile variant (smaller touch target, stacked layout)
4. Accessibility requirements (aria-label, focus states)
5. Code structure (props, CSS tokens to use)
```

---

## What to Ask in Your Task Prompts

When using this skill, always include:

1. **Platform:** Web / iOS / Android / Desktop
2. **Stack:** React, Tailwind, component library (if code changes needed)
3. **Goal:** Conversion, speed, brand vibe, accessibility level
4. **What you have:** Screenshot, Figma, repo URL, user journey

**Example prompt:**
```
Use ui-ux-pro-max skill. Platform: web. Stack: React + Tailwind.
Goal: Improve mobile booking flow UX. I have access to the repo at ~/padelapp.
Task: Review the current booking flow and suggest 3 UX improvements
with implementation details.
```

---

## Output Expectations

This skill produces concrete, actionable outputs:

✅ **UI concept:** Clear visual direction, grid, typography, colors
✅ **UX flow:** User journey, critical paths, edge cases
✅ **Design system:** Tokens, component rules, accessibility notes
✅ **Implementation plan:** File-level edits, component breakdown, acceptance criteria

**No vague feedback** — always name components, states, spacing, and interactions.

---

## When to Use This Skill

Use the `ui-ux-pro-max` skill when:
- ✅ Designing new UI layouts or pages
- ✅ Creating or improving design systems
- ✅ Auditing existing UX flows
- ✅ Generating component specifications
- ✅ Providing mobile-first design guidance
- ✅ Writing copy and microcopy
- ✅ Generating color palettes and design tokens

---

## Bonus: Design System Generator Script

The skill includes a Python script for structured token output:

```bash
python3 skills/ui-ux-pro-max/scripts/design_system.py --help
```

Use this when you need ASCII-friendly tokens/variables output.

---

## Combining Skills

For best results, combine with:
- **`accessibility` skill** — For mobile-first + a11y audits
- **`pr-reviewer` skill** — To review UX-related PRs for quality

---

**Questions?**

1. **Read** `SKILL.md` for complete reference
2. **Ask** for help clarifying requirements
3. **Share** your design system when ready for team review

---

**Next Milestone:** Complete design system token set by mid-Sprint 2
**Long-term Goal:** Full design system documentation and component library
