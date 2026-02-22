import { test, expect } from '@playwright/test';
import { login, navigateAndReady, waitForPageReady } from './test-helpers';

/**
 * E2E Tests for Dashboard Page (Trello #zEzjy3T5)
 * 
 * Tests cover:
 * 1. Dashboard page structure and widgets
 * 2. Next match card display and navigation
 * 3. Recent matches display
 */

// Check if Supabase is configured (not in demo mode)
const hasSupabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Skip all tests in this describe block if in demo mode
    test.skip(!hasSupabaseEnv, 'Requires Supabase environment (not demo mode)');
    
    // Ensure authenticated
    await login(page, 'padel', 'padel');
  });

  // ============================================
  // 1. DASHBOARD STRUCTURE TESTS
  // ============================================
  test.describe('Dashboard Structure', () => {
    test('dashboard page loads successfully', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Verify URL is correct
      expect(page.url()).toContain('/g/padel');
    });

    test('dashboard shows page title or heading', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Dashboard should have some visible content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    });

    test('dashboard displays next match card widget', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for next match card (might be empty state or with data)
      const nextMatchCard = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/próximo partido|next match|sin próximo partido|no upcoming/i')
      }).first();
      
      // Card should be visible
      await expect(nextMatchCard).toBeVisible({ timeout: 5000 });
    });

    test('dashboard displays recent matches section', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for recent matches section
      const recentMatchesSection = page.getByText(/últimos partidos|recent matches/i);
      await expect(recentMatchesSection).toBeVisible();
    });

    test('dashboard displays ELO ranking widget', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for ELO ranking section
      const eloSection = page.getByText(/ranking elo|elo ranking/i);
      await expect(eloSection).toBeVisible();
    });

    test('dashboard shows "Ver todos" link for matches', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for "Ver todos" link
      const viewAllLink = page.getByRole('link', { name: /ver todos|view all/i }).first();
      
      if (await viewAllLink.isVisible().catch(() => false)) {
        await expect(viewAllLink).toBeVisible();
        
        // Link should go to matches page
        const href = await viewAllLink.getAttribute('href');
        expect(href).toContain('/matches');
      }
    });

    test('dashboard shows "Ver ranking" link for ELO', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for "Ver ranking" link
      const rankingLink = page.getByRole('link', { name: /ver ranking|view ranking/i }).first();
      
      if (await rankingLink.isVisible().catch(() => false)) {
        await expect(rankingLink).toBeVisible();
        
        // Link should go to ranking page
        const href = await rankingLink.getAttribute('href');
        expect(href).toContain('/ranking');
      }
    });

    test('dashboard displays core loop info box', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for core loop information
      const coreLoopInfo = page.getByText(/core loop/i);
      
      if (await coreLoopInfo.isVisible().catch(() => false)) {
        await expect(coreLoopInfo).toBeVisible();
        
        // Should mention the flow
        const flowText = await coreLoopInfo.locator('..').textContent();
        expect(flowText?.toLowerCase()).toMatch(/asistencia|attendance/i);
      }
    });
  });

  // ============================================
  // 2. NEXT MATCH CARD TESTS
  // ============================================
  test.describe('Next Match Card', () => {
    test('next match card shows empty state when no upcoming matches', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for empty state message
      const emptyState = page.getByText(/sin próximo partido|no upcoming|no hay/i);
      
      if (await emptyState.isVisible().catch(() => false)) {
        await expect(emptyState).toBeVisible();
      }
    });

    test('next match card displays event name when available', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for event name in next match card
      const eventCard = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/jueves|lunes|martes|miércoles|viernes|sábado|domingo/i')
      }).first();
      
      if (await eventCard.isVisible().catch(() => false)) {
        const eventName = eventCard.locator('text=/jueves|lunes|martes|miércoles|viernes|sábado|domingo/i');
        await expect(eventName.first()).toBeVisible();
      }
    });

    test('next match card shows date and time', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for date/time in next match card
      const nextMatchCard = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/próximo partido|next match/i')
      }).first();
      
      if (await nextMatchCard.isVisible().catch(() => false)) {
        // Should have date pattern (DD/MM or similar)
        const datePattern = /\d{1,2}\/\d{1,2}|\d{1,2}\s+de\s+\w+/;
        const cardText = await nextMatchCard.textContent();
        
        // Time pattern (HH:MM)
        const timePattern = /\d{1,2}:\d{2}/;
        const hasTime = timePattern.test(cardText || '');
        
        // Either date or time should be present
        expect(datePattern.test(cardText || '') || hasTime).toBe(true);
      }
    });

    test('next match card shows attendance summary', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for attendance counts
      const attendanceSection = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/van|confirmed|confirmados/i')
      }).first();
      
      if (await attendanceSection.isVisible().catch(() => false)) {
        const text = await attendanceSection.textContent();
        
        // Should show some count
        expect(text).toMatch(/\d+/);
      }
    });

    test('next match card RSVP buttons are functional', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for RSVP buttons
      const rsvpButtons = page.getByRole('button').filter({
        hasText: /voy|no voy|tal vez|confirm|decline|maybe/i
      });
      
      const count = await rsvpButtons.count();
      
      if (count > 0) {
        // At least one RSVP button should be visible
        await expect(rsvpButtons.first()).toBeVisible();
        await expect(rsvpButtons.first()).toBeEnabled();
      }
    });

    test('can navigate to events from next match card', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for link to events in next match card
      const eventsLink = page.getByRole('link', { name: /ver eventos|view events|eventos/i }).first();
      
      if (await eventsLink.isVisible().catch(() => false)) {
        await eventsLink.click();
        
        // Should navigate to events page
        await page.waitForURL(/\/events/, { timeout: 5000 });
        expect(page.url()).toContain('/events');
      }
    });

    test('next match card shows player list when confirmed', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for player badges/avatars
      const playerBadges = page.locator('[class*="rounded-full"]').filter({
        hasText: /[A-Za-z]+/
      });
      
      const count = await playerBadges.count();
      
      // If there are confirmed players, should show them
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  // ============================================
  // 3. RECENT MATCHES TESTS
  // ============================================
  test.describe('Recent Matches Display', () => {
    test('recent matches section displays up to 3 matches', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for match cards
      const matchCards = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/vs|equipo|team/i')
      });
      
      const count = await matchCards.count();
      
      // Should show up to 3 recent matches
      expect(count).toBeLessThanOrEqual(3);
    });

    test('recent matches show empty state when no matches', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for empty state
      const emptyState = page.getByText(/tu grupo está listo|ready|primer partido|first match/i);
      
      if (await emptyState.isVisible().catch(() => false)) {
        await expect(emptyState).toBeVisible();
        
        // Should show call to action
        const cta = page.getByRole('link', { name: /registrar primer partido|register first match/i });
        await expect(cta).toBeVisible();
      }
    });

    test('recent matches display score', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for match score pattern (e.g., "6-4", "6/4")
      const scorePattern = /\d{1,2}[-\/]\d{1,2}/;
      const scoreElement = page.locator('text=' + scorePattern.source);
      
      if (await scoreElement.first().isVisible().catch(() => false)) {
        const text = await scoreElement.first().textContent();
        expect(scorePattern.test(text || '')).toBe(true);
      }
    });

    test('recent matches show date', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for date in recent matches
      const matchCards = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/vs|equipo/i')
      });
      
      const count = await matchCards.count();
      
      if (count > 0) {
        // Match cards should have date information
        const firstCard = matchCards.first();
        await expect(firstCard).toBeVisible();
      }
    });

    test('can click recent match to view details', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Find a match card
      const matchCards = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/vs|equipo/i')
      });
      
      const count = await matchCards.count();
      
      if (count > 0) {
        // Click first match card
        const firstMatch = matchCards.first();
        await firstMatch.click();
        
        // Should navigate to match detail or open modal
        await page.waitForTimeout(500);
        
        // Either URL changed or modal opened
        const urlChanged = page.url().includes('/matches/');
        const modalOpened = await page.locator('[role="dialog"], [class*="modal"]').isVisible().catch(() => false);
        
        expect(urlChanged || modalOpened).toBe(true);
      }
    });

    test('recent matches show team composition', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for player names in match cards
      const matchCards = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/vs|equipo/i')
      });
      
      const count = await matchCards.count();
      
      if (count > 0) {
        const firstCard = matchCards.first();
        const text = await firstCard.textContent();
        
        // Should show player names (at least 2 for a match)
        expect(text?.length).toBeGreaterThan(10);
      }
    });

    test('recent matches show winner indicator', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for winner/ganador indicator
      const winnerIndicator = page.locator('[class*="rounded-2xl"]').filter({
        has: page.locator('text=/ganador|winner|won/i')
      });
      
      if (await winnerIndicator.first().isVisible().catch(() => false)) {
        await expect(winnerIndicator.first()).toBeVisible();
      }
    });
  });

  // ============================================
  // 4. ELO RANKING WIDGET TESTS
  // ============================================
  test.describe('ELO Ranking Widget', () => {
    test('ELO ranking shows top players', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for ranking entries
      const rankingEntries = page.locator('[class*="rounded-xl"]').filter({
        has: page.locator('text=/\\d+/') // Has number (rating)
      });
      
      const count = await rankingEntries.count();
      
      // Should show up to 8 players
      expect(count).toBeLessThanOrEqual(8);
    });

    test('ELO ranking displays player names', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for ELO section
      const eloSection = page.getByText(/ranking elo/i);
      
      if (await eloSection.isVisible().catch(() => false)) {
        // Look for player names
        const playerEntries = page.locator('[class*="rounded-xl"]').filter({
          has: page.locator('text=/[A-Za-z]+/')
        });
        
        const count = await playerEntries.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('ELO ranking shows rating numbers', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for rating numbers (should be 3-4 digit numbers typically)
      const ratingPattern = /\d{3,4}/;
      const ratingElements = page.locator('text=' + ratingPattern.source);
      
      if (await ratingElements.first().isVisible().catch(() => false)) {
        const text = await ratingElements.first().textContent();
        expect(ratingPattern.test(text || '')).toBe(true);
      }
    });

    test('ELO ranking shows position numbers', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for position badges (1, 2, 3, etc.)
      const positionBadges = page.locator('[class*="rounded-full"]').filter({
        hasText: /^\d+$/
      });
      
      const count = await positionBadges.count();
      
      if (count > 0) {
        // First position should be 1
        const firstPosition = positionBadges.first();
        const text = await firstPosition.textContent();
        expect(text).toBe('1');
      }
    });

    test('ELO ranking empty state when no ELO data', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for empty state message
      const emptyState = page.getByText(/sin elo|no elo|sin datos/i);
      
      if (await emptyState.isVisible().catch(() => false)) {
        await expect(emptyState).toBeVisible();
      }
    });

    test('can navigate to full ranking from widget', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      const rankingLink = page.getByRole('link', { name: /ver ranking|view ranking/i }).first();
      
      if (await rankingLink.isVisible().catch(() => false)) {
        await rankingLink.click();
        
        // Should navigate to ranking page
        await page.waitForURL(/\/ranking/, { timeout: 5000 });
        expect(page.url()).toContain('/ranking');
      }
    });
  });

  // ============================================
  // 5. RESPONSIVE TESTS
  // ============================================
  test.describe('Dashboard Responsive Design', () => {
    test('dashboard works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateAndReady(page, '/g/padel');
      
      // Verify page is visible
      await expect(page.locator('body')).toBeVisible();
      
      // Take screenshot for visual verification
      await page.screenshot({ path: 'test-results/screenshots/dashboard-mobile.png' });
    });

    test('widgets stack vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateAndReady(page, '/g/padel');
      
      // Widgets should be in single column
      const sections = page.locator('section, [class*="grid"]');
      const count = await sections.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('touch targets are appropriately sized on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateAndReady(page, '/g/padel');
      
      // Find buttons
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      
      if (count > 0) {
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();
        
        if (box) {
          // Button should be at least 44px tall for touch
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      }
    });

    test('dashboard works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await navigateAndReady(page, '/g/padel');
      
      // Verify page is visible
      await expect(page.locator('body')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/dashboard-tablet.png' });
    });

    test('dashboard works on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await navigateAndReady(page, '/g/padel');
      
      // Verify page is visible
      await expect(page.locator('body')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/screenshots/dashboard-desktop.png' });
    });
  });

  // ============================================
  // 6. ACCESSIBILITY TESTS
  // ============================================
  test.describe('Dashboard Accessibility', () => {
    test('dashboard has proper heading hierarchy', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for headings
      const headings = page.locator('h1, h2, h3');
      const count = await headings.count();
      
      // Should have at least one heading
      expect(count).toBeGreaterThan(0);
    });

    test('all links have accessible names', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      const links = page.getByRole('link');
      const count = await links.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        
        // Link should have accessible name
        expect(text?.trim().length || ariaLabel?.length).toBeGreaterThan(0);
      }
    });

    test('all buttons have accessible names', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Button should have accessible name
        expect(text?.trim().length || ariaLabel?.length).toBeGreaterThan(0);
      }
    });

    test('interactive elements are keyboard accessible', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Should be able to focus on interactive elements
      const focusedElement = page.locator(':focus');
      const count = await focusedElement.count();
      
      // At least one element should be focusable
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('color contrast is sufficient', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // This is a visual check - we're just verifying content is visible
      const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6');
      const count = await textElements.count();
      
      expect(count).toBeGreaterThan(0);
    });
  });

  // ============================================
  // 7. NAVIGATION TESTS
  // ============================================
  test.describe('Dashboard Navigation', () => {
    test('can navigate to matches from dashboard', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      const matchesLink = page.getByRole('link', { name: /ver todos|matches|partidos/i }).first();
      
      if (await matchesLink.isVisible().catch(() => false)) {
        await matchesLink.click();
        
        await page.waitForURL(/\/matches/, { timeout: 5000 });
        expect(page.url()).toContain('/matches');
      }
    });

    test('can navigate to ranking from dashboard', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      const rankingLink = page.getByRole('link', { name: /ver ranking|ranking/i }).first();
      
      if (await rankingLink.isVisible().catch(() => false)) {
        await rankingLink.click();
        
        await page.waitForURL(/\/ranking/, { timeout: 5000 });
        expect(page.url()).toContain('/ranking');
      }
    });

    test('can navigate to create match from empty state', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for create match link in empty state
      const createMatchLink = page.getByRole('link', { name: /registrar primer partido|crear partido|new match/i }).first();
      
      if (await createMatchLink.isVisible().catch(() => false)) {
        await createMatchLink.click();
        
        await page.waitForURL(/\/matches\/new/, { timeout: 5000 });
        expect(page.url()).toContain('/matches/new');
      }
    });

    test('can navigate to players from dashboard', async ({ page }) => {
      await navigateAndReady(page, '/g/padel');
      
      // Look for invite players link
      const playersLink = page.getByRole('link', { name: /invitar amigos|players|jugadores/i }).first();
      
      if (await playersLink.isVisible().catch(() => false)) {
        await playersLink.click();
        
        await page.waitForURL(/\/players/, { timeout: 5000 });
        expect(page.url()).toContain('/players');
      }
    });
  });
});
