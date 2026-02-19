import { test, expect } from '@playwright/test';
import { login, navigateAndReady, waitForPageReady } from './test-helpers';

/**
 * Enhanced Ranking Page Navigation E2E Tests
 * Tests the complete journey of navigating and interacting with the ranking page
 */

test.describe('Ranking Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure authenticated
    await login(page, 'padel', 'padel');
  });

  test('can navigate to ranking page from navbar', async ({ page }) => {
    await navigateAndReady(page, '/g/padel');

    // Find "Ranking" link in navbar
    const rankingLink = page.getByRole('link', { name: /ranking/i }).or(
      page.locator('nav a').filter({ hasText: /ranking/i })
    );

    if (await rankingLink.isVisible()) {
      await rankingLink.click();

      // Verify navigation to ranking page
      await expect(page).toHaveURL(/\/ranking/);
      await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/ranking-navbar-nav.png' });
    }
  });

  test('can navigate to ranking page directly', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Verify ranking page loads
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();
    await expect(page.getByText(/evolucion/i)).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/ranking-direct-nav.png', fullPage: true });
  });

  test('ranking page displays chart', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for chart to render (lightweight-charts creates canvas elements)
    const chartCanvas = page.locator('canvas').first();
    await expect(chartCanvas).toBeVisible({ timeout: 10000 });

    // Verify chart has dimensions
    const boundingBox = await chartCanvas.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox!.width).toBeGreaterThan(0);
    expect(boundingBox!.height).toBeGreaterThan(0);

    // Take screenshot of chart
    await page.screenshot({ path: 'test-results/screenshots/ranking-chart-display.png' });
  });

  test('ranking page displays player list', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for player names in the sidebar or legend
    const playerNames = page.getByText(/fede|fachi|lucho|leo|nico/i);
    const hasPlayers = await playerNames.isVisible().catch(() => false);

    expect(hasPlayers).toBe(true);

    // Take screenshot showing player list
    await page.screenshot({ path: 'test-results/screenshots/ranking-player-list.png' });
  });

  test('can filter players by status (All/Usual/Invite)', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for filters to load
    await page.waitForTimeout(1000);

    // Check for status filter buttons
    const allButton = page.getByRole('button', { name: 'All', exact: true });
    const usualButton = page.getByRole('button', { name: 'Usual', exact: true });
    const inviteButton = page.getByRole('button', { name: 'Invite', exact: true });

    // Verify all buttons are visible
    await expect(allButton).toBeVisible();
    await expect(usualButton).toBeVisible();
    await expect(inviteButton).toBeVisible();

    // Test clicking different status filters
    await usualButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/ranking-filter-usual.png' });

    await inviteButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/ranking-filter-invite.png' });

    await allButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/ranking-filter-all.png' });
  });

  test('can use ELO range filter', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for filters to load
    await page.waitForTimeout(1000);

    // Look for ELO range slider or filter
    const eloRangeLabel = page.getByText(/elo range|rango elo/i);
    const hasEloFilter = await eloRangeLabel.isVisible().catch(() => false);

    if (hasEloFilter) {
      // Look for range inputs
      const rangeInputs = page.locator('input[type="range"]');
      const rangeCount = await rangeInputs.count();

      expect(rangeCount).toBeGreaterThanOrEqual(1);

      // Take screenshot of ELO filter
      await page.screenshot({ path: 'test-results/screenshots/ranking-elo-filter.png' });
    }
  });

  test('can toggle "Active players only" filter', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for filters to load
    await page.waitForTimeout(1000);

    // Look for "Active players only" toggle
    const activeOnlyLabel = page.getByText(/active players only/i);
    await expect(activeOnlyLabel).toBeVisible({ timeout: 5000 });

    // Find the checkbox or toggle button
    const activeToggle = page.locator('input#active-toggle');

    if (await activeToggle.isVisible()) {
      // Test toggling the checkbox
      await activeToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/screenshots/ranking-filter-active-on.png' });

      await activeToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/screenshots/ranking-filter-active-off.png' });
    }
  });

  test('can view player details from ranking', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for clickable player items
    const playerLinks = page.locator('a[href*="/players/"], [data-testid*="player"]');
    const playerCount = await playerLinks.count();

    if (playerCount > 0) {
      // Click on first player
      await playerLinks.first().click();

      // Should navigate to player details page
      await expect(page).toHaveURL(/\/players\//);

      // Take screenshot of player details
      await page.screenshot({ path: 'test-results/screenshots/ranking-player-details.png', fullPage: true });
    }
  });

  test('ranking page shows empty state when no players match filters', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Try to trigger empty state by filtering (e.g., select a status with no players)
    const inviteButton = page.getByRole('button', { name: 'Invite', exact: true });

    if (await inviteButton.isVisible()) {
      await inviteButton.click();
      await page.waitForTimeout(500);

      // Look for empty state message
      const emptyStateText1 = page.getByText(/no data to display|sin datos/i);
      const emptyStateText2 = page.getByText(/try adjusting your filters/i);

      // If empty state appears, verify correct message
      if (await emptyStateText1.isVisible().catch(() => false)) {
        await expect(emptyStateText2).toBeVisible();

        // Take screenshot of empty state
        await page.screenshot({ path: 'test-results/screenshots/ranking-empty-state.png' });
      }
    }
  });

  test('ranking page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateAndReady(page, '/g/padel/ranking');

    // Verify ranking page is responsive
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();

    // Take screenshot of mobile ranking
    await page.screenshot({
      path: 'test-results/screenshots/ranking-mobile.png',
      fullPage: true
    });
  });

  test('ranking page is responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await navigateAndReady(page, '/g/padel/ranking');

    // Verify ranking page is responsive
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Take screenshot of tablet ranking
    await page.screenshot({
      path: 'test-results/screenshots/ranking-tablet.png',
      fullPage: true
    });
  });

  test('ranking page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for chart to render
    await page.waitForSelector('canvas', { timeout: 15000 });

    const loadTime = Date.now() - startTime;

    // Chart should load within 15 seconds
    expect(loadTime).toBeLessThan(15000);

    console.log(`Ranking page loaded in ${loadTime}ms`);
  });

  test('ranking page does not show loading errors', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for page to fully load
    await page.waitForSelector('canvas', { timeout: 15000 });

    // Check for any error messages
    const errorText = page.getByText(/error|Error|ERROR/i);
    const hasError = await errorText.isVisible().catch(() => false);

    expect(hasError).toBe(false);

    // Take screenshot showing no errors
    await page.screenshot({ path: 'test-results/screenshots/ranking-no-errors.png' });
  });

  test('can compare players from ranking', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for compare button or link
    const compareButton = page.getByRole('button', { name: /comparar|compare/i }).or(
      page.locator('a[href*="compare"]')
    );

    if (await compareButton.first().isVisible()) {
      await compareButton.first().click();

      // Should navigate to compare page
      await expect(page).toHaveURL(/\/compare/);

      // Take screenshot of compare page
      await page.screenshot({ path: 'test-results/screenshots/ranking-compare-page.png', fullPage: true });
    }
  });

  test('ranking page navigation persists after refresh', async ({ page }) => {
    // Apply a filter first
    await navigateAndReady(page, '/g/padel/ranking');
    await page.waitForTimeout(1000);

    const usualButton = page.getByRole('button', { name: 'Usual', exact: true });
    if (await usualButton.isVisible()) {
      await usualButton.click();
      await page.waitForTimeout(500);
    }

    // Refresh the page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Verify page still loads correctly
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Take screenshot after refresh
    await page.screenshot({ path: 'test-results/screenshots/ranking-after-refresh.png' });
  });

  test('can navigate between ranking and other pages', async ({ page }) => {
    // Start at ranking
    await navigateAndReady(page, '/g/padel/ranking');
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Navigate to matches
    await navigateAndReady(page, '/g/padel/matches');
    await expect(page.getByRole('heading', { name: /partidos|matches/i })).toBeVisible();

    // Navigate back to ranking
    await navigateAndReady(page, '/g/padel/ranking');
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/ranking-nav-other-pages.png' });
  });

  test('ranking page displays ELO history information', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/ranking');

    // Wait for chart to render
    await page.waitForSelector('canvas', { timeout: 15000 });

    // Check for ELO-related text
    const eloText = page.getByText(/elo|evolución|historial/i);
    const hasEloText = await eloText.isVisible().catch(() => false);

    expect(hasEloText).toBe(true);

    // Take screenshot showing ELO information
    await page.screenshot({ path: 'test-results/screenshots/ranking-elo-info.png' });
  });
});
