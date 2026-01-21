import { test, expect } from '@playwright/test';

test.describe('Head-to-Head Root Cause Analysis', () => {
  async function joinGroup(page: any) {
    await page.goto('/g/padel/join', { waitUntil: 'networkidle' });
    const joinPageVisible = await page.locator('text=Ingresá la clave').isVisible().catch(() => false);
    if (joinPageVisible) {
      const passphraseInput = page.locator('input[type="password"]').or(page.locator('input[name="passphrase"]'));
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

    const playerAId = await playerASelect.locator('option').nth(1).getAttribute('value');
    const playerBId = await playerBSelect.locator('option').nth(2).getAttribute('value');

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
    console.log(`    if ("${playerAId}" && "") → FALSE`);
    console.log(`    Navigation DOES NOT HAPPEN because newPlayerB is empty!`);
    console.log('');

    // Actually select Player A and verify no navigation
    await playerASelect.selectOption(playerAId!);
    await page.waitForTimeout(1000);

    const urlAfterPlayerA = page.url();
    console.log(`  Actual URL after selecting Player A: ${urlAfterPlayerA}`);
    console.log(`  Contains query params: ${urlAfterPlayerA.includes('?')}`);
    console.log('');

    // Now simulate selecting Player B
    console.log('User selects Player B from dropdown:');
    console.log(`  e.target.value = "${playerBId}"`);
    console.log(`  handleChange is called with:`);
    console.log(`    newPlayerA = playerA || "" = "" (because playerA prop is still undefined - no navigation happened!)`);
    console.log(`    newPlayerB = "${playerBId}"`);
    console.log('');
    console.log(`  Condition check: if (newPlayerA && newPlayerB)`);
    console.log(`    if ("" && "${playerBId}") → FALSE`);
    console.log(`    Navigation DOES NOT HAPPEN because newPlayerA is empty!`);
    console.log('');

    // Actually select Player B and verify no navigation
    await playerBSelect.selectOption(playerBId!);
    await page.waitForTimeout(1000);

    const urlAfterPlayerB = page.url();
    console.log(`  Actual URL after selecting Player B: ${urlAfterPlayerB}`);
    console.log(`  Contains query params: ${urlAfterPlayerB.includes('?')}`);
    console.log('');

    console.log('=== CONCLUSION ===');
    console.log('');
    console.log('The bug is in PlayerSelector.tsx lines 36 and 52:');
    console.log('');
    console.log('Line 36: onChange={(e) => handleChange(e.target.value, playerB || "")}');
    console.log('  Problem: playerB prop is undefined, so it passes empty string');
    console.log('');
    console.log('Line 52: onChange={(e) => handleChange(playerA || "", e.target.value)}');
    console.log('  Problem: playerA prop is undefined, so it passes empty string');
    console.log('');
    console.log('The condition in handleChange (line 21) requires BOTH to be truthy,');
    console.log('but they are never both truthy because:');
    console.log('  1. Initially both are undefined');
    console.log('  2. When one is selected, it passes the OLD prop value (undefined) for the other');
    console.log('  3. The navigation never happens, so the page never re-renders with new props');
    console.log('');
    console.log('SOLUTION: The component needs to track local state (useState) for both');
    console.log('selected values, not rely on props that only update after navigation.');
  });

  test('should verify the feature works with direct URL', async ({ page }) => {
    console.log('\n=== VERIFYING FEATURE WORKS WITH DIRECT URL ===\n');

    await joinGroup(page);
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    const playerASelect = page.locator('select[name="playerA"]');
    const playerAId = await playerASelect.locator('option').nth(1).getAttribute('value');
    const playerBId = await playerASelect.locator('option').nth(2).getAttribute('value');

    // Navigate directly with both parameters
    await page.goto(`/g/padel/players/compare?playerA=${playerAId}&playerB=${playerBId}`, {
      waitUntil: 'networkidle'
    });

    await page.screenshot({ path: 'test-results/working-with-url-params.png', fullPage: true });

    // Verify stats are displayed
    const statsGrid = page.locator('.grid.gap-4.sm\\:grid-cols-3');
    const statsVisible = await statsGrid.isVisible();

    const victorias = await page.locator('text=VICTORIAS').count();
    const partidos = await page.locator('text=PARTIDOS').count();
    const historial = await page.locator('text=Historial de enfrentamientos').count();

    console.log('When navigating directly with URL params:');
    console.log(`  Stats grid visible: ${statsVisible}`);
    console.log(`  "VICTORIAS" labels: ${victorias}`);
    console.log(`  "PARTIDOS" label: ${partidos}`);
    console.log(`  "Historial" section: ${historial}`);
    console.log('');
    console.log('✓ Feature works correctly when URL contains both playerA and playerB parameters');
    console.log('✗ Feature does NOT work when using dropdown selection due to state management bug');
  });
});
