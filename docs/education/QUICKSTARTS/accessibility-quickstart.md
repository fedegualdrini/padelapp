# Accessibility Quick Start - For Jordan (Frontend + Mobile)

**Target Role:** Jordan
**Goal:** Mobile UX optimization + accessibility audit (Sprint 2 Priority #2)
**Skill:** `accessibility` v0.1.0
**Estimated Time:** 60 minutes

---

## Step 1: Understand What This Skill Does

`accessibility` helps you build WCAG 2.1 AA compliant websites with:
- Semantic HTML best practices
- Proper ARIA attributes
- Focus management for keyboard users
- Screen reader support
- Color contrast checking (4.5:1 for text, 3:1 for large text)
- Form labels and error handling

**Why Jordan needs this:** Padel app needs better mobile experience, which starts with accessibility.

---

## Step 2: Installation (Already Done ✅)

The `accessibility` skill is installed at:
```
/home/ubuntu/.openclaw/workspace/skills/accessibility
```

You can reference it by name in your tasks: "Use accessibility skill"

---

## Step 3: Your First Task - Keyboard Test (10 minutes)

Test the Padel app with keyboard only (no mouse):

```
Task: Navigate the entire Padel app using only Tab/Shift+Tab:
1. Can you reach all buttons and links?
2. Can you activate everything with Enter/Space?
3. Is the focus order logical?
4. Do interactive elements have visible focus indicators?
5. Note any elements you can't reach or activate
```

**Reference:** "Testing Workflow → 1. Keyboard-Only Testing" in SKILL.md

---

## Step 4: Second Task - Mobile UX Audit (20 minutes)

Audit mobile UX with accessibility lens:

```
Task: Review mobile viewport and identify:
1. Touch target sizes (minimum 44x44px recommended)
2. Text size and readability on mobile
3. Color contrast issues (use DevTools contrast checker)
4. Spacing and tap spacing
5. Any elements that are hard to tap/select
```

**Tools to use:**
- Chrome DevTools device emulator
- Lighthouse accessibility audit (F12 → Lighthouse → Accessibility)
- axe DevTools extension

---

## Step 5: Third Task - Fix 3 Quick Wins (15 minutes)

Fix the top 3 accessibility issues you found:

```
Task: Fix the 3 most critical issues from your audit:
1. Add visible focus indicators to all interactive elements
2. Ensure all form inputs have proper labels
3. Fix any color contrast failures below 4.5:1
```

**Reference:** "Critical Rules" section in SKILL.md for dos and don'ts

---

## Critical Rules (Memorize These)

### Always Do ✅
- Use semantic HTML (button, a, nav, article)
- Provide alt text for images
- Ensure 4.5:1 contrast for normal text
- Make all functionality keyboard accessible
- Test with keyboard only (unplug mouse)
- Use proper heading hierarchy (h1 → h2 → h3)
- Label all form inputs
- Provide focus indicators (never just `outline: none`)
- Use `aria-live` for dynamic content

### Never Do ❌
- Use `div` with `onClick` instead of `button`
- Remove focus outlines without replacement
- Use color alone to convey information
- Use placeholders as labels
- Skip heading levels (h1 → h3)
- Use `tabindex` > 0
- Add ARIA when semantic HTML exists
- Forget to restore focus after closing dialogs

---

## Common Patterns You'll Use

### 1. Accessible Button
```html
<!-- ❌ Wrong -->
<div onclick="submit()">Submit</div>

<!-- ✅ Correct -->
<button type="submit">Submit</button>
```

### 2. Focus Indicators
```css
/* ❌ Wrong */
button:focus { outline: none; }

/* ✅ Correct */
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### 3. Form Labels
```html
<!-- ❌ Wrong -->
<input type="email" placeholder="Email address">

<!-- ✅ Correct -->
<label for="email">Email address</label>
<input type="email" id="email" name="email" required>
```

### 4. Screen Reader Only Content
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

---

## Testing Tools

### Automated Testing
1. **Lighthouse** (Chrome DevTools) - Built-in, fast
   - F12 → Lighthouse → Accessibility → Generate report
   - Goal: Score 90+ (100 is ideal)

2. **axe DevTools** (Extension) - Comprehensive
   - Chrome/Firefox extension
   - Scans for WCAG violations
   - Provides fixes

### Manual Testing
1. **Keyboard Only**
   - Unplug mouse
   - Tab through page
   - Test all interactive elements

2. **Screen Reader**
   - NVDA (Windows, free): https://www.nvaccess.org/
   - VoiceOver (Mac, built-in): Cmd+F5 to start

---

## When to Use This Skill

Use the `accessibility` skill when:
- ✅ Fixing mobile UX issues
- ✅ Implementing accessible interfaces
- ✅ Troubleshooting "focus outline missing"
- ✅ Addressing screen reader issues
- ✅ Fixing insufficient color contrast
- ✅ Implementing keyboard navigation
- ✅ Auditing existing pages for WCAG compliance

---

## WCAG 2.1 AA Quick Checklist

### Perceivable
- [ ] All images have alt text
- [ ] Text contrast ≥ 4.5:1 (normal), ≥ 3:1 (large)
- [ ] Color not used alone to convey information
- [ ] No auto-playing audio >3 seconds

### Operable
- [ ] All functionality keyboard accessible
- [ ] No keyboard traps
- [ ] Visible focus indicators
- [ ] Focus order is logical
- [ ] Link purpose clear from text

### Understandable
- [ ] Page language specified (`<html lang="en">`)
- [ ] Consistent navigation
- [ ] Form labels provided
- [ ] Input errors identified and described

### Robust
- [ ] Valid HTML
- [ ] Name, role, value available for all UI
- [ ] Status messages identified (aria-live)

---

## Combining Skills

For best results, combine with:
- **`ui-ux-pro-max` skill** — For design system + mobile UX
- **`pr-reviewer` skill** — To catch a11y issues in PRs

---

## Questions?

1. **Read** `SKILL.md` for complete reference
2. **Use** `references/` folder for deep dives on specific patterns
3. **Ask** if you need help with specific a11y issues

---

**Next Milestone:** Fix top 3 a11y issues by mid-Sprint 2
**Long-term Goal:** WCAG 2.1 AA compliance with Lighthouse score 95+

---

**Remember:** Mobile-first and accessibility go hand-in-hand. If it works for keyboard and screen readers, it works for everyone.
