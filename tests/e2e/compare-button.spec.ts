import { test, expect } from '@playwright/test';

test.describe('Compare Players Button', () => {

  test('should open compare dialog when clicking "Comparar jugadores" button', async ({ page }) => {
    console.log('\n=== Testing Compare Players Button ===\n');

    // Navigate to players page
    console.log('Step 1: Navigating to players page...');
    await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible({ timeout: 20000 });

    // Click the "Comparar jugadores" button
    console.log('Step 2: Clicking "Comparar jugadores" button...');
    await page.getByRole('button', { name: 'Comparar jugadores' }).click();

    // Verify the dialog is open
    console.log('Step 3: Verifying dialog is open...');
    await expect(page.getByRole('heading', { name: 'Comparar jugadores' })).toBeVisible({ timeout: 5000 });

    // Verify the dialog has two player selectors
    const playerSelects = page.getByRole('combobox', { name: /Jugador [12]/ });
    await expect(playerSelects).toHaveCount(2);

    console.log('✅ Compare dialog opened successfully');
  });

  test('should navigate to compare page after selecting two players', async ({ page }) => {
    console.log('\n=== Testing Compare Page Navigation ===\n');

    // Navigate to players page
    console.log('Step 1: Navigating to players page...');
    await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible({ timeout: 20000 });

    // Click the "Comparar jugadores" button
    console.log('Step 2: Opening compare dialog...');
    await page.getByRole('button', { name: 'Comparar jugadores' }).click();

    // Verify dialog is open
    await expect(page.getByRole('heading', { name: 'Comparar jugadores' })).toBeVisible({ timeout: 5000 });

    // Get the player selectors
    const player1Select = page.getByRole('combobox', { name: 'Jugador 1' });
    const player2Select = page.getByRole('combobox', { name: 'Jugador 2' });

    // Wait for options to load
    await expect
      .poll(async () => await player1Select.locator('option').count(), { timeout: 10000 })
      .toBeGreaterThan(1);
    await expect
      .poll(async () => await player2Select.locator('option').count(), { timeout: 10000 })
      .toBeGreaterThan(1);

    // Select two different players
    console.log('Step 3: Selecting two players...');
    const player1Options = await player1Select.locator('option').all();
    const player2Options = await player2Select.locator('option').all();

    if (player1Options.length > 1 && player2Options.length > 2) {
      await player1Select.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      await player2Select.selectOption({ index: 2 });
      await page.waitForTimeout(300);

      // Click the "Comparar" button
      console.log('Step 4: Clicking "Comparar" button...');
      await page.getByRole('button', { name: 'Comparar' }).click();

      // Verify navigation to compare page
      console.log('Step 5: Verifying navigation to compare page...');
      await expect(page).toHaveURL(/\/g\/padel\/players\/compare/);
      await expect(page.getByRole('heading', { name: 'Head to Head', exact: true })).toBeVisible({ timeout: 10000 });

      console.log('✅ Successfully navigated to compare page');
    } else {
      console.log('⚠️ Not enough players to test selection');
    }
  });

  test('should show validation error when selecting same player twice', async ({ page }) => {
    console.log('\n=== Testing Validation Error ===\n');

    // Navigate to players page
    await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible({ timeout: 20000 });

    // Click the "Comparar jugadores" button
    await page.getByRole('button', { name: 'Comparar jugadores' }).click();

    // Verify dialog is open
    await expect(page.getByRole('heading', { name: 'Comparar jugadores' })).toBeVisible({ timeout: 5000 });

    // Get the player selectors
    const player1Select = page.getByRole('combobox', { name: 'Jugador 1' });
    const player2Select = page.getByRole('combobox', { name: 'Jugador 2' });

    // Wait for options to load
    await expect
      .poll(async () => await player1Select.locator('option').count(), { timeout: 10000 })
      .toBeGreaterThan(1);

    // Select the same player for both
    console.log('Step 1: Selecting same player for both...');
    await player1Select.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await player2Select.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Click the "Comparar" button
    console.log('Step 2: Clicking "Comparar" button...');
    await page.getByRole('button', { name: 'Comparar' }).click();

    // Verify error message is shown
    console.log('Step 3: Verifying error message...');
    await expect(page.getByText('Por favor seleccioná dos jugadores diferentes')).toBeVisible({ timeout: 2000 });

    // Verify we're still on the dialog (not navigated)
    await expect(page.getByRole('heading', { name: 'Comparar jugadores' })).toBeVisible();

    console.log('✅ Validation error shown correctly');
  });

  test('should show validation error when only one player is selected', async ({ page }) => {
    console.log('\n=== Testing Single Player Selection Validation ===\n');

    // Navigate to players page
    await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible({ timeout: 20000 });

    // Click the "Comparar jugadores" button
    await page.getByRole('button', { name: 'Comparar jugadores' }).click();

    // Verify dialog is open
    await expect(page.getByRole('heading', { name: 'Comparar jugadores' })).toBeVisible({ timeout: 5000 });

    // Get the player selectors
    const player1Select = page.getByRole('combobox', { name: 'Jugador 1' });

    // Wait for options to load
    await expect
      .poll(async () => await player1Select.locator('option').count(), { timeout: 10000 })
      .toBeGreaterThan(1);

    // Select only one player
    console.log('Step 1: Selecting only one player...');
    await player1Select.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Click the "Comparar" button
    console.log('Step 2: Clicking "Comparar" button...');
    await page.getByRole('button', { name: 'Comparar' }).click();

    // Verify error message is shown
    console.log('Step 3: Verifying error message...');
    await expect(page.getByText('Por favor seleccioná dos jugadores')).toBeVisible({ timeout: 2000 });

    // Verify we're still on the dialog (not navigated)
    await expect(page.getByRole('heading', { name: 'Comparar jugadores' })).toBeVisible();

    console.log('✅ Validation error shown correctly for single selection');
  });

  test('should close dialog when clicking "Cancelar" button', async ({ page }) => {
    console.log('\n=== Testing Dialog Close ===\n');

    // Navigate to players page
    await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible({ timeout: 20000 });

    // Click the "Comparar jugadores" button
    await page.getByRole('button', { name: 'Comparar jugadores' }).click();

    // Verify dialog is open
    await expect(page.getByRole('heading', { name: 'Comparar jugadores' })).toBeVisible({ timeout: 5000 });

    // Click the "Cancelar" button
    console.log('Step 1: Clicking "Cancelar" button...');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // Verify dialog is closed
    console.log('Step 2: Verifying dialog is closed...');
    await expect(page.getByRole('heading', { name: 'Comparar jugadores' })).not.toBeVisible({ timeout: 2000 });

    console.log('✅ Dialog closed successfully');
  });
});
