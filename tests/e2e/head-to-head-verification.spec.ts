import { test, expect } from '@playwright/test';
import { gotoCompare, getOptionValue } from './utils';

/**
 * Head-to-Head Comparison Feature Verification Test
 *
 * This test verifies that the head-to-head comparison feature works correctly
 * after the bug fix. It tests the complete user flow from navigation to data display.
 */

test.describe('Head-to-Head Comparison - Bug Fix Verification', () => {

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

    // Step 1+2: Navigate to compare page (auth is handled by globalSetup/storageState)
    console.log('Step 1: Navigating to /g/padel/players/compare...');
    const { playerASelect, playerBSelect } = await gotoCompare(page);

    // Step 2: Select two players
    console.log('Step 2: Selecting two players...');
    const playerAId = await getOptionValue(playerASelect, 1);
    const playerBId = await getOptionValue(playerBSelect, 2);

    if (playerAId) await playerASelect.selectOption(playerAId);
    await page.waitForTimeout(300);
    if (playerBId) await playerBSelect.selectOption(playerBId);

    // Step 3: Verify results UI appears (either history or empty state)
    console.log('Step 3: Verifying comparison results...');

    await expect(page.getByRole('heading', { name: 'Head to Head', exact: true })).toBeVisible();

    const matchHistory = page.getByText('Historial de enfrentamientos');
    const noMatches = page.getByText('Sin enfrentamientos');

    // Wait for one of the two states to show up.
    await expect
      .poll(async () => {
        const a = await matchHistory.isVisible().catch(() => false);
        const b = await noMatches.isVisible().catch(() => false);
        return a || b;
      }, { timeout: 20000 })
      .toBe(true);

    // Basic assertion: should not have page errors
    expect(consoleErrors).toEqual([]);
  });
});
