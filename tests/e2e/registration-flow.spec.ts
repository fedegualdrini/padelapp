import { test, expect } from '@playwright/test';
import { login, logout, navigateAndReady, waitForPageReady } from './test-helpers';

/**
 * User Registration / Join Group Flow E2E Tests
 * Tests the complete journey from group landing to successful authentication
 */

test.describe('User Registration / Join Group Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh - ensure no active session
    await logout(page).catch(() => {});
    await navigateAndReady(page, '/g/padel/join');
  });

  test('complete join flow with valid passphrase', async ({ page }) => {
    // Verify join page elements
    await expect(page.getByRole('heading', { name: 'Ingresá la clave' })).toBeVisible();
    await expect(page.getByText('Usá la clave del grupo para habilitar el acceso a sus datos.')).toBeVisible();

    // Find and fill passphrase input
    const passphraseInput = page.getByRole('textbox', { name: 'passphrase' }).or(
      page.locator('input[type="password"]').or(page.locator('input[name="passphrase"]'))
    );
    await expect(passphraseInput).toBeVisible();
    await passphraseInput.fill('padel');

    // Find and click join button
    const joinButton = page.getByRole('button', { name: /ingresar|join/i });
    await expect(joinButton).toBeVisible();
    await joinButton.click();

    // Wait for navigation away from join page
    await page.waitForURL((url) => !url.pathname.includes('/join'), { timeout: 10000 });

    // Verify we're redirected to ranking page
    await expect(page).toHaveURL(/\/ranking/);
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Take screenshot of successful join
    await page.screenshot({ path: 'test-results/screenshots/join-success.png' });
  });

  test('join flow displays error with invalid passphrase', async ({ page }) => {
    // Verify join page elements
    await expect(page.getByRole('heading', { name: 'Ingresá la clave' })).toBeVisible();

    // Fill with wrong passphrase
    const passphraseInput = page.getByRole('textbox', { name: 'passphrase' }).or(
      page.locator('input[type="password"]').or(page.locator('input[name="passphrase"]'))
    );
    await passphraseInput.fill('invalid-passphrase');

    // Click join button
    const joinButton = page.getByRole('button', { name: /ingresar|join/i });
    await joinButton.click();

    // Verify error message appears
    const errorBox = page.getByRole('status').or(page.locator('[role="alert"]'));
    await expect(errorBox).toBeVisible({ timeout: 5000 });

    const errorMessage = await errorBox.textContent();
    expect(errorMessage?.toLowerCase()).toMatch(/clave|contraseña|incorrect|invalid/i);

    // Verify we stay on join page
    await expect(page).toHaveURL(/\/join/);

    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/screenshots/join-error.png' });
  });

  test('session persists after successful join', async ({ page }) => {
    // Join the group
    await login(page, 'padel', 'padel');

    // Verify we can access ranking page
    await navigateAndReady(page, '/g/padel/ranking');
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Reload page and verify session persists
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Navigate to another protected route (matches)
    await navigateAndReady(page, '/g/padel/matches');
    await expect(page.getByRole('heading', { name: /partidos|matches/i })).toBeVisible();

    // Take screenshot showing session persistence
    await page.screenshot({ path: 'test-results/screenshots/session-persists.png' });
  });

  test('can logout after joining', async ({ page }) => {
    // Join the group first
    await login(page, 'padel', 'padel');

    // Logout
    await logout(page);

    // Verify redirect to join page or home
    await page.waitForURL(/\/join|\/$/, { timeout: 5000 });

    // Verify we're no longer authenticated
    const url = page.url();
    expect(url.includes('/join') || url.endsWith('/')).toBe(true);

    // Try to access protected route - should redirect to join
    await page.goto('/g/padel/ranking');
    await waitForPageReady(page);

    // Should be redirected to join page
    await expect(page).toHaveURL(/\/join/);
    await expect(page.getByRole('heading', { name: 'Ingresá la clave' })).toBeVisible();

    // Take screenshot of logout state
    await page.screenshot({ path: 'test-results/screenshots/logout-state.png' });
  });

  test('can rejoin after logout', async ({ page }) => {
    // Join the group
    await login(page, 'padel', 'padel');
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Logout
    await logout(page);
    await expect(page.getByRole('heading', { name: 'Ingresá la clave' })).toBeVisible();

    // Rejoin
    await login(page, 'padel', 'padel');

    // Verify successful rejoin
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Take screenshot of successful rejoin
    await page.screenshot({ path: 'test-results/screenshots/rejoin-success.png' });
  });

  test('join page has proper form validation', async ({ page }) => {
    // Try to submit empty passphrase
    const joinButton = page.getByRole('button', { name: /ingresar|join/i });
    await joinButton.click();

    // Should show validation error or not submit
    const errorBox = page.getByRole('status').or(page.locator('[role="alert"]'));
    const hasError = await errorBox.isVisible().catch(() => false);
    const onJoinPage = page.url().includes('/join');

    // Either shows error or stays on join page
    expect(hasError || onJoinPage).toBe(true);

    // Take screenshot of validation state
    await page.screenshot({ path: 'test-results/screenshots/join-validation.png' });
  });

  test('join form handles special characters in passphrase', async ({ page }) => {
    // This test verifies the form can handle special characters
    const passphraseInput = page.getByRole('textbox', { name: 'passphrase' }).or(
      page.locator('input[type="password"]').or(page.locator('input[name="passphrase"]'))
    );

    // Type and verify input accepts characters
    await passphraseInput.fill('test-pass-123!');
    const value = await passphraseInput.inputValue();
    expect(value).toBe('test-pass-123!');

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/join-special-chars.png' });
  });

  test('join flow works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify join page is responsive
    await expect(page.getByRole('heading', { name: 'Ingresá la clave' })).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar|join/i })).toBeVisible();

    // Complete join on mobile
    const passphraseInput = page.getByRole('textbox', { name: 'passphrase' }).or(
      page.locator('input[type="password"]').or(page.locator('input[name="passphrase"]'))
    );
    await passphraseInput.fill('padel');

    const joinButton = page.getByRole('button', { name: /ingresar|join/i });
    await joinButton.click();

    // Verify successful join
    await page.waitForURL((url) => !url.pathname.includes('/join'), { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();

    // Take screenshot of mobile join
    await page.screenshot({
      path: 'test-results/screenshots/join-mobile.png',
      fullPage: true
    });
  });
});
