import { chromium, type FullConfig, expect } from '@playwright/test';

/**
 * Logs into / joins the default group once and saves storageState.
 * This makes the suite faster and removes "sometimes the session cookie doesn't stick" flakes.
 */
export default async function globalSetup(config: FullConfig) {
  const project = config.projects[0];
  const baseURL = project.use.baseURL as string | undefined;
  if (!baseURL) throw new Error('Missing use.baseURL in playwright config');

  const browser = await chromium.launch(project.use.launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to join page and join group if needed.
  await page.goto(`${baseURL}/g/padel/join`, { waitUntil: 'domcontentloaded' });

  const onJoin = await page.locator('text=Ingresá la clave').isVisible().catch(() => false);
  if (onJoin) {
    const passphraseInput = page
      .locator('input[type="password"]')
      .or(page.locator('input[name="passphrase"]'))
      .or(page.locator('input[placeholder*="clave"]'));

    await passphraseInput.waitFor({ state: 'visible', timeout: 20000 });
    await passphraseInput.fill('padel');

    const joinButton = page.getByRole('button', { name: /ingresar|join/i });
    await joinButton.click();

    // Successful join should redirect away from /join.
    await page.waitForURL((url) => !url.pathname.includes('/join'), { timeout: 30000 });
  }

  // Sanity: ranking page should be reachable.
  await page.goto(`${baseURL}/g/padel/ranking`, { waitUntil: 'domcontentloaded' });

  // If we're redirected back to /join, try joining once more.
  if (page.url().includes('/join')) {
    const passphraseInput = page
      .locator('input[type="password"]')
      .or(page.locator('input[name="passphrase"]'))
      .or(page.locator('input[placeholder*="clave"]'));

    await passphraseInput.waitFor({ state: 'visible', timeout: 20000 });
    await passphraseInput.fill('padel');
    await page.getByRole('button', { name: /ingresar|join/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/join'), { timeout: 30000 });

    await page.goto(`${baseURL}/g/padel/ranking`, { waitUntil: 'domcontentloaded' });
  }

  try {
    await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible({
      timeout: 30000,
    });
  } catch (err) {
    await page.screenshot({ path: 'tests/e2e/.auth/global-setup-failed.png', fullPage: true });
    throw err;
  }

  await context.storageState({ path: 'tests/e2e/.auth/state.json' });
  await browser.close();
}
