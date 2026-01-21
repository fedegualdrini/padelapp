import { test, expect } from '@playwright/test';

/**
 * Head-to-Head Comparison Feature Verification Test
 *
 * This test verifies that the head-to-head comparison feature works correctly
 * after the bug fix. It tests the complete user flow from navigation to data display.
 */

test.describe('Head-to-Head Comparison - Bug Fix Verification', () => {
  // Helper function to join the group
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

  test('should display head-to-head comparison after selecting two players', async ({ page }) => {
    console.log('\n=== Head-to-Head Comparison Feature Verification ===\n');

    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('Browser console error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.error('Page error:', error.message);
    });

    // Step 1: Authenticate
    console.log('Step 1: Authenticating with group...');
    await joinGroup(page);

    // Step 2: Navigate to compare page
    console.log('Step 2: Navigating to /g/padel/players/compare...');
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    // Verify we're on the correct page
    await expect(page.locator('h2:has-text("Head to Head")')).toBeVisible();
    console.log('✓ Compare page loaded successfully');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/comparison-01-initial.png', fullPage: true });

    // Step 3: Verify dropdowns are present and populated
    console.log('Step 3: Verifying player dropdowns...');
    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    await expect(playerASelect).toBeVisible();
    await expect(playerBSelect).toBeVisible();

    const playerAOptions = await playerASelect.locator('option').allTextContents();
    const playerBOptions = await playerBSelect.locator('option').allTextContents();

    console.log(`  - Player A dropdown: ${playerAOptions.length} options`);
    console.log(`  - Player B dropdown: ${playerBOptions.length} options`);

    // Ensure we have at least 3 options (default "Elegir jugador" + 2 players)
    expect(playerAOptions.length).toBeGreaterThanOrEqual(3);
    expect(playerBOptions.length).toBeGreaterThanOrEqual(3);
    console.log('✓ Dropdowns populated with players');

    // Step 4: Select first player (Player A)
    console.log('Step 4: Selecting Player A...');
    const firstPlayerValue = await playerASelect.locator('option').nth(1).getAttribute('value');
    const firstPlayerText = await playerASelect.locator('option').nth(1).textContent();
    console.log(`  - Selected: ${firstPlayerText?.trim()} (ID: ${firstPlayerValue})`);

    await playerASelect.selectOption(firstPlayerValue!);

    // Wait for any navigation or state changes
    await page.waitForTimeout(1000);

    // Verify URL contains playerA parameter
    const urlAfterPlayerA = page.url();
    console.log(`  - URL after Player A: ${urlAfterPlayerA}`);
    expect(urlAfterPlayerA).not.toContain('playerA=');
    console.log('✓ Player A selected (URL not updated yet - waiting for Player B)');

    await page.screenshot({ path: 'test-results/comparison-02-player-a-selected.png', fullPage: true });

    // Step 5: Select second player (Player B) - different from Player A
    console.log('Step 5: Selecting Player B (different player)...');
    const secondPlayerValue = await playerBSelect.locator('option').nth(2).getAttribute('value');
    const secondPlayerText = await playerBSelect.locator('option').nth(2).textContent();
    console.log(`  - Selected: ${secondPlayerText?.trim()} (ID: ${secondPlayerValue})`);

    await playerBSelect.selectOption(secondPlayerValue!);

    // Wait for navigation to complete
    await page.waitForTimeout(2000);

    // Step 6: Verify URL updates with query parameters
    console.log('Step 6: Verifying URL parameters...');
    await page.waitForURL(/playerA=.+&playerB=.+/, { timeout: 5000 });

    const finalUrl = page.url();
    console.log(`  - Final URL: ${finalUrl}`);

    expect(finalUrl).toContain('playerA=');
    expect(finalUrl).toContain('playerB=');
    console.log('✓ URL updated with query parameters');

    await page.screenshot({ path: 'test-results/comparison-03-both-players-selected.png', fullPage: true });

    // Step 7: Verify stats are displayed or appropriate message is shown
    console.log('Step 7: Verifying comparison data display...');

    // Check for three possible outcomes:
    // 1. Stats grid is displayed (players have faced each other)
    // 2. No matches message (players never faced each other)
    // 3. Same player message (shouldn't happen with our selections)

    const statsGrid = page.locator('.grid.gap-4.sm\\:grid-cols-3');
    const statsGridVisible = await statsGrid.isVisible().catch(() => false);

    const noMatchesMsg = page.locator('text=nunca se enfrentaron como rivales');
    const noMatchesMsgVisible = await noMatchesMsg.isVisible().catch(() => false);

    const samePlayerMsg = page.locator('text=Seleccioná dos jugadores diferentes');
    const samePlayerMsgVisible = await samePlayerMsg.isVisible().catch(() => false);

    if (statsGridVisible) {
      console.log('✓ Stats grid is displayed');

      // Verify all components of the stats grid
      // Player A stats card
      const playerACard = statsGrid.locator('div').first();
      await expect(playerACard).toBeVisible();
      await expect(playerACard.locator('text=Victorias')).toBeVisible();
      console.log('  - Player A stats card visible');

      // Total matches center card
      const totalMatchesCard = statsGrid.locator('div').nth(1);
      await expect(totalMatchesCard).toBeVisible();

      // Note: "PARTIDOS" is uppercase in the actual UI
      const totalMatches = await totalMatchesCard.locator('p.text-5xl').textContent();
      console.log(`  - Total matches: ${totalMatches?.trim()}`);
      expect(parseInt(totalMatches?.trim() || '0')).toBeGreaterThan(0);

      // Verify "PARTIDOS" text is present (case-insensitive)
      const matchesText = await totalMatchesCard.textContent();
      expect(matchesText?.toUpperCase()).toContain('PARTIDOS');

      // Player B stats card
      const playerBCard = statsGrid.locator('div').nth(2);
      await expect(playerBCard).toBeVisible();
      await expect(playerBCard.locator('text=Victorias')).toBeVisible();
      console.log('  - Player B stats card visible');

      // Verify match history section exists
      const matchHistory = page.locator('h3:has-text("Historial de enfrentamientos")');
      await expect(matchHistory).toBeVisible();
      console.log('  - Match history section visible');

      // Count match history items
      const matchCards = page.locator('a[href*="/matches/"]');
      const matchCount = await matchCards.count();
      console.log(`  - Match history items: ${matchCount}`);
      expect(matchCount).toBeGreaterThan(0);

    } else if (noMatchesMsgVisible) {
      console.log('✓ No matches message displayed (players never faced each other)');
      await expect(noMatchesMsg).toBeVisible();

    } else if (samePlayerMsgVisible) {
      console.log('⚠ Same player message displayed');
      // This shouldn't happen with our test, but if it does, fail the test
      throw new Error('Same player message displayed - test selected two different players');

    } else {
      throw new Error('No expected content displayed after player selection');
    }

    await page.screenshot({ path: 'test-results/comparison-04-final-working-state.png', fullPage: true });

    // Step 8: Verify no console errors
    console.log('Step 8: Checking for console errors...');
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:');
      consoleErrors.forEach(err => console.error(`  - ${err}`));
      throw new Error(`${consoleErrors.length} console errors detected during test`);
    }
    console.log('✓ No console errors detected');

    // Step 9: Test navigation back to players page
    console.log('Step 9: Testing back navigation...');
    const backLink = page.locator('a:has-text("Volver a jugadores")');
    await expect(backLink).toBeVisible();
    await backLink.click();

    await page.waitForURL(/\/g\/padel\/players$/, { timeout: 5000 });
    console.log('✓ Navigation back to players page successful');

    console.log('\n=== ✓ All verification tests passed! ===\n');
  });

  test('should handle edge case: selecting same player for both dropdowns', async ({ page }) => {
    console.log('\n=== Testing Edge Case: Same Player Selection ===\n');

    await joinGroup(page);
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    // Select same player for both
    const firstPlayerValue = await playerASelect.locator('option').nth(1).getAttribute('value');
    const firstPlayerName = await playerASelect.locator('option').nth(1).textContent();

    console.log(`Selecting same player for both dropdowns: ${firstPlayerName}`);

    await playerASelect.selectOption(firstPlayerValue!);
    await page.waitForTimeout(500);

    await playerBSelect.selectOption(firstPlayerValue!);
    await page.waitForTimeout(2000);

    // The URL should update with both parameters
    const currentUrl = page.url();
    console.log(`URL after same player selection: ${currentUrl}`);

    // When same player is selected, stats will be null, so message should appear
    // Check if the "select two different players" message or the card is visible
    const messageCard = page.locator('div:has-text("Seleccioná dos jugadores diferentes")');
    const isMessageVisible = await messageCard.isVisible().catch(() => false);

    if (isMessageVisible) {
      console.log('✓ Same player message displayed correctly');
    } else {
      // If no message, check that no stats grid is displayed either
      const statsGrid = page.locator('.grid.gap-4.sm\\:grid-cols-3');
      const statsVisible = await statsGrid.isVisible().catch(() => false);
      expect(statsVisible).toBe(false);
      console.log('✓ Same player selection: no stats displayed (correct behavior)');
    }

    await page.screenshot({ path: 'test-results/comparison-05-same-player-edge-case.png', fullPage: true });
  });

  test('should handle case: players who never faced each other', async ({ page }) => {
    console.log('\n=== Testing Case: Players With No Head-to-Head Matches ===\n');

    await joinGroup(page);
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    // Get all player options
    const options = await playerBSelect.locator('option').allTextContents();
    console.log(`Available players: ${options.length - 1}`); // -1 for default option

    // Select two different players
    const player1Value = await playerASelect.locator('option').nth(1).getAttribute('value');
    const player2Value = await playerBSelect.locator('option').nth(2).getAttribute('value');

    await playerASelect.selectOption(player1Value!);
    await page.waitForTimeout(500);
    await playerBSelect.selectOption(player2Value!);

    // Wait for page to update
    await page.waitForTimeout(2000);
    await page.waitForURL(/playerA=.+&playerB=.+/, { timeout: 5000 });

    // Check if either stats are displayed OR no matches message
    const statsGrid = page.locator('.grid.gap-4.sm\\:grid-cols-3');
    const statsGridVisible = await statsGrid.isVisible().catch(() => false);

    const noMatchesMsg = page.locator('text=nunca se enfrentaron como rivales');
    const noMatchesMsgVisible = await noMatchesMsg.isVisible().catch(() => false);

    // At least one of these should be true
    expect(statsGridVisible || noMatchesMsgVisible).toBeTruthy();

    if (statsGridVisible) {
      console.log('✓ Players have head-to-head history - stats displayed');
    } else if (noMatchesMsgVisible) {
      console.log('✓ No head-to-head history - appropriate message displayed');
    }

    await page.screenshot({ path: 'test-results/comparison-06-no-matches-case.png', fullPage: true });
  });
});
