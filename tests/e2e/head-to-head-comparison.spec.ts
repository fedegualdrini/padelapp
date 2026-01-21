import { test, expect } from '@playwright/test';

test.describe('Head-to-Head Comparison Feature', () => {
  // Helper function to join the group
  async function joinGroup(page: any) {
    console.log('\nAuthenticating: Joining group with passphrase...');
    await page.goto('/g/padel/join', { waitUntil: 'networkidle' });

    // Check if we're on the join page
    const joinPageVisible = await page.locator('text=Ingresá la clave').isVisible().catch(() => false);

    if (joinPageVisible) {
      // Enter passphrase
      const passphraseInput = page.locator('input[type="password"]').or(page.locator('input[name="passphrase"]'));
      await passphraseInput.fill('padel');

      // Click join button
      const joinButton = page.locator('button:has-text("Ingresar")');
      await joinButton.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/g\/padel/, { timeout: 10000 });
      console.log('Successfully joined group!');
    } else {
      console.log('Already authenticated or redirected');
    }
  }

  test('should investigate why comparison data is not showing', async ({ page }) => {
    console.log('\n=== Starting Head-to-Head Comparison Investigation ===\n');

    // Set up console listener to capture all console messages
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];

    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log('Browser console:', text);
    });

    page.on('pageerror', error => {
      const errorText = `Page error: ${error.message}`;
      errorMessages.push(errorText);
      console.error(errorText);
    });

    // Monitor network requests
    const networkRequests: Array<{ url: string; method: string; status?: number }> = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
      });
    });

    page.on('response', async response => {
      const request = networkRequests.find(r => r.url === response.url());
      if (request) {
        request.status = response.status();
      }

      // Log Supabase API calls
      if (response.url().includes('supabase')) {
        console.log(`Supabase API: ${response.request().method()} ${response.url()} - Status: ${response.status()}`);
      }
    });

    // Step 0: Authenticate by joining the group
    await joinGroup(page);

    // Step 1: Navigate to the compare page
    console.log('\nStep 1: Navigating to compare page...');
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });
    console.log('Screenshot saved: 01-initial-page.png');

    // Check page title and basic elements
    const pageTitle = await page.locator('h2').first().textContent();
    console.log(`Page title: ${pageTitle}`);

    // Step 2: Check if dropdowns are present and populated
    console.log('\nStep 2: Checking dropdowns...');
    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    await expect(playerASelect).toBeVisible();
    await expect(playerBSelect).toBeVisible();

    const playerAOptions = await playerASelect.locator('option').allTextContents();
    const playerBOptions = await playerBSelect.locator('option').allTextContents();

    console.log(`Player A dropdown options (${playerAOptions.length}):`, playerAOptions);
    console.log(`Player B dropdown options (${playerBOptions.length}):`, playerBOptions);

    // Take screenshot of dropdowns
    await page.screenshot({ path: 'test-results/02-dropdowns-visible.png', fullPage: true });

    if (playerAOptions.length <= 1) {
      console.error('ERROR: No players found in dropdowns!');
      return;
    }

    // Step 3: Select first player (skip "Elegir jugador" option)
    console.log('\nStep 3: Selecting Player A...');
    const firstPlayerValue = await playerASelect.locator('option').nth(1).getAttribute('value');
    const firstPlayerText = await playerASelect.locator('option').nth(1).textContent();
    console.log(`Selecting Player A: ${firstPlayerText} (ID: ${firstPlayerValue})`);

    await playerASelect.selectOption(firstPlayerValue!);

    // Wait for navigation or state change
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/03-after-player-a-selected.png', fullPage: true });

    // Check URL after Player A selection
    const urlAfterPlayerA = page.url();
    console.log(`URL after Player A selection: ${urlAfterPlayerA}`);

    // Step 4: Select second player
    console.log('\nStep 4: Selecting Player B...');
    const secondPlayerValue = await playerBSelect.locator('option').nth(2).getAttribute('value');
    const secondPlayerText = await playerBSelect.locator('option').nth(2).textContent();
    console.log(`Selecting Player B: ${secondPlayerText} (ID: ${secondPlayerValue})`);

    await playerBSelect.selectOption(secondPlayerValue!);

    // Wait for navigation or state change
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/04-after-player-b-selected.png', fullPage: true });

    // Check URL after Player B selection
    const urlAfterPlayerB = page.url();
    console.log(`URL after Player B selection: ${urlAfterPlayerB}`);

    // Step 5: Check if debug box is visible
    console.log('\nStep 5: Checking for debug box...');
    const debugBox = page.locator('div').filter({ hasText: /Debug: playerA=/ });
    const debugBoxVisible = await debugBox.isVisible().catch(() => false);

    if (debugBoxVisible) {
      const debugText = await debugBox.textContent();
      console.log('Debug box content:', debugText);

      // Extract player IDs and stats from debug text
      const playerAMatch = debugText?.match(/playerA=([a-f0-9-]+)/);
      const playerBMatch = debugText?.match(/playerB=([a-f0-9-]+)/);
      const statsMatch = debugText?.match(/Stats: (.+)/s);

      console.log('Player A ID from URL:', playerAMatch?.[1]);
      console.log('Player B ID from URL:', playerBMatch?.[1]);
      console.log('Stats data:', statsMatch?.[1]);
    } else {
      console.log('Debug box NOT visible');
    }

    // Step 6: Check for stats display or error messages
    console.log('\nStep 6: Checking for comparison data...');

    // Check for "no matches" message
    const noMatchesMsg = page.locator('text=nunca se enfrentaron como rivales');
    const noMatchesMsgVisible = await noMatchesMsg.isVisible().catch(() => false);

    if (noMatchesMsgVisible) {
      console.log('Message: Players have never faced each other');
    }

    // Check for "select two different players" message
    const selectPlayersMsg = page.locator('text=Seleccioná dos jugadores diferentes');
    const selectPlayersMsgVisible = await selectPlayersMsg.isVisible().catch(() => false);

    if (selectPlayersMsgVisible) {
      console.log('Message: Select two different players to view history');
    }

    // Check for stats display
    const statsGrid = page.locator('.grid.gap-4.sm\\:grid-cols-3');
    const statsGridVisible = await statsGrid.isVisible().catch(() => false);

    if (statsGridVisible) {
      console.log('Stats grid IS visible!');
      const totalMatches = await statsGrid.locator('text=Partidos').locator('..').locator('p').first().textContent();
      console.log('Total matches displayed:', totalMatches);
    } else {
      console.log('Stats grid NOT visible');
    }

    await page.screenshot({ path: 'test-results/05-final-state.png', fullPage: true });

    // Step 7: Summary of findings
    console.log('\n=== INVESTIGATION SUMMARY ===\n');
    console.log('URL Navigation:');
    console.log(`  - Initial: /g/padel/players/compare`);
    console.log(`  - After Player A: ${urlAfterPlayerA}`);
    console.log(`  - After Player B: ${urlAfterPlayerB}`);

    console.log('\nPage State:');
    console.log(`  - Debug box visible: ${debugBoxVisible}`);
    console.log(`  - Stats grid visible: ${statsGridVisible}`);
    console.log(`  - No matches message: ${noMatchesMsgVisible}`);
    console.log(`  - Select players message: ${selectPlayersMsgVisible}`);

    console.log('\nConsole Messages:', consoleMessages.length);
    consoleMessages.forEach(msg => console.log('  ', msg));

    console.log('\nError Messages:', errorMessages.length);
    errorMessages.forEach(msg => console.log('  ', msg));

    console.log('\nNetwork Requests to Supabase:');
    const supabaseRequests = networkRequests.filter(r => r.url.includes('supabase'));
    supabaseRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url} - Status: ${req.status || 'pending'}`);
    });

    // Step 8: Try to get HTML of the page for further analysis
    console.log('\n=== PAGE HTML STRUCTURE ===\n');
    const bodyHTML = await page.locator('body').innerHTML();

    // Check if debug box exists in HTML
    if (bodyHTML.includes('Debug: playerA=')) {
      console.log('Debug box FOUND in HTML');
    } else {
      console.log('Debug box NOT FOUND in HTML');
    }

    // Check if stats section exists in HTML
    if (bodyHTML.includes('Victorias')) {
      console.log('Stats section FOUND in HTML');
    } else {
      console.log('Stats section NOT FOUND in HTML');
    }

    console.log('\n=== Test Complete ===\n');
  });

  test('should verify database has match data', async ({ page }) => {
    console.log('\n=== Verifying Database Connectivity ===\n');

    // Authenticate first
    await joinGroup(page);

    // Navigate to players page first to verify basic functionality
    await page.goto('/g/padel/players', { waitUntil: 'networkidle' });

    const playersVisible = await page.locator('text=Jugadores').isVisible().catch(() => false);
    console.log(`Players page loaded: ${playersVisible}`);

    if (playersVisible) {
      const playerCards = page.locator('div').filter({ hasText: /ELO/ });
      const playerCount = await playerCards.count();
      console.log(`Number of players found: ${playerCount}`);
    }

    // Navigate to matches page
    await page.goto('/g/padel/matches', { waitUntil: 'networkidle' });

    const matchesVisible = await page.locator('text=Partidos').isVisible().catch(() => false);
    console.log(`Matches page loaded: ${matchesVisible}`);

    if (matchesVisible) {
      const matchCards = page.locator('a[href*="/matches/"]');
      const matchCount = await matchCards.count();
      console.log(`Number of matches found: ${matchCount}`);

      if (matchCount === 0) {
        console.log('WARNING: No matches found in the database. This could explain why head-to-head shows no data.');
      }
    }

    await page.screenshot({ path: 'test-results/06-matches-page.png', fullPage: true });
  });
});
