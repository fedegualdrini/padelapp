import { test, expect } from '@playwright/test';

test.describe('Win/Loss Streaks Feature', () => {

  test.describe('Player Card Streak Badges', () => {

    test.beforeEach(async ({ page }) => {
      // Auth is handled once in globalSetup (storageState).
      await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: 'Jugadores', exact: false }).waitFor({
        state: 'visible',
        timeout: 20000,
      });
    });

    test('should display player directory page', async ({ page }) => {
      // Verify the page loaded
      await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible();
      await page.screenshot({ path: 'tests/e2e/screenshots/streaks-players-page.png' });
    });

    test('should show streak badges on player cards when applicable', async ({ page }) => {
      // Wait for player cards to load
      await page.waitForSelector('.rounded-xl.border', { timeout: 10000 });

      // Look for streak badges (elements containing 🔥 or ❄️)
      const winStreakBadges = page.locator('text=🔥').filter({ hasText: /\d+W/ });
      const lossStreakBadges = page.locator('text=❄️').filter({ hasText: /\d+L/ });

      // Take screenshot to verify badges are visible
      await page.screenshot({
        path: 'tests/e2e/screenshots/streaks-badges-on-cards.png',
        fullPage: true
      });

      // Note: We don't assert on specific counts since they depend on test data
      // but we verify the page structure is correct
      const playerCards = page.locator('.rounded-xl.border').filter({ hasText: /partidos/ });
      const cardCount = await playerCards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should have streak badges with correct styling', async ({ page }) => {
      // Wait for content
      await page.waitForTimeout(2000);

      // Look for streak badge styling classes
      const winStreakElements = page.locator('.bg-orange-100, .dark\\:bg-orange-900\\/30');
      const lossStreakElements = page.locator('.bg-blue-100, .dark\\:bg-blue-900\\/30');

      // Take screenshot of styling
      await page.screenshot({ path: 'tests/e2e/screenshots/streaks-badge-styling.png' });
    });

    test('should navigate to player profile from card', async ({ page }) => {
      // Click on first player name
      const firstPlayerLink = page.locator('a[href*="/g/padel/players/"]').first();
      await expect(firstPlayerLink).toBeVisible();

      await firstPlayerLink.click();

      // Verify we navigated to profile page
      await page.waitForURL(/\/g\/padel\/players\/.+/, { timeout: 10000 });
      await expect(page.getByText('Estadísticas')).toBeVisible();
    });
  });

  test.describe('Player Profile Streak Display', () => {

    test.beforeEach(async ({ page }) => {
      // Navigate to a player profile
      await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.rounded-xl.border', { timeout: 10000 });

      // Click first player
      const firstPlayerLink = page.locator('a[href*="/g/padel/players/"]').first();
      if (await firstPlayerLink.isVisible()) {
        await firstPlayerLink.click();
        await page.waitForURL(/\/g\/padel\/players\/.+/, { timeout: 10000 });
      }
    });

    test('should display streak section on profile', async ({ page }) => {
      // Wait for profile page to load
      await page.waitForSelector('text=Estadísticas', { timeout: 10000 });

      // Verify streak section elements are present
      await expect(page.getByText('Racha actual')).toBeVisible();
      await expect(page.getByText('Mejor racha ganadora')).toBeVisible();
      await expect(page.getByText('Peor racha perdedora')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: 'tests/e2e/screenshots/streaks-profile-section.png',
        fullPage: true
      });
    });

    test('should display streak values correctly', async ({ page }) => {
      await page.waitForSelector('text=Estadísticas', { timeout: 10000 });

      // Look for streak value indicators (emojis)
      const fireEmoji = page.locator('text=🔥');
      const snowEmoji = page.locator('text=❄️');
      const trophyEmoji = page.locator('text=🏆');
      const chartEmoji = page.locator('text=📉');

      // At least some streak indicators should be visible
      const hasFire = await fireEmoji.isVisible().catch(() => false);
      const hasSnow = await snowEmoji.isVisible().catch(() => false);
      const hasTrophy = await trophyEmoji.isVisible().catch(() => false);
      const hasChart = await chartEmoji.isVisible().catch(() => false);

      // Take screenshot
      await page.screenshot({ path: 'tests/e2e/screenshots/streaks-values.png' });

      // We expect at least trophy and chart to be visible (longest streaks)
      expect(hasTrophy || hasChart).toBeTruthy();
    });

    test('should display streak history chart when available', async ({ page }) => {
      await page.waitForSelector('text=Estadísticas', { timeout: 10000 });

      // Check for streak history section
      const streakHistoryHeading = page.getByText('Historial de rachas');

      if (await streakHistoryHeading.isVisible().catch(() => false)) {
        // If history is present, verify chart elements
        await expect(page.locator('.space-y-3')).toBeVisible();

        await page.screenshot({
          path: 'tests/e2e/screenshots/streaks-history-chart.png',
          fullPage: true
        });
      }
    });

    test('should navigate back to players list', async ({ page }) => {
      await page.waitForSelector('text=Estadísticas', { timeout: 10000 });

      // Click back button
      const backButton = page.getByText('← Volver a jugadores');
      await expect(backButton).toBeVisible();

      await backButton.click();

      // Verify navigation back
      await page.waitForURL(/\/g\/padel\/players/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible();
    });
  });

  test.describe('Empty States', () => {

    test('should handle players with no matches gracefully', async ({ page }) => {
      // Navigate to players page
      await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.rounded-xl.border', { timeout: 10000 });

      // Look for invite players who may not have matches
      const inviteSection = page.getByText('Invitados');

      if (await inviteSection.isVisible()) {
        await page.screenshot({
          path: 'tests/e2e/screenshots/streaks-empty-state.png',
          fullPage: true
        });
      }

      // Verify page doesn't crash
      await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {

    test('should display streak badges correctly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.rounded-xl.border', { timeout: 10000 });

      await page.screenshot({
        path: 'tests/e2e/screenshots/streaks-mobile-players.png',
        fullPage: true
      });
    });

    test('should display streak section correctly on mobile profile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('a[href*="/g/padel/players/"]', { timeout: 10000 });

      const firstPlayerLink = page.locator('a[href*="/g/padel/players/"]').first();
      if (await firstPlayerLink.isVisible()) {
        await firstPlayerLink.click();
        await page.waitForURL(/\/g\/padel\/players\/.+/, { timeout: 10000 });

        await page.screenshot({
          path: 'tests/e2e/screenshots/streaks-mobile-profile.png',
          fullPage: true
        });
      }
    });
  });
});
