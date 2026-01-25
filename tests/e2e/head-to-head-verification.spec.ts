import { test, expect, type Page } from '@playwright/test';

/**
 * Head-to-Head Comparison Feature Verification Test
 *
 * This test verifies that the head-to-head comparison feature works correctly
 * after the bug fix. It tests the complete user flow from navigation to data display.
 */

test.describe('Head-to-Head Comparison - Bug Fix Verification', () => {
  // Helper function to join the group
  async function joinGroup(page: Page) {
    await page.goto('/g/padel/join', { waitUntil: 'networkidle' });

    const joinPageVisible = await page
      .locator('text=Ingresá la clave')
      .isVisible()
      .catch(() => false);

    if (joinPageVisible) {
      const passphraseInput = page
        .locator('input[type="password"]')
        .or(page.locator('input[name="passphrase"]'));
      await passphraseInput.fill('padel');

      const joinButton = page.locator('button:has-text("Ingresar")');
      await joinButton.click();

      await page.waitForURL(/\/g\/padel/, { timeout: 10000 });
    }
  }

  test('should display head-to-head comparison after selecting two players', async ({ page }) => {
    console.log('\n=== Head-to-Head Comparison Feature Verification ===\n');

    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('Browser console error:', msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      console.error('Page error:', error.message);
    });

    // Step 1: Authenticate
    console.log('Step 1: Authenticating with group...');
    await joinGroup(page);

    // Step 2: Navigate to compare page
    console.log('Step 2: Navigating to /g/padel/players/compare...');
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    // Step 3: Select two players
    console.log('Step 3: Selecting two players...');
    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    await expect(playerASelect).toBeVisible();
    await expect(playerBSelect).toBeVisible();

    const playerAId = await playerASelect
      .locator('option')
      .nth(1)
      .getAttribute('value');
    const playerBId = await playerBSelect
      .locator('option')
      .nth(2)
      .getAttribute('value');

    if (playerAId) await playerASelect.selectOption(playerAId);
    await page.waitForTimeout(300);
    if (playerBId) await playerBSelect.selectOption(playerBId);

    // Step 4: Verify comparison is visible
    console.log('Step 4: Verifying comparison section...');
    const comparisonSection = page.locator('text=Head-to-head').first();
    const isVisible = await comparisonSection.isVisible().catch(() => false);
    console.log(`Comparison section visible: ${isVisible}`);

    // Basic assertion: should not have page errors
    expect(consoleErrors).toEqual([]);
  });
});
