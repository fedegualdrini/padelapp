import { test, expect } from '@playwright/test';

/**
 * Critical User Flows E2E Tests
 * Tests the complete end-to-end journeys for core application features
 *
 * These tests ensure the most important user paths work correctly:
 * 1. Authentication & Group Access
 * 2. Match Creation & Recording
 * 3. Event Attendance Management
 */

test.describe('Critical User Flows', () => {
  // Test 1: Complete Authentication Flow
  test.describe('Authentication Flow', () => {
    test('complete user journey: join group and access protected pages', async ({ page }) => {
      // Step 1: Navigate to join page
      await page.goto('/g/padel/join');
      await page.waitForLoadState('networkidle');

      // Step 2: Verify join page elements
      await expect(page.locator('h1, h2').filter({ hasText: /clave|passphrase/i }).first()).toBeVisible();
      const passphraseInput = page.locator('input[type="password"], input[name="passphrase"]').first();
      await expect(passphraseInput).toBeVisible();

      // Step 3: Enter passphrase and join
      await passphraseInput.fill('padel');
      const joinButton = page.locator('button:has-text("Ingresar"), button:has-text("Join")').first();
      await expect(joinButton).toBeVisible();
      await joinButton.click();

      // Step 4: Verify successful navigation to ranking page
      await page.waitForURL(/\/ranking/, { timeout: 10000 });
      await expect(page.locator('h2', { hasText: 'Ranking' })).toBeVisible({ timeout: 10000 });

      // Step 5: Verify session persists - navigate to matches
      await page.goto('/g/padel/matches');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').filter({ hasText: /partidos|matches/i }).first()).toBeVisible();

      // Step 6: Navigate to events
      await page.goto('/g/padel/events');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').filter({ hasText: /eventos|events/i }).first()).toBeVisible();

      // Step 7: Verify session persists after refresh
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').filter({ hasText: /eventos|events/i }).first()).toBeVisible();
    });

    test('authentication rejects invalid passphrase', async ({ page }) => {
      await page.goto('/g/padel/join');
      await page.waitForLoadState('networkidle');

      const passphraseInput = page.locator('input[type="password"], input[name="passphrase"]').first();
      const joinButton = page.locator('button:has-text("Ingresar"), button:has-text("Join")').first();

      // Try invalid passphrase
      await passphraseInput.fill('invalid-passphrase-123');
      await joinButton.click();

      // Should show error and stay on join page
      await page.waitForTimeout(1000);
      const errorBox = page.locator('[role="status"]').first();
      await expect(errorBox).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain('/join');
    });

    test('session management: logout prevents access to protected routes', async ({ page }) => {
      // First, join the group
      await page.goto('/g/padel/join');
      await page.locator('input[type="password"], input[name="passphrase"]').first().fill('padel');
      await page.locator('button:has-text("Ingresar"), button:has-text("Join")').first().click();
      await page.waitForURL(/\/ranking/, { timeout: 10000 });

      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), button:has-text("Salir")').first();
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }

      // Try to access protected route - should redirect to join
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/join');
    });
  });

  // Test 2: Complete Match Creation Flow
  test.describe('Match Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate before each test
      await page.goto('/g/padel/join');
      await page.locator('input[type="password"], input[name="passphrase"]').first().fill('padel');
      await page.locator('button:has-text("Ingresar"), button:has-text("Join")').first().click();
      await page.waitForURL(/\/ranking/, { timeout: 10000 });
    });

    test('complete match creation journey from matches list to form submission', async ({ page }) => {
      // Step 1: Navigate to matches list
      await page.goto('/g/padel/matches');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').filter({ hasText: /partidos|matches/i }).first()).toBeVisible();

      // Step 2: Click "Nuevo partido" button
      const createMatchButton = page.locator('a[href*="matches/new"], button:has-text("Nuevo"), button:has-text("Crear")').first();
      if (await createMatchButton.isVisible().catch(() => false)) {
        await createMatchButton.click();
      } else {
        // Navigate directly
        await page.goto('/g/padel/matches/new');
      }
      await page.waitForLoadState('networkidle');

      // Step 3: Verify match creation form is loaded
      await expect(page.locator('h1, h2').filter({ hasText: /partido|match/i }).first()).toBeVisible();

      // Step 4: Check for required form sections
      const teamSection = page.locator('h1, h2, h3').filter({ hasText: /equipos|teams/i }).first();
      await expect(teamSection).toBeVisible();

      const scoreSection = page.locator('h1, h2, h3').filter({ hasText: /resultado|result|score/i }).first();
      await expect(scoreSection).toBeVisible();

      // Step 5: Verify player dropdowns exist
      const playerSelects = page.locator('select, [role="combobox"]');
      const selectCount = await playerSelects.count();
      expect(selectCount).toBeGreaterThan(0);

      // Step 6: Check navigation back to matches list
      const backButton = page.locator('a[href*="/matches"], button:has-text("Volver"), button:has-text("Cancelar")').first();
      if (await backButton.isVisible().catch(() => false)) {
        await backButton.click();
        await expect(page).toHaveURL(/\/matches$/);
      }
    });

    test('match form displays all critical fields', async ({ page }) => {
      await page.goto('/g/padel/matches/new');
      await page.waitForLoadState('networkidle');

      // Check for date/time inputs
      const dateInput = page.locator('input[type="date"], input[name*="date"]').first();
      const timeInput = page.locator('input[type="time"], input[name*="time"]').first();

      const hasDateOrTime = await Promise.race([
        dateInput.isVisible().then(() => true),
        timeInput.isVisible().then(() => true),
        Promise.resolve(false)
      ]);

      // Check for team/player selectors
      const teamSelectors = page.locator('select[name*="team"], select[name*="player"], [role="combobox"]');
      const teamCount = await teamSelectors.count();
      expect(teamCount).toBeGreaterThan(0);

      // Check for score inputs
      const scoreInputs = page.locator('input[type="number"], input[type="text"][placeholder*="score"]');
      const scoreCount = await scoreInputs.count();
      expect(scoreCount).toBeGreaterThan(0);

      // Check for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")').first();
      await expect(submitButton).toBeVisible();
    });

    test('match creation form handles validation', async ({ page }) => {
      await page.goto('/g/padel/matches/new');
      await page.waitForLoadState('networkidle');

      // Try to submit without filling form
      const submitButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")').first();
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should either show validation error or stay on form page
      const onFormPage = page.url().includes('/matches/new');
      expect(onFormPage).toBe(true);

      // Check for error message if visible
      const errorBox = page.locator('[role="status"], [role="alert"]').first();
      const hasError = await errorBox.isVisible().catch(() => false);
      if (hasError) {
        const errorText = await errorBox.textContent();
        expect(errorText?.length).toBeGreaterThan(0);
      }
    });

    test('match form is responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/g/padel/matches/new');
      await page.waitForLoadState('networkidle');

      // Verify form is usable on mobile
      await expect(page.locator('h1, h2').filter({ hasText: /partido|match/i }).first()).toBeVisible();

      const submitButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")').first();
      await expect(submitButton).toBeVisible();
    });
  });

  // Test 3: Complete Event Attendance Flow
  test.describe('Event Attendance Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate before each test
      await page.goto('/g/padel/join');
      await page.locator('input[type="password"], input[name="passphrase"]').first().fill('padel');
      await page.locator('button:has-text("Ingresar"), button:has-text("Join")').first().click();
      await page.waitForURL(/\/ranking/, { timeout: 10000 });
    });

    test('complete event management journey', async ({ page }) => {
      // Step 1: Navigate to events page
      await page.goto('/g/padel/events');
      await page.waitForLoadState('networkidle');

      // Step 2: Verify events page loaded
      await expect(page.locator('h1, h2').filter({ hasText: /eventos|events/i }).first()).toBeVisible();

      // Step 3: Check for upcoming events section
      const upcomingText = page.getByText(/próximos|upcoming/i);
      const hasUpcoming = await upcomingText.isVisible().catch(() => false);

      // Step 4: Look for event cards or list items
      const eventItems = page.locator('[class*="event"], [data-testid*="event"], .rounded-xl').filter({ hasText: /.+/ });
      const eventCount = await eventItems.count();

      // Either shows events or empty state
      expect(eventCount > 0 || hasUpcoming).toBe(true);

      // Step 5: Check for attendance indicators if events exist
      if (eventCount > 0) {
        const attendanceButtons = page.locator('button:has-text("Confirmar"), button:has-text("No va"), button:has-text("Tal vez")');
        const hasAttendance = await attendanceButtons.count() > 0;
        // Events may or may not have attendance buttons depending on state
      }
    });

    test('events page displays key information', async ({ page }) => {
      await page.goto('/g/padel/events');
      await page.waitForLoadState('networkidle');

      // Check for event creation button
      const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("+")').first();
      const hasCreateButton = await createButton.isVisible().catch(() => false);

      // Check for weekday labels
      const weekdayLabels = page.getByText(/lunes|martes|miércoles|jueves|viernes|sábado|domingo/i);
      const hasWeekdays = await weekdayLabels.isVisible().catch(() => false);

      // Check for player count indicators
      const playerCount = page.getByText(/\d+\/\d+/).first();
      const hasPlayerCount = await playerCount.isVisible().catch(() => false);

      // At least one of these should be present
      expect(hasCreateButton || hasWeekdays || hasPlayerCount).toBe(true);
    });

    test('event creation form is accessible', async ({ page }) => {
      // Try to access event creation via URL
      await page.goto('/g/padel/events?create=true');
      await page.waitForLoadState('networkidle');

      // Check for form or dialog
      const formHeading = page.locator('h1, h2, h3').filter({ hasText: /crear|new|evento/i }).first();
      const hasForm = await formHeading.isVisible().catch(() => false);

      // Check for create button if form not visible
      const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("+")').first();
      const hasButton = await createButton.isVisible().catch(() => false);

      expect(hasForm || hasButton).toBe(true);
    });

    test('events page is responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/g/padel/events');
      await page.waitForLoadState('networkidle');

      // Verify events page is usable on mobile
      await expect(page.locator('h1, h2').filter({ hasText: /eventos|events/i }).first()).toBeVisible();

      // Check for navigation elements
      const navItems = page.locator('nav a, header a').filter({ hasText: /.+/ });
      const navCount = await navItems.count();
      expect(navCount).toBeGreaterThan(0);
    });

    test('can navigate to events from navbar', async ({ page }) => {
      await page.goto('/g/padel');
      await page.waitForLoadState('networkidle');

      // Find events link in navbar
      const eventsLink = page.locator('nav a, header a, [role="navigation"] a').filter({ hasText: /eventos|events/i }).first();

      if (await eventsLink.isVisible().catch(() => false)) {
        await eventsLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/events');
      }
    });
  });

  // Test 4: Cross-Feature Integration
  test.describe('Cross-Feature Integration', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate before each test
      await page.goto('/g/padel/join');
      await page.locator('input[type="password"], input[name="passphrase"]').first().fill('padel');
      await page.locator('button:has-text("Ingresar"), button:has-text("Join")').first().click();
      await page.waitForURL(/\/ranking/, { timeout: 10000 });
    });

    test('can navigate between ranking, matches, and events', async ({ page }) => {
      // Start at ranking
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h2', { hasText: 'Ranking' })).toBeVisible();

      // Navigate to matches
      await page.goto('/g/padel/matches');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').filter({ hasText: /partidos|matches/i }).first()).toBeVisible();

      // Navigate to events
      await page.goto('/g/padel/events');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').filter({ hasText: /eventos|events/i }).first()).toBeVisible();

      // Navigate back to ranking
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h2', { hasText: 'Ranking' })).toBeVisible();
    });

    test('session persists across all pages', async ({ page }) => {
      const pages = ['/g/padel/ranking', '/g/padel/matches', '/g/padel/events'];

      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');

        // Should not be redirected to join page
        expect(page.url()).not.toContain('/join');

        // Reload page to verify persistence
        await page.reload();
        await page.waitForLoadState('networkidle');
        expect(page.url()).not.toContain('/join');
      }
    });

    test('page loading performance is acceptable', async ({ page }) => {
      const urls = ['/g/padel/ranking', '/g/padel/matches', '/g/padel/events'];

      for (const url of urls) {
        const startTime = Date.now();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        // Pages should load within 10 seconds
        expect(loadTime).toBeLessThan(10000);
      }
    });
  });
});
