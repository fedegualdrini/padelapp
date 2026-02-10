import { test, expect } from '@playwright/test';

test.describe('Compare Players Validation', () => {

  test('should handle invalid player IDs gracefully', async ({ page }) => {
    console.log('\n=== Testing Invalid Player ID Handling ===\n');

    // Navigate to compare page with invalid player IDs
    console.log('Step 1: Navigating with invalid player IDs...');
    await page.goto('/g/padel/players/compare?playerA=invalid-id-123&playerB=invalid-id-456', { waitUntil: 'domcontentloaded' });

    // Verify page loads (it should not crash)
    console.log('Step 2: Verifying page loads...');
    await expect(page.getByRole('heading', { name: 'Head to Head', exact: true })).toBeVisible({ timeout: 10000 });

    // The page should show the comparison interface but with no data
    // Player selectors should be visible
    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    await expect(playerASelect).toBeVisible({ timeout: 5000 });
    await expect(playerBSelect).toBeVisible({ timeout: 5000 });

    console.log('✅ Page handles invalid player IDs gracefully');
  });

  test('should handle single invalid player ID', async ({ page }) => {
    console.log('\n=== Testing Single Invalid Player ID ===\n');

    // Navigate with one valid-looking and one invalid player ID
    console.log('Step 1: Navigating with one invalid player ID...');
    await page.goto('/g/padel/players/compare?playerA=valid-id&playerB=invalid-id-789', { waitUntil: 'domcontentloaded' });

    // Verify page loads without crashing
    console.log('Step 2: Verifying page loads...');
    await expect(page.getByRole('heading', { name: 'Head to Head', exact: true })).toBeVisible({ timeout: 10000 });

    // Player selectors should be visible
    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    await expect(playerASelect).toBeVisible({ timeout: 5000 });
    await expect(playerBSelect).toBeVisible({ timeout: 5000 });

    console.log('✅ Page handles single invalid player ID gracefully');
  });

  test('should handle missing player parameters', async ({ page }) => {
    console.log('\n=== Testing Missing Player Parameters ===\n');

    // Navigate without player parameters
    console.log('Step 1: Navigating without player parameters...');
    await page.goto('/g/padel/players/compare', { waitUntil: 'domcontentloaded' });

    // Verify page loads and shows empty state
    console.log('Step 2: Verifying page loads...');
    await expect(page.getByRole('heading', { name: 'Head to Head', exact: true })).toBeVisible({ timeout: 10000 });

    // Should show empty state message
    const emptyState = page.getByText('Seleccioná dos jugadores diferentes para ver su historial');
    await expect(emptyState).toBeVisible({ timeout: 5000 });

    console.log('✅ Page handles missing player parameters correctly');
  });

  test('should handle same player ID twice', async ({ page }) => {
    console.log('\n=== Testing Same Player ID Twice ===\n');

    // Navigate with same player ID for both parameters
    console.log('Step 1: Navigating with same player ID...');
    await page.goto('/g/padel/players/compare?playerA=same-player-id&playerB=same-player-id', { waitUntil: 'domcontentloaded' });

    // Verify page loads without crashing
    console.log('Step 2: Verifying page loads...');
    await expect(page.getByRole('heading', { name: 'Head to Head', exact: true })).toBeVisible({ timeout: 10000 });

    // Should show empty state message (since same player can't play against themselves)
    const emptyState = page.getByText('Seleccioná dos jugadores diferentes para ver su historial');
    await expect(emptyState).toBeVisible({ timeout: 5000 });

    console.log('✅ Page handles same player ID correctly');
  });
});
