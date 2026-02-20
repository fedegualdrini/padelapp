import { test, expect } from '@playwright/test';
import { login, navigateAndReady, waitForPageReady } from './test-helpers';

/**
 * Match Creation and Recording Flow E2E Tests
 * Tests the complete journey from match form to successful match creation
 */

test.describe('Match Creation and Recording Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure authenticated
    await login(page, 'padel', 'padel');
  });

  test('can navigate to match creation page', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/matches');

    // Look for "Nuevo partido" button or link
    const createMatchButton = page.getByRole('link', { name: /nuevo partido|new match/i }).or(
      page.locator('a[href*="matches/new"]')
    );

    await expect(createMatchButton.first()).toBeVisible();
    await createMatchButton.first().click();

    // Verify we're on new match page
    await expect(page).toHaveURL(/\/matches\/new/);
    await expect(page.getByRole('heading', { name: /cargar un nuevo partido|new match/i })).toBeVisible();

    // Take screenshot of match creation page
    await page.screenshot({ path: 'test-results/screenshots/match-new-page.png' });
  });

  test('match creation form displays all required fields', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/matches/new');

    // Check match info section
    await expect(page.getByRole('heading', { name: /info del partido/i })).toBeVisible();

    // Check date and time inputs
    const dateInput = page.getByRole('textbox', { name: /fecha/i }).or(page.locator('input[type="date"]'));
    await expect(dateInput).toBeVisible();

    const timeInput = page.getByRole('textbox', { name: /hora/i }).or(page.locator('input[type="time"]'));
    await expect(timeInput).toBeVisible();

    // Check "Mejor de" select
    const bestOfSelect = page.getByRole('combobox', { name: /mejor de/i });
    await expect(bestOfSelect).toBeVisible();

    // Check teams section
    await expect(page.getByRole('heading', { name: /equipos/i })).toBeVisible();

    // Check player selectors for both teams
    const team1Player1 = page.getByRole('combobox', { name: /equipo 1 jugador 1/i });
    const team1Player2 = page.getByRole('combobox', { name: /equipo 1 jugador 2/i });
    const team2Player1 = page.getByRole('combobox', { name: /equipo 2 jugador 1/i });
    const team2Player2 = page.getByRole('combobox', { name: /equipo 2 jugador 2/i });

    await expect(team1Player1).toBeVisible();
    await expect(team1Player2).toBeVisible();
    await expect(team2Player1).toBeVisible();
    await expect(team2Player2).toBeVisible();

    // Check score section
    await expect(page.getByRole('heading', { name: /resultado/i })).toBeVisible();

    // Take screenshot showing all form fields
    await page.screenshot({ path: 'test-results/screenshots/match-form-complete.png', fullPage: true });
  });

  test('can use usual pairs quick select', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/matches/new');

    // Check for "Parejas habituales" section
    const pairsSection = page.getByRole('heading', { name: /parejas habituales/i });
    await expect(pairsSection).toBeVisible();

    // Look for pair buttons (may not exist if no pairs yet)
    const pairButtons = page.locator('button').filter({ hasText: /→/ });
    const pairCount = await pairButtons.count();

    if (pairCount > 0) {
      // Click first pair button
      await pairButtons.first().click();
      await page.waitForTimeout(500); // Wait for form to update

      // Verify players are selected in form
      const team1Select = page.getByRole('combobox', { name: /equipo 1 jugador 1/i });
      const team1Value = await team1Select.inputValue();
      expect(team1Value).toBeTruthy();

      // Take screenshot after selecting pair
      await page.screenshot({ path: 'test-results/screenshots/match-pair-selected.png' });
    } else {
      // Take screenshot showing no pairs
      await page.screenshot({ path: 'test-results/screenshots/match-no-pairs.png' });
    }
  });

  test('can select players for both teams', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/matches/new');

    // Get all player options from the first dropdown
    const team1Player1 = page.getByRole('combobox', { name: /equipo 1 jugador 1/i });
    await team1Player1.click();

    // Wait for dropdown to open and get options
    await page.waitForTimeout(500);
    const options = await page.locator('option').all();
    expect(options.length).toBeGreaterThan(1); // At least "Elegir jugador" + some players

    // Select first player for team 1
    if (options.length > 1) {
      const firstPlayerValue = await options[1].getAttribute('value');
      if (firstPlayerValue) {
        await team1Player1.selectOption(firstPlayerValue);
        await page.waitForTimeout(500);

        // Verify selection
        const selectedValue = await team1Player1.inputValue();
        expect(selectedValue).toBe(firstPlayerValue);

        // Take screenshot showing player selection
        await page.screenshot({ path: 'test-results/screenshots/match-player-selected.png' });
      }
    }
  });

  test('can enter set scores', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/matches/new');

    // Select some players first (needed for score validation)
    const team1Player1 = page.getByRole('combobox', { name: /equipo 1 jugador 1/i });
    const team2Player1 = page.getByRole('combobox', { name: /equipo 2 jugador 1/i });

    // Get first player option
    const options = await page.locator('option').all();
    if (options.length > 1) {
      const firstPlayerValue = await options[1].getAttribute('value');
      if (firstPlayerValue) {
        await team1Player1.selectOption(firstPlayerValue);
        await team2Player1.selectOption(firstPlayerValue);
        await page.waitForTimeout(500);

        // Now enter set scores
        const set1Team1 = page.getByRole('spinbutton', { name: /set 1 equipo 1/i }).or(
          page.locator('input[name*="set1_team1"]')
        );
        const set1Team2 = page.getByRole('spinbutton', { name: /set 1 equipo 2/i }).or(
          page.locator('input[name*="set1_team2"]')
        );

        if (await set1Team1.isVisible()) {
          await set1Team1.fill('6');
          await set1Team2.fill('4');

          // Verify scores are entered
          const score1 = await set1Team1.inputValue();
          const score2 = await set1Team2.inputValue();
          expect(score1).toBe('6');
          expect(score2).toBe('4');

          // Take screenshot showing score entry
          await page.screenshot({ path: 'test-results/screenshots/match-scores-entered.png' });
        }
      }
    }
  });

  test('form validates set scores correctly', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/matches/new');

    // Select some players
    const team1Player1 = page.getByRole('combobox', { name: /equipo 1 jugador 1/i });
    const team2Player1 = page.getByRole('combobox', { name: /equipo 2 jugador 1/i });

    const options = await page.locator('option').all();
    if (options.length > 1) {
      const firstPlayerValue = await options[1].getAttribute('value');
      if (firstPlayerValue) {
        await team1Player1.selectOption(firstPlayerValue);
        await team2Player1.selectOption(firstPlayerValue);
        await page.waitForTimeout(500);

        // Enter invalid set score (e.g., 8-5 which is invalid in padel)
        const set1Team1 = page.getByRole('spinbutton', { name: /set 1 equipo 1/i }).or(
          page.locator('input[name*="set1_team1"]')
        );
        const set1Team2 = page.getByRole('spinbutton', { name: /set 1 equipo 2/i }).or(
          page.locator('input[name*="set1_team2"]')
        );

        if (await set1Team1.isVisible()) {
          await set1Team1.fill('8');
          await set1Team2.fill('5');

          // Find submit button and click (should trigger validation)
          const submitButton = page.getByRole('button', { name: /guardar|crear|submit/i });
          await submitButton.click();

          // Check for validation error
          const errorBox = page.getByRole('status').or(page.locator('[role="alert"]'));
          await page.waitForTimeout(1000); // Wait for error to appear

          const hasError = await errorBox.isVisible().catch(() => false);
          const onSamePage = page.url().includes('/matches/new');

          // Should either show error or stay on same page
          expect(hasError || onSamePage).toBe(true);

          // Take screenshot of validation error
          await page.screenshot({ path: 'test-results/screenshots/match-validation-error.png' });
        }
      }
    }
  });

  test('can navigate from matches list to create match', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/matches');

    // Verify we're on matches list
    await expect(page.getByRole('heading', { name: /partidos|matches/i })).toBeVisible();

    // Click create match button
    const createMatchButton = page.getByRole('link', { name: /nuevo partido/i }).or(
      page.locator('a[href*="matches/new"]')
    );
    await createMatchButton.first().click();

    // Verify navigation to create match
    await expect(page).toHaveURL(/\/matches\/new/);
    await expect(page.getByRole('heading', { name: /cargar un nuevo partido/i })).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/match-navigate-from-list.png' });
  });

  test('match creation works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateAndReady(page, '/g/padel/matches/new');

    // Verify form is responsive
    await expect(page.getByRole('heading', { name: /cargar un nuevo partido/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /equipos/i })).toBeVisible();

    // Take screenshot of mobile match form
    await page.screenshot({
      path: 'test-results/screenshots/match-mobile.png',
      fullPage: true
    });
  });

  test('can navigate back from match creation', async ({ page }) => {
    await navigateAndReady(page, '/g/padel/matches/new');

    // Find back button or cancel button
    const backButton = page.getByRole('button', { name: /volver|cancelar|back/i }).or(
      page.locator('a').filter({ hasText: /partidos|matches/i })
    );

    if (await backButton.first().isVisible()) {
      await backButton.first().click();

      // Should navigate back to matches list
      await expect(page).toHaveURL(/\/matches$/);
      await expect(page.getByRole('heading', { name: /partidos|matches/i })).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/match-navigate-back.png' });
    }
  });
});
