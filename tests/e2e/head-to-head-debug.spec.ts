import { test, type Page } from '@playwright/test';

type SupabaseRequestLog = {
  url: string;
  status: number;
  method: string;
  bodyPreview: string;
};

test.describe('Head-to-Head URL Navigation Debug', () => {
  // Helper function to join the group
  async function joinGroup(page: Page) {
    console.log('\nAuthenticating: Joining group with passphrase...');
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

    const playerAId = await playerASelect
      .locator('option')
      .nth(1)
      .getAttribute('value');
    const playerBId = await playerBSelect
      .locator('option')
      .nth(2)
      .getAttribute('value');

    console.log(`\nPlayer A ID: ${playerAId}`);
    console.log(`Player B ID: ${playerBId}`);

    // Manually navigate to URL with query params
    console.log('\n--- Testing manual navigation with query params ---');
    const manualUrl = `/g/padel/players/compare?playerA=${playerAId}&playerB=${playerBId}`;
    console.log(`Navigating to: ${manualUrl}`);

    // Monitor network requests
    const supabaseRequests: SupabaseRequestLog[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('supabase')) {
        const body = await response.text().catch(() => '');
        supabaseRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
          bodyPreview: body.substring(0, 200),
        });
      }
    });

    await page.goto(manualUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('URL after manual navigation:', page.url());

    // Check if debug box is visible now
    const debugBox = page.locator('div').filter({ hasText: /Debug: playerA=/ });
    const debugBoxVisible = await debugBox.isVisible().catch(() => false);
    console.log(`\nDebug box visible after manual navigation: ${debugBoxVisible}`);

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
    console.log(
      `Page includes "getHeadToHeadStats": ${pageContent.includes('getHeadToHeadStats')}`
    );

    // Debug-style test, just ensure we loaded something.
    if (playerAId && playerBId) {
      console.log(
        `Page includes player IDs: ${pageContent.includes(playerAId)} / ${pageContent.includes(playerBId)}`
      );
    }
  });
});
