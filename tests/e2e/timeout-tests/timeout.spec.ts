import { test } from '@playwright/test';

test.describe('Timeout Verification Tests', () => {

  test('hang test - should timeout after ~5 minutes', async () => {
    // This test deliberately hangs to verify timeout mechanism
    // It should fail after ~5 minutes (global timeout)
    await new Promise(() => {}); // Never resolves - will timeout
  });

  test('fast test - should pass quickly', async ({ page }) => {
    // This test should pass quickly (< 1 second)
    // Confirms other tests are working
    await page.goto('/');
    await expect(page).toHaveTitle(/Padel/i);
  });

});
