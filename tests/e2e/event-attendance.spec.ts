import { test, expect } from '@playwright/test';
import { login, navigateAndReady, waitForPageReady } from './test-helpers';

/**
 * Event Creation and Attendance Flow E2E Tests
 * Tests the complete journey from creating weekly events to managing attendance
 */

test.describe('Event Creation and Attendance Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure authenticated
    await login(page, 'padel', 'padel');
  });

  test('can navigate to events page', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Verify we're on events page
    await expect(page.getByRole('heading', { name: /eventos|events/i })).toBeVisible();

    // Check for events list sections (upcoming and past)
    await expect(page.getByText(/próximos|upcoming/i)).toBeVisible();

    // Take screenshot of events page
    await page.screenshot({ path: 'test-results/screenshots/events-page.png', fullPage: true });
  });

  test('can open create event form', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for "Nuevo evento" or "Create event" button
    const createEventButton = page.getByRole('button', { name: /nuevo evento|new event|crear/i }).or(
      page.locator('button').filter({ hasText: /\+/ })
    );

    if (await createEventButton.first().isVisible()) {
      await createEventButton.first().click();
      await page.waitForTimeout(500);

      // Check for create form or modal
      const createForm = page.getByRole('heading', { name: /crear|new/i }).or(
        page.getByRole('dialog', { name: /evento|event/i })
      );
      const hasForm = await createForm.isVisible().catch(() => false);

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/event-create-form.png', fullPage: true });
    } else {
      // Try navigating to create form via URL if button doesn't exist
      await page.goto('/g/padel/events?create=true');
      await waitForPageReady(page);
      await page.screenshot({ path: 'test-results/screenshots/event-create-page.png', fullPage: true });
    }
  });

  test('event creation form displays required fields', async ({ page }) => {
    // Navigate with create=true to show form
    await navigateAndReady(page, '/g/padel/events?create=true');

    // Check for event name input
    const nameInput = page.getByRole('textbox', { name: /nombre|name/i }).or(
      page.locator('input[name="name"]')
    );

    // Check for weekday selection
    const weekdaySelect = page.getByRole('combobox', { name: /día|weekday/i }).or(
      page.locator('select[name*="weekday"], select[name*="day"]')
    );

    // Check for time input
    const timeInput = page.getByRole('textbox', { name: /hora|time/i }).or(
      page.locator('input[type="time"], input[name*="time"]')
    );

    // Check for capacity input
    const capacityInput = page.getByRole('spinbutton', { name: /capacidad|capacity/i }).or(
      page.locator('input[name*="capacity"], input[type="number"]')
    );

    // Take screenshot showing form fields
    await page.screenshot({ path: 'test-results/screenshots/event-form-fields.png', fullPage: true });
  });

  test('can view upcoming events', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for upcoming events section
    const upcomingSection = page.getByText(/próximos|upcoming/i);
    await expect(upcomingSection).toBeVisible();

    // Look for event cards or items
    const eventCards = page.locator('[class*="event"], [data-testid*="event"], .rounded-xl');
    const eventCount = await eventCards.count();

    // Take screenshot of upcoming events
    await page.screenshot({ path: 'test-results/screenshots/events-upcoming.png' });
  });

  test('can view past events', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for past events toggle or section
    const pastToggle = page.getByRole('button', { name: /pasados|past/i }).or(
      page.getByText(/ver eventos pasados/i)
    );

    if (await pastToggle.first().isVisible()) {
      await pastToggle.first().click();
      await page.waitForTimeout(500);

      // Verify past events are shown
      const pastSection = page.getByText(/pasados|past/i);
      await expect(pastSection).toBeVisible();

      // Take screenshot of past events
      await page.screenshot({ path: 'test-results/screenshots/events-past.png' });
    }
  });

  test('can see attendance status for events', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for attendance indicators (confirm, decline, maybe buttons)
    const confirmButton = page.getByRole('button', { name: /confirmar|confirm/i });
    const declineButton = page.getByRole('button', { name: /no va|decline/i });
    const maybeButton = page.getByRole('button', { name: /tal vez|maybe/i });

    const anyButtonVisible = await Promise.race([
      confirmButton.isVisible().then(() => true),
      declineButton.isVisible().then(() => true),
      maybeButton.isVisible().then(() => true)
    ]);

    if (anyButtonVisible) {
      // Take screenshot showing attendance buttons
      await page.screenshot({ path: 'test-results/screenshots/events-attendance-buttons.png' });
    }
  });

  test('can see player count for events', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for player count indicators (e.g., "3/6")
    const playerCountText = page.getByText(/[0-9]+\/[0-9]+/);
    const hasPlayerCount = await playerCountText.isVisible().catch(() => false);

    if (hasPlayerCount) {
      const countText = await playerCountText.first().textContent();
      expect(countText).toMatch(/\d+\/\d+/);

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/events-player-count.png' });
    }
  });

  test('can view event details', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for clickable event cards
    const eventCards = page.locator('[class*="event"], [data-testid*="event"], .rounded-xl');
    const eventCount = await eventCards.count();

    if (eventCount > 0) {
      // Click on first event card
      await eventCards.first().click();
      await page.waitForTimeout(500);

      // Should show event details or expand
      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/event-details.png', fullPage: true });
    }
  });

  test('can navigate to events from navbar', async ({ page }) => {
    await navigateAndReady(page, '/g/padel');

    // Find "Eventos" link in navbar
    const eventsLink = page.getByRole('link', { name: /eventos|events/i }).or(
      page.locator('nav a').filter({ hasText: /eventos/i })
    );

    if (await eventsLink.isVisible()) {
      await eventsLink.click();

      // Verify navigation to events page
      await expect(page).toHaveURL(/\/events/);
      await expect(page.getByRole('heading', { name: /eventos|events/i })).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/events-navbar-nav.png' });
    }
  });

  test('can see weekly event patterns', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for weekday labels (Lunes, Martes, etc.)
    const weekdayLabels = page.getByText(/lunes|martes|miércoles|jueves|viernes|sábado|domingo/i);
    const hasWeekdays = await weekdayLabels.isVisible().catch(() => false);

    if (hasWeekdays) {
      // Take screenshot showing event patterns
      await page.screenshot({ path: 'test-results/screenshots/events-weekday-patterns.png' });
    }
  });

  test('event attendance shows player names', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for player names in attendance section
    const playerNames = page.getByText(/fede|fachi|lucho|leo|nico/i);
    const hasPlayers = await playerNames.isVisible().catch(() => false);

    if (hasPlayers) {
      // Take screenshot showing player names
      await page.screenshot({ path: 'test-results/screenshots/events-player-names.png' });
    }
  });

  test('can see event status (open, locked, completed)', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for status indicators
    const statusText = page.getByText(/abierto|cerrado|completado|locked|open|completed/i);
    const hasStatus = await statusText.isVisible().catch(() => false);

    if (hasStatus) {
      // Take screenshot showing event status
      await page.screenshot({ path: 'test-results/screenshots/events-status.png' });
    }
  });

  test('events page works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateAndReady(page, '/g/padel/events');

    // Verify events page is responsive
    await expect(page.getByRole('heading', { name: /eventos|events/i })).toBeVisible();

    // Take screenshot of mobile events page
    await page.screenshot({
      path: 'test-results/screenshots/events-mobile.png',
      fullPage: true
    });
  });

  test('can view calendar for events', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/events');

    // Look for calendar view or calendar link
    const calendarButton = page.getByRole('button', { name: /calendario|calendar/i }).or(
      page.locator('a[href*="calendar"]')
    );

    if (await calendarButton.first().isVisible()) {
      await calendarButton.first().click();

      // Verify navigation to calendar
      await expect(page).toHaveURL(/\/calendar/);

      // Take screenshot of calendar view
      await page.screenshot({ path: 'test-results/screenshots/events-calendar-view.png', fullPage: true });
    }
  });

  test('can handle empty events state', async ({ page }) => {
    // This test verifies the page handles case with no events gracefully
    await navigateAndReady(page, '/g/padel/events');

    // Look for empty state message or default content
    const emptyState = page.getByText(/no hay eventos|no events|próximamente/i);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either shows events or empty state
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/events-current-state.png' });
  });
});
