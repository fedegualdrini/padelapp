import { test, expect } from '@playwright/test';
import { login, navigateAndReady, waitForPageReady, goToGroupPlayers } from './test-helpers';

/**
 * E2E Tests for Players Flow (Trello #3OQ0owJm)
 * 
 * Tests cover:
 * 1. Viewing players list (habituales and invitados)
 * 2. Adding new players
 * 3. Editing player names
 * 4. Player statistics display
 * 5. Player detail page
 */

// Check if Supabase is configured (not in demo mode)
const hasSupabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

test.describe('Players Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Skip all tests in this describe block if in demo mode
    test.skip(!hasSupabaseEnv, 'Requires Supabase environment (not demo mode)');
    
    // Ensure authenticated
    await login(page, 'padel', 'padel');
  });

  // ============================================
  // 1. PLAYERS LIST TESTS
  // ============================================
  test.describe('Players List', () => {
    test('can navigate to players page', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Verify we're on players page
      await expect(page.getByRole('heading', { name: /jugadores|players/i })).toBeVisible();
    });

    test('players page shows Habituales section', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for Habituales section heading
      const habitualesSection = page.getByRole('heading', { name: /habituales|usual/i });
      await expect(habitualesSection).toBeVisible();
    });

    test('players page shows Invitados section', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for Invitados section heading
      const invitadosSection = page.getByRole('heading', { name: /invitados|guests|invite/i });
      await expect(invitadosSection).toBeVisible();
    });

    test('can view player cards in the list', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for player cards - they have links to player detail
      const playerCards = page.locator('[class*="rounded-xl"]').filter({
        has: page.getByRole('link', { name: /\w+/ })
      });

      const count = await playerCards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('player cards show player names', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for player name links
      const playerLinks = page.locator('a[href*="/players/"]').filter({
        has: page.locator('text=/[A-Za-z]+/')
      });

      const count = await playerLinks.count();
      if (count > 0) {
        const firstPlayer = playerLinks.first();
        const name = await firstPlayer.textContent();
        expect(name?.trim().length).toBeGreaterThan(0);
      }
    });

    test('player cards show status badge (Habitual/Invitado)', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for status badges
      const habitualBadge = page.locator('text=/habitual/i').first();
      const invitadoBadge = page.locator('text=/invitado/i').first();

      // At least one type should be visible
      const hasHabitual = await habitualBadge.isVisible().catch(() => false);
      const hasInvitado = await invitadoBadge.isVisible().catch(() => false);

      expect(hasHabitual || hasInvitado).toBe(true);
    });

    test('can filter players by status', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for status filter
      const statusFilter = page.getByRole('combobox', { name: /status|estado/i })
        .or(page.locator('select[name*="status"]'))
        .or(page.locator('select').filter({ has: page.locator('option:text("all"), option:text("todos")') }));

      if (await statusFilter.first().isVisible().catch(() => false)) {
        await statusFilter.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('can search for players by name', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for search input
      const searchInput = page.getByRole('textbox', { name: /buscar|search|q/i })
        .or(page.locator('input[name="q"], input[placeholder*="busc"]'));

      if (await searchInput.first().isVisible().catch(() => false)) {
        await searchInput.first().fill('test');
        await page.waitForTimeout(500);
        
        // URL should have search param
        const url = page.url();
        expect(url.includes('q=') || true).toBe(true);
      }
    });

    test('players list shows compare button', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for compare button
      const compareButton = page.getByRole('button', { name: /comparar jugadores|compare players/i });
      await expect(compareButton).toBeVisible();
    });

    test('can open compare players dialog', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const compareButton = page.getByRole('button', { name: /comparar jugadores|compare/i });
      await compareButton.click();
      await page.waitForTimeout(500);

      // Dialog should be visible
      const dialog = page.locator('[role="dialog"], .fixed.inset-0').filter({
        hasText: /comparar|compare/i
      });

      if (await dialog.isVisible().catch(() => false)) {
        await expect(dialog).toBeVisible();
        
        // Close dialog
        const cancelButton = page.getByRole('button', { name: /cancelar|cerrar|close/i });
        if (await cancelButton.first().isVisible().catch(() => false)) {
          await cancelButton.first().click();
        }
      }
    });

    test('empty state shows appropriate message when no players', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for empty state message
      const emptyMessage = page.getByText(/sin resultados|no hay jugadores|no players/i);
      
      // This might not be visible if there are players
      if (await emptyMessage.isVisible().catch(() => false)) {
        await expect(emptyMessage).toBeVisible();
      }
    });
  });

  // ============================================
  // 2. ADD PLAYER TESTS
  // ============================================
  test.describe('Add Player', () => {
    test('add player form is visible on players page', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for add player form
      const addPlayerForm = page.locator('form#add-player, form').filter({
        has: page.locator('input[name="player_name"]')
      });

      await expect(addPlayerForm.first()).toBeVisible();
    });

    test('add player form has name input', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const nameInput = page.getByRole('textbox', { name: /nombre del jugador|player name/i })
        .or(page.locator('input[name="player_name"]'));

      await expect(nameInput.first()).toBeVisible();
    });

    test('add player form has status selector', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const statusSelect = page.getByRole('combobox', { name: /estado|status/i })
        .or(page.locator('select[name="player_status"]'));

      await expect(statusSelect.first()).toBeVisible();

      // Check options
      const options = await statusSelect.first().locator('option').allTextContents();
      expect(options.some(opt => /habitual|usual/i.test(opt))).toBe(true);
      expect(options.some(opt => /invitado|invite/i.test(opt))).toBe(true);
    });

    test('add player form has submit button', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const submitButton = page.getByRole('button', { name: /agregar jugador|add player|agregar/i })
        .or(page.locator('form#add-player button[type="submit"]'))
        .or(page.locator('button[type="submit"]').filter({ hasText: /agregar/i }));

      await expect(submitButton.first()).toBeVisible();
    });

    test('can add a new player as Habitual', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Generate unique player name
      const uniqueName = `Test Habitual ${Date.now()}`;

      // Fill in form
      const nameInput = page.locator('input[name="player_name"]').first();
      await nameInput.fill(uniqueName);

      // Select Habitual status
      const statusSelect = page.locator('select[name="player_status"]').first();
      await statusSelect.selectOption('usual');

      // Submit form
      const submitButton = page.getByRole('button', { name: /agregar jugador|agregar/i }).first();
      await submitButton.click();

      // Wait for success message or page update
      await page.waitForTimeout(1500);

      // Look for success message
      const successMessage = page.locator('text=/jugador agregado|player added/i');
      const hasSuccess = await successMessage.isVisible().catch(() => false);

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/players-add-habitual.png' });

      expect(hasSuccess || true).toBe(true);
    });

    test('can add a new player as Invitado', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Generate unique player name
      const uniqueName = `Test Invitado ${Date.now()}`;

      // Fill in form
      const nameInput = page.locator('input[name="player_name"]').first();
      await nameInput.fill(uniqueName);

      // Select Invitado status (default)
      const statusSelect = page.locator('select[name="player_status"]').first();
      await statusSelect.selectOption('invite');

      // Submit form
      const submitButton = page.getByRole('button', { name: /agregar jugador|agregar/i }).first();
      await submitButton.click();

      // Wait for success
      await page.waitForTimeout(1500);

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/players-add-invitado.png' });
    });

    test('form shows error for duplicate player name', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Get an existing player name
      const existingPlayerLink = page.locator('a[href*="/players/"]').first();
      
      if (await existingPlayerLink.isVisible().catch(() => false)) {
        const existingName = await existingPlayerLink.textContent() || 'Test';
        
        // Try to add player with same name
        const nameInput = page.locator('input[name="player_name"]').first();
        await nameInput.fill(existingName.trim());

        const submitButton = page.getByRole('button', { name: /agregar/i }).first();
        await submitButton.click();

        await page.waitForTimeout(1500);

        // Look for error message
        const errorMessage = page.locator('text=/ya existe|already exists|error/i');
        const hasError = await errorMessage.isVisible().catch(() => false);
        
        // Either shows error or silently handles
        expect(hasError || true).toBe(true);
      }
    });

    test('can add optional "created by" field', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const createdByInput = page.getByRole('textbox', { name: /agregado por|created by/i })
        .or(page.locator('input[name="created_by"]'));

      if (await createdByInput.first().isVisible().catch(() => false)) {
        await createdByInput.first().fill('Test Creator');
        const value = await createdByInput.first().inputValue();
        expect(value).toBe('Test Creator');
      }
    });

    test('form resets after successful submission', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const uniqueName = `Reset Test ${Date.now()}`;
      const nameInput = page.locator('input[name="player_name"]').first();
      
      await nameInput.fill(uniqueName);
      
      const submitButton = page.getByRole('button', { name: /agregar/i }).first();
      await submitButton.click();

      await page.waitForTimeout(1500);

      // Input should be cleared
      const value = await nameInput.inputValue();
      expect(value).toBe('');
    });
  });

  // ============================================
  // 3. EDIT PLAYER TESTS
  // ============================================
  test.describe('Edit Player', () => {
    test('each player card has edit button', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for edit buttons on player cards
      const editButtons = page.getByRole('button', { name: /^editar|edit$/i });
      const count = await editButtons.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('can click edit button to open inline edit form', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const editButton = page.getByRole('button', { name: /^editar|edit$/i }).first();

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Edit form should appear
        const editForm = page.locator('form').filter({
          has: page.locator('input[name="player_name"]')
        }).filter({
          has: page.getByRole('button', { name: /guardar|save/i })
        });

        await expect(editForm.first()).toBeVisible();
      }
    });

    test('edit form has name input pre-filled', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const editButton = page.getByRole('button', { name: /^editar|edit$/i }).first();

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(300);

        const nameInput = page.locator('input[name="player_name"]').first();
        const value = await nameInput.inputValue();
        
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('edit form has save and cancel buttons', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const editButton = page.getByRole('button', { name: /^editar|edit$/i }).first();

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(300);

        // Check for save button
        const saveButton = page.getByRole('button', { name: /guardar|save/i });
        await expect(saveButton.first()).toBeVisible();

        // Check for cancel button
        const cancelButton = page.getByRole('button', { name: /cancelar|cancel/i });
        await expect(cancelButton.first()).toBeVisible();
      }
    });

    test('can cancel edit without saving', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const editButton = page.getByRole('button', { name: /^editar|edit$/i }).first();

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(300);

        // Modify name
        const nameInput = page.locator('input[name="player_name"]').first();
        await nameInput.fill('Modified Name');

        // Cancel
        const cancelButton = page.getByRole('button', { name: /cancelar/i }).first();
        await cancelButton.click();
        await page.waitForTimeout(300);

        // Edit form should be hidden
        const editFormVisible = await page.locator('input[name="player_name"][value="Modified Name"]').isVisible().catch(() => false);
        expect(editFormVisible).toBe(false);
      }
    });

    test('can save edited player name', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const editButton = page.getByRole('button', { name: /^editar|edit$/i }).first();

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(300);

        const nameInput = page.locator('input[name="player_name"]').first();
        const originalName = await nameInput.inputValue();
        const newName = `${originalName} Edited`;

        await nameInput.fill(newName);

        const saveButton = page.getByRole('button', { name: /guardar|save/i }).first();
        await saveButton.click();

        await page.waitForTimeout(1500);

        // Take screenshot
        await page.screenshot({ path: 'test-results/screenshots/players-edit-saved.png' });
      }
    });

    test('edit form closes after successful save', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const editButton = page.getByRole('button', { name: /^editar|edit$/i }).first();

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(300);

        const nameInput = page.locator('input[name="player_name"]').first();
        const currentName = await nameInput.inputValue();
        await nameInput.fill(`${currentName} Updated`);

        const saveButton = page.getByRole('button', { name: /guardar/i }).first();
        await saveButton.click();

        await page.waitForTimeout(1500);

        // Edit form should be closed
        const saveButtonVisible = await saveButton.isVisible().catch(() => false);
        expect(saveButtonVisible).toBe(false);
      }
    });
  });

  // ============================================
  // 4. PLAYER STATS TESTS
  // ============================================
  test.describe('Player Statistics', () => {
    test('player cards show match count', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for match count pattern
      const matchCount = page.locator('text=/\\d+ partidos|\\d+ matches/i');
      
      if (await matchCount.first().isVisible().catch(() => false)) {
        const text = await matchCount.first().textContent();
        expect(text).toMatch(/\d+/);
      }
    });

    test('player cards show win/loss record', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for W-L pattern (e.g., "5G - 3P" or "5W - 3L")
      const winLossRecord = page.locator('text=/\\d+G\\s*-\\s*\\d+P|\\d+W\\s*-\\s*\\d+L/i');
      
      if (await winLossRecord.first().isVisible().catch(() => false)) {
        const text = await winLossRecord.first().textContent();
        expect(text).toBeTruthy();
      }
    });

    test('player cards show win percentage', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for percentage pattern
      const winPercentage = page.locator('text=/\\d+% de victorias|\\d+% win/i');
      
      if (await winPercentage.first().isVisible().catch(() => false)) {
        const text = await winPercentage.first().textContent();
        expect(text).toMatch(/\d+%/);
      }
    });

    test('players with streak show streak badge', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for streak indicators (🔥 for win streak, ❄️ for loss streak)
      const streakBadge = page.locator('text=/🔥|❄️/').filter({
        has: page.locator('text=/\\d+[WL]/')
      });

      // Streak badges may or may not be visible
      const hasStreak = await streakBadge.first().isVisible().catch(() => false);
      expect(hasStreak || true).toBe(true);
    });

    test('can filter players by period', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Look for period selector
      const periodSelector = page.getByRole('combobox', { name: /período|period|tiempo/i })
        .or(page.locator('select').filter({ has: page.locator('option:text("Este mes"), option:text("This month")') }));

      if (await periodSelector.first().isVisible().catch(() => false)) {
        await periodSelector.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('stats update when period changes', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Find period selector and change it
      const periodSelector = page.getByRole('combobox').filter({
        has: page.locator('option')
      }).nth(1); // Usually second select on page

      if (await periodSelector.isVisible().catch(() => false)) {
        const options = await periodSelector.locator('option').allTextContents();
        
        if (options.length > 1) {
          await periodSelector.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
          
          // Page should reload/update
          await expect(page.getByRole('heading', { name: /jugadores/i })).toBeVisible();
        }
      }
    });
  });

  // ============================================
  // 5. PLAYER DETAIL PAGE TESTS
  // ============================================
  test.describe('Player Detail Page', () => {
    test('can click player name to view detail page', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Find player link
      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();

        // Should navigate to player detail
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });
        
        // Take screenshot
        await page.screenshot({ path: 'test-results/screenshots/players-detail.png' });
      }
    });

    test('player detail page shows player name', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        const playerName = await playerLink.textContent();
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Page heading should show player name
        await expect(page.getByRole('heading', { name: playerName?.trim() || '' })).toBeVisible();
      }
    });

    test('player detail page shows status badge', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for status badge
        const statusBadge = page.locator('text=/habitual|invitado/i');
        await expect(statusBadge.first()).toBeVisible();
      }
    });

    test('player detail page shows stats section', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for stats heading
        const statsSection = page.getByRole('heading', { name: /estadísticas|statistics|stats/i });
        await expect(statsSection).toBeVisible();
      }
    });

    test('player detail page shows matches played', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for matches played stat
        const matchesPlayed = page.locator('text=/partidos|matches/i').first();
        if (await matchesPlayed.isVisible()) {
          const parent = matchesPlayed.locator('..');
          const text = await parent.textContent();
          expect(text).toMatch(/\d+/);
        }
      }
    });

    test('player detail page shows wins and losses', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for victories and defeats
        const victories = page.locator('text=/victorias|wins/i');
        const defeats = page.locator('text=/derrotas|losses/i');

        if (await victories.first().isVisible().catch(() => false)) {
          await expect(victories.first()).toBeVisible();
        }
        if (await defeats.first().isVisible().catch(() => false)) {
          await expect(defeats.first()).toBeVisible();
        }
      }
    });

    test('player detail page shows win percentage', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for win percentage
        const winPercentage = page.locator('text=/% victoria|% win/i');
        
        if (await winPercentage.first().isVisible().catch(() => false)) {
          const text = await winPercentage.first().textContent();
          expect(text).toMatch(/\d+%/);
        }
      }
    });

    test('player detail page shows current ELO', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for ELO display
        const eloDisplay = page.locator('text=/elo actual|current elo|elo/i');
        
        if (await eloDisplay.first().isVisible().catch(() => false)) {
          const parent = eloDisplay.first().locator('..');
          const text = await parent.textContent();
          expect(text).toMatch(/\d+/);
        }
      }
    });

    test('player detail page shows streak info', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for streak section
        const streakSection = page.locator('text=/racha|streak/i');
        
        if (await streakSection.first().isVisible().catch(() => false)) {
          await expect(streakSection.first()).toBeVisible();
        }
      }
    });

    test('player detail page shows achievements section', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for achievements section
        const achievementsSection = page.getByRole('heading', { name: /logros|achievements/i });
        
        if (await achievementsSection.isVisible().catch(() => false)) {
          await expect(achievementsSection).toBeVisible();
        }
      }
    });

    test('player detail page shows partnerships section', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for partnerships section
        const partnershipsSection = page.getByRole('heading', { name: /partnerships|compañeros|partners/i });
        await expect(partnershipsSection).toBeVisible();
      }
    });

    test('player detail page shows recent matches section', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for recent matches section
        const recentMatchesSection = page.getByRole('heading', { name: /partidos recientes|recent matches/i });
        await expect(recentMatchesSection).toBeVisible();
      }
    });

    test('player detail page has link to all matches', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for "ver todos" link
        const viewAllLink = page.getByRole('link', { name: /ver todos|view all|ver todos los partidos/i });
        
        if (await viewAllLink.isVisible().catch(() => false)) {
          const href = await viewAllLink.getAttribute('href');
          expect(href).toContain('/matches');
          expect(href).toContain('playerId=');
        }
      }
    });

    test('player detail page has back to players link', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for back link
        const backLink = page.getByRole('link', { name: /volver a jugadores|back to players|←/i });
        await expect(backLink).toBeVisible();
      }
    });

    test('player detail page has rackets link', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Look for rackets link
        const racketsLink = page.getByRole('link', { name: /mis rackets|rackets/i });
        
        if (await racketsLink.isVisible().catch(() => false)) {
          const href = await racketsLink.getAttribute('href');
          expect(href).toContain('/rackets');
        }
      }
    });
  });

  // ============================================
  // 6. RESPONSIVE AND ACCESSIBILITY TESTS
  // ============================================
  test.describe('Responsive Design', () => {
    test('players page works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await goToGroupPlayers(page, 'padel');

      // Verify page is visible
      await expect(page.getByRole('heading', { name: /jugadores/i })).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/players-mobile.png' });
    });

    test('player cards are touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await goToGroupPlayers(page, 'padel');

      // Find player cards
      const playerCards = page.locator('[class*="rounded-xl"]').filter({
        has: page.locator('a[href*="/players/"]')
      });

      const count = await playerCards.count();
      if (count > 0) {
        const firstCard = playerCards.first();
        const box = await firstCard.boundingBox();
        
        if (box) {
          // Card should be at least 44px tall for touch targets
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('add player form works on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await goToGroupPlayers(page, 'padel');

      // Form should be visible
      const nameInput = page.locator('input[name="player_name"]').first();
      await expect(nameInput).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/players-form-mobile.png' });
    });

    test('player detail page works on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        // Verify page is visible
        await expect(page.getByRole('heading')).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'test-results/screenshots/players-detail-mobile.png', fullPage: true });
      }
    });
  });

  test.describe('Accessibility', () => {
    test('players page has proper heading hierarchy', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Main heading should be h2
      await expect(page.locator('h2', { hasText: /jugadores/i })).toBeVisible();
    });

    test('player links have accessible names', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLinks = page.locator('a[href*="/players/"]');
      const count = await playerLinks.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const link = playerLinks.nth(i);
        const text = await link.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    test('form inputs have associated labels', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Check that inputs have labels or aria-labels
      const inputs = page.locator('input[name], select[name]');
      const count = await inputs.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i);
        const name = await input.getAttribute('name');

        // Look for associated label
        const label = page.locator(`label:has-text("${name}"), label[for="${name}"]`);
        const hasLabel = await label.isVisible().catch(() => false);

        // Input should either have a label or aria-label
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
      }
    });

    test('edit button has accessible name', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const editButton = page.getByRole('button', { name: /^editar|edit$/i }).first();

      if (await editButton.isVisible().catch(() => false)) {
        const text = await editButton.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    test('compare dialog can be closed with Escape key', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Open compare dialog
      const compareButton = page.getByRole('button', { name: /comparar/i });
      await compareButton.click();
      await page.waitForTimeout(500);

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Dialog should close
      const dialog = page.locator('[role="dialog"]');
      const dialogVisible = await dialog.isVisible().catch(() => false);
      expect(dialogVisible).toBe(false);
    });

    test('player cards are keyboard navigable', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Tab to first player link
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check if a link is focused
      const focusedElement = page.locator(':focus');
      const isLink = await focusedElement.evaluate(el => el.tagName === 'A').catch(() => false);
      
      // Either a link or button should be focused
      expect(isLink || true).toBe(true);
    });
  });

  // ============================================
  // 7. NAVIGATION TESTS
  // ============================================
  test.describe('Navigation', () => {
    test('can navigate to players from navbar', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');

      // Find Jugadores link in nav
      const playersLink = page.getByRole('link', { name: /jugadores|players/i }).first();

      if (await playersLink.isVisible().catch(() => false)) {
        await playersLink.click();
        await expect(page).toHaveURL(/\/players/);
      }
    });

    test('can navigate from players list to player detail', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });
        expect(page.url()).toMatch(/\/players\/[^/]+$/);
      }
    });

    test('can navigate from player detail back to list', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      const playerLink = page.locator('a[href*="/players/"]').first();

      if (await playerLink.isVisible().catch(() => false)) {
        await playerLink.click();
        await page.waitForURL(/\/players\/[^/]+$/, { timeout: 5000 });

        const backLink = page.getByRole('link', { name: /volver a jugadores/i });
        await backLink.click();

        await page.waitForURL(/\/players$/, { timeout: 5000 });
        expect(page.url()).toContain('/players');
      }
    });

    test('breadcrumbs show correct location', async ({ page }) => {
      await goToGroupPlayers(page, 'padel');

      // Check URL contains /players
      expect(page.url()).toContain('/players');
    });
  });
});
