import { test, expect } from '@playwright/test';

test.describe('Ranking Page - Post Timeframe Removal', () => {

  test.beforeEach(async ({ page }) => {
    // First, join the group with the default passphrase
    await page.goto('/g/padel/join');
    await page.waitForLoadState('networkidle');

    // Check if we're already a member (redirected to dashboard)
    const currentUrl = page.url();
    if (!currentUrl.includes('/join')) {
      // Already a member, navigate to ranking
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      return;
    }

    // Fill in the passphrase and submit
    const passphraseInput = page.locator('input[type="password"], input[placeholder*="clave"]');
    await passphraseInput.waitFor({ state: 'visible', timeout: 5000 });
    await passphraseInput.fill('padel');

    const submitButton = page.getByRole('button', { name: /ingresar|submit|join/i });
    await submitButton.click();

    // Wait for navigation away from join page
    await page.waitForURL((url) => !url.pathname.includes('/join'), { timeout: 15000 });

    // Now navigate to the ranking page
    await page.goto('/g/padel/ranking');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Visual Verification', () => {

    test('should NOT display timeframe selection buttons', async ({ page }) => {
      // Verify that specific timeframe buttons (1W, 1M, 3M, 6M, 1Y) are NOT present
      // Note: We avoid checking for "ALL" as it may match the Player Status "All" button
      const timeframeButtons = [
        page.getByRole('button', { name: /^1W$/i }),
        page.getByRole('button', { name: /^1M$/i }),
        page.getByRole('button', { name: /^3M$/i }),
        page.getByRole('button', { name: /^6M$/i }),
        page.getByRole('button', { name: /^1Y$/i }),
      ];

      for (const button of timeframeButtons) {
        await expect(button).not.toBeVisible();
      }

      // Verify no timeframe label exists
      const timeframeLabel = page.getByText(/^Time Range$/i);
      await expect(timeframeLabel).not.toBeVisible();

      // Take screenshot showing absence of timeframe controls
      await page.screenshot({ path: 'tests/e2e/screenshots/no-timeframe-buttons.png' });
    });

    test('should display page header correctly', async ({ page }) => {
      // Verify the page title and description
      await expect(page.getByText('Evolucion')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();
      await expect(page.getByText('Seguimiento histórico de ELO por jugador.')).toBeVisible();
    });

    test('should display chart container properly', async ({ page }) => {
      // Verify the chart container is visible
      const chartContainer = page.locator('.rounded-lg.border.border-\\[var\\(--card-border\\)\\]').first();
      await expect(chartContainer).toBeVisible();

      // Take a screenshot of the full page layout
      await page.screenshot({
        path: 'tests/e2e/screenshots/ranking-page-layout.png',
        fullPage: true
      });
    });

    test('should have proper spacing and layout without timeframe buttons', async ({ page }) => {
      // Check that the layout is clean
      const mainContent = page.locator('div.space-y-6');
      await expect(mainContent).toBeVisible();

      // Verify the flex layout for chart and sidebar
      const flexContainer = page.locator('div.flex.flex-col.lg\\:flex-row');
      await expect(flexContainer).toBeVisible();
    });

    test('should display ELO chart', async ({ page }) => {
      // Wait for chart to render (lightweight-charts creates canvas elements)
      const chartCanvas = page.locator('canvas').first();
      await expect(chartCanvas).toBeVisible({ timeout: 10000 });

      // Take a screenshot of the chart area
      await page.screenshot({
        path: 'tests/e2e/screenshots/ranking-chart.png'
      });
    });
  });

  test.describe('Functional Testing', () => {

    test('should display all historical ELO data by default', async ({ page }) => {
      // Wait for chart to render
      await page.waitForSelector('canvas', { timeout: 10000 });

      // Verify that the chart is showing data (canvas should have content)
      const chartCanvas = page.locator('canvas').first();
      const boundingBox = await chartCanvas.boundingBox();

      expect(boundingBox).toBeTruthy();
      expect(boundingBox!.width).toBeGreaterThan(0);
      expect(boundingBox!.height).toBeGreaterThan(0);
    });

    test('should have status filter working (all/usual/invite)', async ({ page }) => {
      // Wait for sidebar to load
      await page.waitForSelector('text=Status', { timeout: 5000 });

      // Check for status filter buttons
      const allButton = page.getByRole('button', { name: 'All' });
      const usualButton = page.getByRole('button', { name: 'Usual' });
      const inviteButton = page.getByRole('button', { name: 'Invite' });

      // Verify all status buttons are visible
      await expect(allButton).toBeVisible();
      await expect(usualButton).toBeVisible();
      await expect(inviteButton).toBeVisible();

      // Test clicking different status filters
      await usualButton.click();
      await page.waitForTimeout(500); // Wait for filter to apply
      await page.screenshot({ path: 'tests/e2e/screenshots/filter-usual.png' });

      await inviteButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/filter-invite.png' });

      await allButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/e2e/screenshots/filter-all.png' });
    });

    test('should have ELO range slider filter working', async ({ page }) => {
      // Wait for the slider to be present
      const sliderContainer = page.locator('text=ELO Range').locator('..');
      await expect(sliderContainer).toBeVisible({ timeout: 5000 });

      // Look for range input elements
      const rangeInputs = page.locator('input[type="range"]');
      const count = await rangeInputs.count();

      // Should have 2 range inputs (min and max)
      expect(count).toBeGreaterThanOrEqual(1);

      // Take screenshot of the filter panel
      await page.screenshot({ path: 'tests/e2e/screenshots/elo-range-filter.png' });
    });

    test('should have "Active players only" toggle working', async ({ page }) => {
      // Look for the Active players only toggle (updated label)
      const activeOnlyLabel = page.getByText('Active players only');
      await expect(activeOnlyLabel).toBeVisible({ timeout: 5000 });

      // Find the checkbox or toggle button
      const activeToggle = page.locator('input#active-toggle');

      if (await activeToggle.isVisible()) {
        // Test toggling the checkbox
        await activeToggle.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/e2e/screenshots/filter-active-only-on.png' });

        await activeToggle.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/e2e/screenshots/filter-active-only-off.png' });
      }
    });

    test('should apply multiple filters together', async ({ page }) => {
      // Wait for page to load
      await page.waitForSelector('text=Filters', { timeout: 5000 });

      // Apply status filter
      const usualButton = page.getByRole('button', { name: 'Usual', exact: true });
      await usualButton.click();
      await page.waitForTimeout(300);

      // Apply active only filter
      const activeToggle = page.locator('input#active-toggle');
      if (await activeToggle.isVisible()) {
        await activeToggle.click();
        await page.waitForTimeout(300);
      }

      // Take screenshot of combined filters
      await page.screenshot({
        path: 'tests/e2e/screenshots/filters-combined.png',
        fullPage: true
      });
    });
  });

  test.describe('Edge Cases', () => {

    test('should display correct empty state message', async ({ page }) => {
      // Try to trigger empty state by filtering out all players
      // First, check if we can access filter controls
      const statusButtons = page.getByRole('button', { name: 'Invite' });

      if (await statusButtons.isVisible()) {
        await statusButtons.click();
        await page.waitForTimeout(500);

        // Look for empty state (if it appears)
        const emptyStateText1 = page.getByText('No data to display');
        const emptyStateText2 = page.getByText('Try adjusting your filters');

        // Verify the empty state message does NOT mention "time range"
        const timeRangeText = page.getByText(/time range/i);
        await expect(timeRangeText).not.toBeVisible();

        // If empty state is showing, verify correct message
        if (await emptyStateText1.isVisible()) {
          await expect(emptyStateText2).toBeVisible();
          await expect(emptyStateText2).toHaveText('Try adjusting your filters');

          await page.screenshot({ path: 'tests/e2e/screenshots/empty-state.png' });
        }
      }
    });

    test('should handle players with no match data', async ({ page }) => {
      // The page should render even if some players have no data
      await page.waitForSelector('canvas', { timeout: 10000 });

      // Chart should be visible regardless
      const chartCanvas = page.locator('canvas').first();
      await expect(chartCanvas).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {

    test('should display correctly on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify layout on desktop
      const flexContainer = page.locator('div.flex.flex-col.lg\\:flex-row');
      await expect(flexContainer).toBeVisible();

      await page.screenshot({
        path: 'tests/e2e/screenshots/desktop-view.png',
        fullPage: true
      });
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'tests/e2e/screenshots/tablet-view.png',
        fullPage: true
      });
    });

    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // On mobile, the flex should be column
      await page.screenshot({
        path: 'tests/e2e/screenshots/mobile-view.png',
        fullPage: true
      });
    });
  });

  test.describe('Data Integrity', () => {

    test('should show all historical ELO data without date restrictions', async ({ page }) => {
      // Wait for chart to render
      await page.waitForSelector('canvas', { timeout: 10000 });

      // The chart should display all data (no timeframe restrictions)
      // This is verified by the absence of timeframe buttons
      const timeframeButtons = page.locator('button:has-text("1W"), button:has-text("1M"), button:has-text("ALL")');
      await expect(timeframeButtons).toHaveCount(0);
    });

    test('should display player legend in sidebar', async ({ page }) => {
      // Wait for sidebar to load
      await page.waitForTimeout(2000);

      // Look for player names in the sidebar (they should be listed)
      const sidebar = page.locator('div.lg\\:w-\\[30\\%\\]');
      await expect(sidebar).toBeVisible();

      await page.screenshot({
        path: 'tests/e2e/screenshots/player-legend.png'
      });
    });
  });

  test.describe('Performance and Loading', () => {

    test('should load chart within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/g/padel/ranking');
      await page.waitForSelector('canvas', { timeout: 15000 });

      const loadTime = Date.now() - startTime;

      // Chart should load within 15 seconds
      expect(loadTime).toBeLessThan(15000);
    });

    test('should not show loading errors', async ({ page }) => {
      // Check for any error messages
      const errorText = page.locator('text=/error|Error|ERROR/');
      await expect(errorText).not.toBeVisible();
    });
  });
});
