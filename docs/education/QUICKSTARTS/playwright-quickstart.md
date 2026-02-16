# Playwright Quick Start - For Taylor (QA + E2E Tests)

**Target Role:** Taylor
**Goal:** Get E2E tests running in CI (Sprint 2 Priority #1)
**Skill:** `playwright-browser-automation` v2.0.0
**Estimated Time:** 30 minutes

---

## Step 1: Understand What Playwright Does

Playwright automates browsers to test user flows end-to-end. It:
- Clicks buttons, fills forms, navigates pages
- Works across Chrome, Firefox, Safari, and mobile
- Runs headlessly in CI (no UI needed)
- Takes screenshots, records videos, captures network traffic

**Why Taylor needs this:** The Padel app currently has NO E2E tests. This is Sprint 2's #1 gap.

---

## Step 2: Installation (Already Done ✅)

The `playwright-browser-automation` skill is installed at:
```
/home/ubuntu/.openclaw/workspace/skills/playwright-browser-automation
```

You can reference it by name in your tasks: "Use playwright-browser-automation skill"

---

## Step 3: Your First Quick Task (15 minutes)

Create a simple E2E test for the login flow:

```
Task: Write a Playwright test that:
1. Opens the Padel app login page
2. Fills in username and password
3. Clicks the login button
4. Verifies we're redirected to the dashboard
5. Takes a screenshot on success
```

**Reference:** Read the skill's SKILL.md for patterns:
```bash
cat /home/ubuntu/.openclaw/workspace/skills/playwright-browser-automation/SKILL.md
```

**Key sections to read:**
- "Quick Start" — Basic setup
- "Common Patterns → Form Automation" — How to fill forms
- "Best Practices → Use Locators" — How to find elements reliably

---

## Step 4: CI Integration (Next Sprint)

Once you have a working test, we'll:
1. Create a test directory structure
2. Add a npm script to run tests
3. Configure GitHub Actions to run tests on PRs
4. Add test results to PR comments

**Don't worry about this now — focus on getting ONE test working first.**

---

## Step 5: Common Patterns You'll Use

### Filling Forms
```javascript
await page.getByLabel('Email').fill('test@example.com');
await page.getByLabel('Password').fill('password123');
await page.getByRole('button', { name: 'Sign in' }).click();
```

### Waiting for Navigation
```javascript
await page.waitForURL('/dashboard');
```

### Verifying Content
```javascript
await expect(page.getByText('Welcome back')).toBeVisible();
```

### Taking Screenshots
```javascript
await page.screenshot({ path: 'login-success.png' });
```

---

## When to Use This Skill

Use the `playwright-browser-automation` skill when:
- ✅ Writing E2E tests for user flows
- ✅ Testing critical paths (login, booking, payment)
- ✅ Verifying mobile/responsive behavior
- ✅ Checking cross-browser compatibility
- ✅ Capturing visual regression evidence

---

## Questions?

1. **Read** `SKILL.md` for complete reference
2. **Ask** for help if you hit issues with selectors or timing
3. **Share** your first test when ready for review

---

**Next Milestone:** Get 1 passing E2E test by end of Sprint 2
**Long-term Goal:** CI integration with 10+ critical user flow tests
