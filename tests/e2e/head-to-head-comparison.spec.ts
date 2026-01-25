import { test, expect, type Page } from '@playwright/test';

test.describe('Head-to-Head Comparison Feature', () => {
  // Helper function to join the group
  async function joinGroup(page: Page) {
    console.log('\nAuthenticating: Joining group with passphrase...');
    await page.goto('/g/padel/join', { waitUntil: 'networkidle' });

    // Check if we're on the join page
    const joinPageVisible = await page
      .locator('text=Ingresá la clave')
      .isVisible()
      .catch(() => false);

    if (joinPageVisible) {
      // Enter passphrase
      const passphraseInput = page
        .locator('input[type="password"]')
        .or(page.locator('input[name="passphrase"]'));
      await passphraseInput.fill('padel');

      // Click join button
      const joinButton = page.locator('button:has-text("Ingresar")');
      await joinButton.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/g\/padel/, { timeout: 10000 });
      console.log('Successfully joined group!');
    } else {
      console.log('Already authenticated or redirected');
    }
  }

  test('should investigate why comparison data is not showing', async ({ page }) => {
    console.log('\n=== Starting Head-to-Head Comparison Investigation ===\n');

    // Set up console listener to capture all console messages
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];

    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log('Browser console:', text);
    });

    page.on('pageerror', (error) => {
      errorMessages.push(error.message);
      console.error('Page error:', error.message);
    });

    // Step 1: Authenticate
    await joinGroup(page);

    // Step 2: Navigate to compare page
    console.log('\nNavigating to comparison page...');
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    // Step 3: Check if dropdowns exist
    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    await expect(playerASelect).toBeVisible();
    await expect(playerBSelect).toBeVisible();

    // Get all options
    const playerAOptions = await playerASelect.locator('option').all();
    console.log(`\nPlayer A dropdown has ${playerAOptions.length} options`);

    // Select two different players
    if (playerAOptions.length >= 3) {
      const playerAId = await playerASelect
        .locator('option')
        .nth(1)
        .getAttribute('value');
      const playerBId = await playerBSelect
        .locator('option')
        .nth(2)
        .getAttribute('value');

      console.log(`Selecting Player A: ${playerAId}`);
      console.log(`Selecting Player B: ${playerBId}`);

      if (playerAId) await playerASelect.selectOption(playerAId);
      await page.waitForTimeout(500);
      if (playerBId) await playerBSelect.selectOption(playerBId);
      await page.waitForTimeout(2000);

      // Check for comparison data
      console.log('\nChecking for comparison data...');

      const comparisonSection = page.locator('text=Head-to-head').first();
      const isVisible = await comparisonSection.isVisible().catch(() => false);
      console.log(`Comparison section visible: ${isVisible}`);

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/comparison-page.png', fullPage: true });

      // Print console errors
      if (errorMessages.length > 0) {
        console.log('\n=== ERRORS FOUND ===');
        errorMessages.forEach((error, i) => {
          console.log(`${i + 1}. ${error}`);
        });
      }

      // Basic assertion: should not have page errors
      expect(errorMessages).toEqual([]);
    } else {
      console.log('Not enough players in dropdown to test comparison');
    }
  });
});
