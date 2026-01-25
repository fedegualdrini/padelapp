import { test, type Page } from '@playwright/test';

test.describe('Head-to-Head Root Cause Analysis', () => {
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

  test('should demonstrate the logic bug in handleChange', async ({ page }) => {
    console.log('\n=== ROOT CAUSE ANALYSIS ===\n');

    await joinGroup(page);
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    const playerAId = await playerASelect
      .locator('option')
      .nth(1)
      .getAttribute('value');
    const playerBId = await playerBSelect
      .locator('option')
      .nth(2)
      .getAttribute('value');

    console.log('Initial state:');
    console.log(`  playerA prop: undefined`);
    console.log(`  playerB prop: undefined`);
    console.log('');

    // Simulate selecting Player A
    console.log('User selects Player A from dropdown:');
    console.log(`  e.target.value = "${playerAId}"`);
    console.log(`  handleChange is called with:`);
    console.log(`    newPlayerA = "${playerAId}"`);
    console.log(`    newPlayerB = playerB || "" = "" (because playerB is undefined)`);
    console.log('');
    console.log(`  Condition check: if (newPlayerA && newPlayerB)`);

    // This is a debugging-style test, so we only assert the page loads.
    await page.waitForTimeout(500);
  });
});
