import { test, expect } from '@playwright/test';
import { gotoCompare, getOptionValue } from './utils';

test.describe('Head-to-Head Comparison Feature', () => {

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

    // With globalSetup+storageState, we should already be authenticated.
    console.log('\nNavigating to comparison page...');
    const { playerASelect, playerBSelect } = await gotoCompare(page);

    const optionCount = await playerASelect.locator('option').count();
    console.log(`\nPlayer A dropdown has ${optionCount} options`);

    // Select two different players
    if (optionCount >= 3) {
      const playerAId = await getOptionValue(playerASelect, 1);
      const playerBId = await getOptionValue(playerBSelect, 2);

      console.log(`Selecting Player A: ${playerAId}`);
      console.log(`Selecting Player B: ${playerBId}`);

      if (playerAId) await playerASelect.selectOption(playerAId);
      await page.waitForTimeout(500);
      if (playerBId) await playerBSelect.selectOption(playerBId);
      await page.waitForTimeout(2000);

      // Check for comparison data
      console.log('\nChecking for comparison data...');

      const comparisonHeader = page.getByRole('heading', { name: 'Head to Head', exact: true });
      const headerVisible = await comparisonHeader.isVisible().catch(() => false);
      console.log(`Comparison header visible: ${headerVisible}`);

      // One of these should appear after selecting two distinct players:
      // - Match history section (if they played)
      // - "Sin enfrentamientos" empty state (if they never played)
      const matchHistory = page.getByText('Historial de enfrentamientos');
      const noMatches = page.getByText('Sin enfrentamientos');

      const matchHistoryVisible = await matchHistory.isVisible().catch(() => false);
      const noMatchesVisible = await noMatches.isVisible().catch(() => false);
      console.log(`Match history visible: ${matchHistoryVisible}`);
      console.log(`No matches visible: ${noMatchesVisible}`);

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
