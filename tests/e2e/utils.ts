import { expect, type Page, type Locator } from '@playwright/test';

export async function gotoCompare(page: Page) {
  await page.goto('/g/padel/players/compare', { waitUntil: 'domcontentloaded' });

  const playerASelect = page.locator('select[name="playerA"]');
  const playerBSelect = page.locator('select[name="playerB"]');

  // Wait for selects to exist/visible
  await expect(playerASelect).toBeVisible({ timeout: 20000 });
  await expect(playerBSelect).toBeVisible({ timeout: 20000 });

  // Wait until options are populated (first option is usually placeholder)
  await expect
    .poll(async () => await playerASelect.locator('option').count(), { timeout: 20000 })
    .toBeGreaterThan(1);
  await expect
    .poll(async () => await playerBSelect.locator('option').count(), { timeout: 20000 })
    .toBeGreaterThan(1);

  return { playerASelect, playerBSelect };
}

export async function getOptionValue(select: Locator, index: number) {
  const val = await select.locator('option').nth(index).getAttribute('value');
  return val || '';
}
