import { test, expect } from '@playwright/test';

test.describe('Head-to-Head URL Navigation Debug', () => {
  // Helper function to join the group
  async function joinGroup(page: any) {
    console.log('\nAuthenticating: Joining group with passphrase...');
    await page.goto('/g/padel/join', { waitUntil: 'networkidle' });

    const joinPageVisible = await page.locator('text=Ingresá la clave').isVisible().catch(() => false);

    if (joinPageVisible) {
      const passphraseInput = page.locator('input[type="password"]').or(page.locator('input[name="passphrase"]'));
      await passphraseInput.fill('padel');

      const joinButton = page.locator('button:has-text("Ingresar")');
      await joinButton.click();

      await page.waitForURL(/\/g\/padel/, { timeout: 10000 });
      console.log('Successfully joined group!');
    }
  }

  test('should check if URL parameters are being set correctly', async ({ page }) => {
    console.log('\n=== Testing URL Navigation with Query Parameters ===\n');

    // Authenticate
    await joinGroup(page);

    // Navigate to compare page
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });
    console.log('Initial URL:', page.url());

    // Get player IDs from the dropdowns
    const playerASelect = page.locator('select[name="playerA"]');
    const playerBSelect = page.locator('select[name="playerB"]');

    const playerAId = await playerASelect.locator('option').nth(1).getAttribute('value');
    const playerBId = await playerBSelect.locator('option').nth(2).getAttribute('value');

    console.log(`\nPlayer A ID: ${playerAId}`);
    console.log(`Player B ID: ${playerBId}`);

    // Manually navigate to URL with query params
    console.log('\n--- Testing manual navigation with query params ---');
    const manualUrl = `/g/padel/players/compare?playerA=${playerAId}&playerB=${playerBId}`;
    console.log(`Navigating to: ${manualUrl}`);

    await page.goto(manualUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('URL after manual navigation:', page.url());
    await page.screenshot({ path: 'test-results/manual-navigation.png', fullPage: true });

    // Check if debug box is visible now
    const debugBox = page.locator('div').filter({ hasText: /Debug: playerA=/ });
    const debugBoxVisible = await debugBox.isVisible().catch(() => false);
    console.log(`\nDebug box visible after manual navigation: ${debugBoxVisible}`);

    if (debugBoxVisible) {
      const debugText = await debugBox.textContent();
      console.log('Debug box content:', debugText);
    }

    // Check for stats display
    const statsGrid = page.locator('.grid.gap-4.sm\\:grid-cols-3');
    const statsGridVisible = await statsGrid.isVisible().catch(() => false);
    console.log(`Stats grid visible: ${statsGridVisible}`);

    // Check for any messages
    const noMatchesMsg = page.locator('text=nunca se enfrentaron como rivales');
    const noMatchesMsgVisible = await noMatchesMsg.isVisible().catch(() => false);
    console.log(`"No matches" message visible: ${noMatchesMsgVisible}`);

    const selectPlayersMsg = page.locator('text=Seleccioná dos jugadores diferentes');
    const selectPlayersMsgVisible = await selectPlayersMsg.isVisible().catch(() => false);
    console.log(`"Select players" message visible: ${selectPlayersMsgVisible}`);

    // Get page HTML to debug
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('\n--- Checking HTML content ---');
    console.log(`Debug box in HTML: ${bodyHTML.includes('Debug: playerA=')}`);
    console.log(`Stats section in HTML: ${bodyHTML.includes('Victorias')}`);
    console.log(`playerA in HTML: ${bodyHTML.includes(playerAId!)}`);
    console.log(`playerB in HTML: ${bodyHTML.includes(playerBId!)}`);

    // Now test dropdown selection
    console.log('\n--- Testing dropdown selection ---');
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });

    // Set up URL change listener
    let urlChanges: string[] = [];
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        urlChanges.push(frame.url());
        console.log(`URL changed to: ${frame.url()}`);
      }
    });

    console.log('Selecting Player A from dropdown...');
    await playerASelect.selectOption(playerAId!);
    await page.waitForTimeout(1000);
    console.log('Current URL after Player A:', page.url());

    console.log('Selecting Player B from dropdown...');
    await playerBSelect.selectOption(playerBId!);
    await page.waitForTimeout(2000);
    console.log('Current URL after Player B:', page.url());

    console.log('\nURL change history:', urlChanges);

    await page.screenshot({ path: 'test-results/dropdown-selection.png', fullPage: true });
  });

  test('should check server-side data fetching', async ({ page }) => {
    console.log('\n=== Testing Server-Side Data Fetching ===\n');

    // Authenticate
    await joinGroup(page);

    // Get player IDs
    await page.goto('/g/padel/players/compare', { waitUntil: 'networkidle' });
    const playerASelect = page.locator('select[name="playerA"]');
    const playerAId = await playerASelect.locator('option').nth(1).getAttribute('value');
    const playerBId = await playerASelect.locator('option').nth(2).getAttribute('value');

    console.log(`Testing with playerA=${playerAId} and playerB=${playerBId}`);

    // Monitor network requests
    const supabaseRequests: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('supabase')) {
        try {
          const body = await response.text().catch(() => '');
          supabaseRequests.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method(),
            bodyPreview: body.substring(0, 200),
          });
        } catch (e) {
          // ignore
        }
      }
    });

    // Navigate with query params
    await page.goto(`/g/padel/players/compare?playerA=${playerAId}&playerB=${playerBId}`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);

    console.log('\nSupabase requests made:');
    supabaseRequests.forEach((req, i) => {
      console.log(`\n${i + 1}. ${req.method} - Status ${req.status}`);
      console.log(`   URL: ${req.url}`);
      if (req.bodyPreview) {
        console.log(`   Response preview: ${req.bodyPreview}`);
      }
    });

    // Check page source
    const pageContent = await page.content();
    console.log('\n--- Page Source Analysis ---');
    console.log(`Page includes "getHeadToHeadStats": ${pageContent.includes('getHeadToHeadStats')}`);
    console.log(`Page includes player IDs: ${pageContent.includes(playerAId!)} / ${pageContent.includes(playerBId!)}`);
  });
});
