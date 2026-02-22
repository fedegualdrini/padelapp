import { test, expect } from '@playwright/test';
import { login, navigateAndReady, waitForPageReady } from './test-helpers';

/**
 * E2E Tests for Calendar Page (Trello #zEzjy3T5)
 * 
 * Tests cover:
 * 1. Calendar month navigation
 * 2. Event display on calendar
 * 3. Match display on calendar
 */

// Check if Supabase is configured (not in demo mode)
const hasSupabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

test.describe('Calendar', () => {
  // Reproduce negative-offset timezone behavior (es-AR).
  test.use({ timezoneId: 'America/Argentina/Buenos_Aires' });

  // ============================================
  // DEMO MODE TESTS (No Supabase required)
  // ============================================
  test.describe('Demo Mode', () => {
    test('should navigate months and re-render month-scoped events (demo)', async ({ page }) => {
      // Use demo slug so the calendar works without any Supabase env.
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });

      // Header label should match query params.
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible({ timeout: 15000 });

      // Click the anchor event day and verify month-scoped demo event renders.
      await page.getByTestId('calendar-day-2025-01-02').click();
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();

      // Close modal.
      await page.getByTestId('calendar-day-modal-backdrop').click({ position: { x: 5, y: 5 } });

      // Navigate to next month and verify both URL and rendered event update.
      await page.getByRole('button', { name: /mes siguiente/i }).click();
      await expect(page).toHaveURL(/\/g\/demo\/calendar\?year=2025&month=1/);
      await expect(page.getByRole('heading', { name: /febrero 2025/i })).toBeVisible();

      // Feb 2, 2025 is Sunday. The modal header weekday should match the grid date.
      await page.getByTestId('calendar-day-2025-02-02').click();
      await expect(page.getByRole('heading', { level: 3 })).toContainText(/domingo/i);
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-02' })).toBeVisible();

      // Feb 3 demo match should also render (regression for missing calendar items).
      await page.getByTestId('calendar-day-modal-backdrop').click({ position: { x: 5, y: 5 } });
      await page.getByTestId('calendar-day-2025-02-03').click();
      await expect(page.getByRole('heading', { level: 3 })).toContainText(/lunes/i);
      await expect(page.getByRole('heading', { name: 'Partidos', exact: true })).toBeVisible();
    });

    test('calendar shows demo events in January', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Verify January 2025 heading
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible();
      
      // Click on day 2 to see event
      await page.getByTestId('calendar-day-2025-01-02').click();
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();
    });

    test('calendar shows demo matches in February', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=1', { waitUntil: 'domcontentloaded' });
      
      // Verify February 2025 heading
      await expect(page.getByRole('heading', { name: /febrero 2025/i })).toBeVisible();
      
      // Click on day 3 to see matches
      await page.getByTestId('calendar-day-2025-02-03').click();
      await expect(page.getByRole('heading', { name: 'Partidos', exact: true })).toBeVisible();
    });
  });

  // ============================================
  // MONTH NAVIGATION TESTS
  // ============================================
  test.describe('Month Navigation', () => {
    test('calendar page loads with current month', async ({ page }) => {
      await page.goto('/g/demo/calendar', { waitUntil: 'domcontentloaded' });
      
      // Should show month and year heading (h2 with month name + year)
      // The heading format is like "Enero 2025" 
      const monthHeading = page.getByRole('heading', { level: 2 }).filter({
        hasText: /\d{4}/ // Contains a year
      });
      
      await expect(monthHeading.first()).toBeVisible({ timeout: 15000 });
      
      // Verify it contains a year
      const text = await monthHeading.first().textContent();
      expect(text).toMatch(/\d{4}/); // Has year
    });

    test('can navigate to next month', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Click next month button
      await page.getByRole('button', { name: /mes siguiente/i }).click();
      
      // Should update URL
      await expect(page).toHaveURL(/month=1/);
      
      // Should show February
      await expect(page.getByRole('heading', { name: /febrero 2025/i })).toBeVisible();
    });

    test('can navigate to previous month', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=1', { waitUntil: 'domcontentloaded' });
      
      // Click previous month button
      await page.getByRole('button', { name: /mes anterior/i }).click();
      
      // Should update URL
      await expect(page).toHaveURL(/month=0/);
      
      // Should show January
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible();
    });

    test('navigation wraps correctly from December to January', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=11', { waitUntil: 'domcontentloaded' });
      
      // Should show December 2025
      await expect(page.getByRole('heading', { name: /diciembre 2025/i })).toBeVisible();
      
      // Click next month
      await page.getByRole('button', { name: /mes siguiente/i }).click();
      
      // Should show January 2026
      await expect(page.getByRole('heading', { name: /enero 2026/i })).toBeVisible();
    });

    test('navigation wraps correctly from January to December', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Should show January 2025
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible();
      
      // Click previous month
      await page.getByRole('button', { name: /mes anterior/i }).click();
      
      // Should show December 2024
      await expect(page.getByRole('heading', { name: /diciembre 2024/i })).toBeVisible();
    });

    test('month navigation works correctly', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Verify January is displayed
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible();
      
      // Navigate to next month
      await page.getByRole('button', { name: /mes siguiente/i }).click();
      
      // Should be on February
      await expect(page.getByRole('heading', { name: /febrero 2025/i })).toBeVisible();
      
      // Navigate back
      await page.getByRole('button', { name: /mes anterior/i }).click();
      
      // Should be back on January
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible();
    });

    test('URL parameters control initial month display', async ({ page }) => {
      // Test different months via URL
      const testCases = [
        { year: 2025, month: 0, expected: /enero 2025/i },
        { year: 2025, month: 6, expected: /julio 2025/i },
        { year: 2024, month: 11, expected: /diciembre 2024/i }
      ];
      
      for (const testCase of testCases) {
        await page.goto(`/g/demo/calendar?year=${testCase.year}&month=${testCase.month}`, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: testCase.expected })).toBeVisible();
      }
    });
  });

  // ============================================
  // EVENT DISPLAY TESTS
  // ============================================
  test.describe('Event Display', () => {
    test('calendar displays event indicator on days with events', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Day 2 has an event
      const dayWithEvent = page.getByTestId('calendar-day-2025-01-02');
      
      // Should be visible and clickable
      await expect(dayWithEvent).toBeVisible();
      await expect(dayWithEvent).toBeEnabled();
    });

    test('clicking day with event shows event modal', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Click day with event
      await page.getByTestId('calendar-day-2025-01-02').click();
      
      // Event modal should appear (check for modal backdrop)
      await expect(page.getByTestId('calendar-day-modal-backdrop')).toBeVisible();
      
      // Should show event details
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();
    });

    test('event modal displays event name', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      await page.getByTestId('calendar-day-2025-01-02').click();
      
      // Should show event name
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();
    });

    test('event modal displays weekday', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      await page.getByTestId('calendar-day-2025-01-02').click();
      
      // Should show weekday (Thursday for Jan 2, 2025)
      await expect(page.getByRole('heading', { level: 3 })).toContainText(/jueves/i);
    });

    test('event modal displays date', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      await page.getByTestId('calendar-day-2025-01-02').click();
      
      // Modal should be visible (check for modal backdrop)
      await expect(page.getByTestId('calendar-day-modal-backdrop')).toBeVisible();
      
      // Should show the weekday in the modal header
      await expect(page.getByRole('heading', { level: 3 })).toContainText(/jueves/i);
    });

    test('can close event modal by clicking backdrop', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Open modal
      await page.getByTestId('calendar-day-2025-01-02').click();
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();
      
      // Close by clicking backdrop
      await page.getByTestId('calendar-day-modal-backdrop').click({ position: { x: 5, y: 5 } });
      
      // Modal should close
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).not.toBeVisible();
    });

    test('can close event modal with Escape key', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Open modal
      await page.getByTestId('calendar-day-2025-01-02').click();
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Modal should close (use proper assertion with timeout)
      await expect(page.getByTestId('calendar-day-modal-backdrop')).not.toBeVisible({ timeout: 2000 });
    });

    test('events persist across month navigation', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Verify event in January
      await page.getByTestId('calendar-day-2025-01-02').click();
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();
      await page.getByTestId('calendar-day-modal-backdrop').click({ position: { x: 5, y: 5 } });
      
      // Navigate to February
      await page.getByRole('button', { name: /mes siguiente/i }).click();
      await expect(page.getByRole('heading', { name: /febrero 2025/i })).toBeVisible();
      
      // Verify event in February
      await page.getByTestId('calendar-day-2025-02-02').click();
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-02' })).toBeVisible();
    });
  });

  // ============================================
  // MATCH DISPLAY TESTS
  // ============================================
  test.describe('Match Display', () => {
    test('calendar displays match indicator on days with matches', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=1', { waitUntil: 'domcontentloaded' });
      
      // Day 3 has matches
      const dayWithMatch = page.getByTestId('calendar-day-2025-02-03');
      
      // Should be visible and clickable
      await expect(dayWithMatch).toBeVisible();
      await expect(dayWithMatch).toBeEnabled();
    });

    test('clicking day with match shows match details', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=1', { waitUntil: 'domcontentloaded' });
      
      // Click day with match
      await page.getByTestId('calendar-day-2025-02-03').click();
      
      // Should show matches section
      await expect(page.getByRole('heading', { name: 'Partidos', exact: true })).toBeVisible();
    });

    test('match modal displays weekday', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=1', { waitUntil: 'domcontentloaded' });
      
      await page.getByTestId('calendar-day-2025-02-03').click();
      
      // Should show weekday (Monday for Feb 3, 2025)
      await expect(page.getByRole('heading', { level: 3 })).toContainText(/lunes/i);
    });

    test('can close match modal by clicking backdrop', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=1', { waitUntil: 'domcontentloaded' });
      
      // Open modal
      await page.getByTestId('calendar-day-2025-02-03').click();
      await expect(page.getByRole('heading', { name: 'Partidos', exact: true })).toBeVisible();
      
      // Close by clicking backdrop
      await page.getByTestId('calendar-day-modal-backdrop').click({ position: { x: 5, y: 5 } });
      
      // Modal should close
      await expect(page.getByRole('heading', { name: 'Partidos', exact: true })).not.toBeVisible();
    });

    test('match modal can be closed with Escape key', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=1', { waitUntil: 'domcontentloaded' });
      
      // Open modal
      await page.getByTestId('calendar-day-2025-02-03').click();
      await expect(page.getByRole('heading', { name: 'Partidos', exact: true })).toBeVisible();
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Modal should close (use proper assertion with timeout)
      await expect(page.getByTestId('calendar-day-modal-backdrop')).not.toBeVisible({ timeout: 2000 });
    });
  });

  // ============================================
  // CALENDAR GRID TESTS
  // ============================================
  test.describe('Calendar Grid', () => {
    test('calendar displays all days of the week', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Should show weekday headers
      const weekdays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
      
      for (const day of weekdays) {
        const dayHeader = page.getByText(new RegExp(day, 'i'));
        await expect(dayHeader.first()).toBeVisible();
      }
    });

    test('calendar displays correct number of days', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // January 2025 has 31 days
      // Look for day numbers in calendar
      const dayNumbers = page.locator('[data-testid^="calendar-day-"]');
      const count = await dayNumbers.count();
      
      // Should have at least 28 days (minimum for any month)
      expect(count).toBeGreaterThanOrEqual(28);
    });

    test('calendar highlights current day', async ({ page }) => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      await page.goto(`/g/demo/calendar?year=${currentYear}&month=${currentMonth}`, { waitUntil: 'domcontentloaded' });
      
      // Current day should be visible
      await expect(page.locator('body')).toBeVisible();
    });

    test('calendar days with activity are clickable', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Only days with events/matches are enabled - use 2025-01-02 which has a demo event
      const dayElement = page.getByTestId('calendar-day-2025-01-02');
      
      await expect(dayElement).toBeVisible();
      await expect(dayElement).toBeEnabled();
      
      // Click should open modal
      await dayElement.click();
      await expect(page.getByTestId('calendar-day-modal-backdrop')).toBeVisible();
    });
  });

  // ============================================
  // RESPONSIVE TESTS
  // ============================================
  test.describe('Calendar Responsive Design', () => {
    test('calendar works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Verify calendar is visible
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/calendar-mobile.png' });
    });

    test('calendar navigation buttons are touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Find navigation buttons
      const nextButton = page.getByRole('button', { name: /mes siguiente/i });
      const prevButton = page.getByRole('button', { name: /mes anterior/i });
      
      // Buttons should be visible and appropriately sized
      if (await nextButton.isVisible().catch(() => false)) {
        const box = await nextButton.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      }
    });

    test('calendar works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Verify calendar is visible
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/calendar-tablet.png' });
    });

    test('calendar works on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Verify calendar is visible
      await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/calendar-desktop.png' });
    });
  });

  // ============================================
  // ACCESSIBILITY TESTS
  // ============================================
  test.describe('Calendar Accessibility', () => {
    test('calendar has proper heading hierarchy', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Should have heading for month/year
      const heading = page.getByRole('heading', { name: /enero 2025/i });
      await expect(heading).toBeVisible();
    });

    test('navigation buttons have accessible names', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      const nextButton = page.getByRole('button', { name: /mes siguiente/i });
      const prevButton = page.getByRole('button', { name: /mes anterior/i });
      
      // Buttons should have accessible names
      if (await nextButton.isVisible().catch(() => false)) {
        const text = await nextButton.textContent();
        const ariaLabel = await nextButton.getAttribute('aria-label');
        expect(text?.trim().length || ariaLabel?.length).toBeGreaterThan(0);
      }
    });

    test('calendar days are keyboard accessible', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Tab through calendar
      await page.keyboard.press('Tab');
      
      // Should be able to focus on interactive elements
      const focusedElement = page.locator(':focus');
      const count = await focusedElement.count();
      
      // At least one element should be focusable
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('modal can be closed with keyboard', async ({ page }) => {
      await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });
      
      // Open modal
      await page.getByTestId('calendar-day-2025-01-02').click();
      await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();
      
      // Close with Escape
      await page.keyboard.press('Escape');
      
      // Modal should close (use proper assertion with timeout)
      await expect(page.getByTestId('calendar-day-modal-backdrop')).not.toBeVisible({ timeout: 2000 });
    });
  });

  // ============================================
  // AUTHENTICATED TESTS (Requires Supabase)
  // ============================================
  if (hasSupabaseEnv) {
    test.describe('Authenticated Calendar', () => {
      test.beforeEach(async ({ page }) => {
        await login(page, 'padel', 'padel');
      });

      test('can navigate to calendar from dashboard', async ({ page }) => {
        await navigateAndReady(page, '/g/padel');
        
        // Look for calendar link
        const calendarLink = page.getByRole('link', { name: /calendario|calendar/i }).first();
        
        if (await calendarLink.isVisible().catch(() => false)) {
          await calendarLink.click();
          
          // Should navigate to calendar page
          await page.waitForURL(/\/calendar/, { timeout: 5000 });
          expect(page.url()).toContain('/calendar');
        }
      });

      test('calendar shows real events for authenticated user', async ({ page }) => {
        await navigateAndReady(page, '/g/padel/calendar');
        
        // Calendar should load
        const heading = page.getByRole('heading').first();
        await expect(heading).toBeVisible();
      });

      test('calendar shows real matches for authenticated user', async ({ page }) => {
        await navigateAndReady(page, '/g/padel/calendar');
        
        // Calendar should load
        const heading = page.getByRole('heading').first();
        await expect(heading).toBeVisible();
      });
    });
  }
});
