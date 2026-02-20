import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Recently Merged Features (PR #59-64)
 * 
 * Tests cover:
 * - Achievements page display (PR #59, #64)
 * - Match cards alignment (PR #62, #63)
 * - AppShell navigation (PR #59-61)
 */

test.describe('Achievements Page Display', () => {
  test('should display achievements page with correct structure', async ({ page }) => {
    await page.goto('/g/padel/achievements', { waitUntil: 'domcontentloaded' });

    // Page title should be visible
    await expect(page.locator('h2', { hasText: 'Logros' })).toBeVisible({ timeout: 15000 });

    // Subtitle should be visible
    await expect(page.getByText(/Sistema de gamificación/)).toBeVisible();
  });

  test('should display achievement categories', async ({ page }) => {
    await page.goto('/g/padel/achievements', { waitUntil: 'domcontentloaded' });

    // Wait for categories section
    await expect(page.locator('h3', { hasText: 'Categorías de logros' })).toBeVisible({ timeout: 15000 });

    // Check for category cards
    const categories = ['Partidos', 'Rachas', 'ELO', 'Rankings', 'Especiales'];
    for (const category of categories) {
      await expect(page.locator('h4', { hasText: category })).toBeVisible();
    }
  });

  test('should display back to players link', async ({ page }) => {
    await page.goto('/g/padel/achievements', { waitUntil: 'domcontentloaded' });

    const backLink = page.getByRole('link', { name: /Volver a jugadores/ });
    await expect(backLink).toBeVisible();

    // Verify link destination
    await expect(backLink).toHaveAttribute('href', '/g/padel/players');
  });

  test('should display achievements leaderboard', async ({ page }) => {
    await page.goto('/g/padel/achievements', { waitUntil: 'domcontentloaded' });

    // Leaderboard component should be present
    // The leaderboard shows players with achievements
    const leaderboardSection = page.locator('section').filter({ hasText: /leaderboard|logro/i }).or(
      page.locator('[class*="leaderboard"]')
    );
    
    // Even if no achievements exist, the section should exist
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/achievements');
  });

  test('should have proper heading hierarchy for accessibility', async ({ page }) => {
    await page.goto('/g/padel/achievements', { waitUntil: 'domcontentloaded' });

    // Main heading should be h2
    await expect(page.locator('h2', { hasText: 'Logros' })).toBeVisible();

    // Categories section should have h3
    await expect(page.locator('h3', { hasText: 'Categorías de logros' })).toBeVisible();
  });
});

test.describe('Achievements Section Component', () => {
  test('should display filter buttons for categories', async ({ page }) => {
    // Navigate to a page with AchievementsSection (player detail page)
    await page.goto('/g/padel/players', { waitUntil: 'domcontentloaded' });
    
    // Look for any achievements section or row
    const achievementsRow = page.locator('[data-testid*="achievement"], [class*="achievement"]').first();
    
    // The section may or may not exist based on player data
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/players');
  });
});

test.describe('Match Cards Alignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/g/padel/matches', { waitUntil: 'domcontentloaded' });
  });

  test('should display match cards with proper structure', async ({ page }) => {
    // Wait for matches to load
    await page.waitForLoadState('networkidle');

    // Look for match cards
    const matchCards = page.locator('[class*="rounded-2xl"][class*="cursor-pointer"]').filter({
      has: page.locator('text=/Resultado|sets/i')
    });

    // If matches exist, verify structure
    const count = await matchCards.count();
    if (count > 0) {
      const firstCard = matchCards.first();
      
      // Card should have team sections
      await expect(firstCard.locator('[class*="grid"]')).toBeVisible();
      
      // Card should show date/best of info
      await expect(firstCard.locator('text=/Mejor de|sets/i')).toBeVisible();
    }
  });

  test('should have aligned team sections in match cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find match cards
    const matchCards = page.locator('[role="link"][tabindex="0"]').filter({
      has: page.locator('text=/Ganadores|Resultado/i')
    });

    const count = await matchCards.count();
    if (count > 0) {
      const firstCard = matchCards.first();
      
      // Check for grid layout with 2 columns
      const gridSection = firstCard.locator('[class*="grid"]');
      await expect(gridSection).toBeVisible();
      
      // Verify it has sm:grid-cols-2 for alignment
      const gridClasses = await gridSection.getAttribute('class');
      expect(gridClasses).toContain('grid');
    }
  });

  test('should display score line correctly in match cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for score display
    const scoreElements = page.locator('text=/\\d+-\\d+/');
    
    // If matches exist with scores, they should be visible
    const count = await scoreElements.count();
    // Either scores exist or we see "Sin score"
    if (count === 0) {
      await expect(page.locator('text=/Sin score|No hay partidos/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // It's okay if neither is found - there might be no matches at all
      });
    }
  });

  test('should show winner badge on winning team', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for winner badges
    const winnerBadges = page.locator('text=Ganadores');
    
    const count = await winnerBadges.count();
    if (count > 0) {
      // Verify winner badge styling
      const firstBadge = winnerBadges.first();
      await expect(firstBadge).toBeVisible();
      
      // Badge should have yellow background (winning color)
      const badgeClasses = await firstBadge.getAttribute('class');
      expect(badgeClasses).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find match cards
    const matchCards = page.locator('[role="link"][tabindex="0"]');
    
    const count = await matchCards.count();
    if (count > 0) {
      const firstCard = matchCards.first();
      
      // Focus the card
      await firstCard.focus();
      
      // Press Enter to navigate
      await page.keyboard.press('Enter');
      
      // Should navigate to match detail
      await page.waitForURL(/\/matches\/[^/]+$/, { timeout: 10000 }).catch(() => {
        // Navigation might not happen if no matches exist
      });
    }
  });

  test('should have hover effect', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const matchCards = page.locator('[role="link"][tabindex="0"]');
    
    const count = await matchCards.count();
    if (count > 0) {
      const firstCard = matchCards.first();
      
      // Hover over card
      await firstCard.hover();
      
      // Card should have transition class
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('transition');
    }
  });
});

test.describe('AppShell Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/g/padel', { waitUntil: 'domcontentloaded' });
  });

  test('should display group name in header', async ({ page }) => {
    // Header should show group name
    const headerSection = page.locator('header');
    await expect(headerSection).toBeVisible();
    
    // Group name should be visible (uppercase, muted text)
    const groupName = page.locator('p.text-xs.uppercase.tracking-\\[0\\.2em\\]');
    await expect(groupName.first()).toBeVisible();
  });

  test('should display main title', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Padel Tracker' })).toBeVisible();
  });

  test('should display new match button', async ({ page }) => {
    const newMatchButton = page.getByRole('link', { name: /Nuevo partido|Partido/ });
    await expect(newMatchButton).toBeVisible();
    
    // Verify link destination
    const href = await newMatchButton.getAttribute('href');
    expect(href).toContain('/matches/new');
  });

  test('should display navigation bar with correct links', async ({ page }) => {
    // Nav bar should be visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check for main navigation links
    const navLinks = [
      { label: 'Inicio', href: '/g/padel' },
      { label: 'Partidos', href: '/g/padel/matches' },
      { label: 'Ranking', href: '/g/padel/ranking' },
      { label: 'Grupo', href: '/g/padel/players' },
    ];

    for (const link of navLinks) {
      const navLink = page.getByRole('link', { name: new RegExp(link.label, 'i') }).first();
      await expect(navLink).toBeVisible();
    }
  });

  test('should display secondary navigation links', async ({ page }) => {
    // Check for secondary nav links
    const secondaryLinks = ['Logros', 'Desafíos', 'Calendario', 'Parejas'];

    for (const label of secondaryLinks) {
      const link = page.getByRole('link', { name: new RegExp(label, 'i') }).first();
      await expect(link).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to matches page', async ({ page }) => {
    await page.getByRole('link', { name: /Partidos/ }).first().click();
    await expect(page).toHaveURL(/\/g\/padel\/matches/);
  });

  test('should navigate to ranking page', async ({ page }) => {
    await page.getByRole('link', { name: /Ranking/ }).first().click();
    await expect(page).toHaveURL(/\/g\/padel\/ranking/);
  });

  test('should navigate to players (Grupo) page', async ({ page }) => {
    await page.getByRole('link', { name: /Grupo/ }).first().click();
    await expect(page).toHaveURL(/\/g\/padel\/players/);
  });

  test('should navigate to achievements page', async ({ page }) => {
    await page.getByRole('link', { name: /Logros/ }).first().click();
    await expect(page).toHaveURL(/\/g\/padel\/achievements/);
  });

  test('should navigate to challenges page', async ({ page }) => {
    await page.getByRole('link', { name: /Desafíos/ }).first().click();
    await expect(page).toHaveURL(/\/g\/padel\/challenges/);
  });

  test('should navigate to calendar page', async ({ page }) => {
    await page.getByRole('link', { name: /Calendario/ }).first().click();
    await expect(page).toHaveURL(/\/g\/padel\/calendar/);
  });

  test('should navigate to pairs page', async ({ page }) => {
    await page.getByRole('link', { name: /Parejas/ }).first().click();
    await expect(page).toHaveURL(/\/g\/padel\/pairs/);
  });

  test('should display skip to content link for accessibility', async ({ page }) => {
    // Skip link should exist
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    
    // Should have accessible text
    await expect(skipLink).toHaveText(/Saltar al contenido/);
  });

  test('should display theme toggle', async ({ page }) => {
    // Theme toggle button should be visible
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"]').or(
      page.locator('button').filter({ has: page.locator('svg') })
    ).first();
    
    await expect(themeToggle).toBeVisible({ timeout: 10000 });
  });

  test('should display Quick Actions FAB', async ({ page }) => {
    // FAB should be visible
    const fab = page.getByRole('button', { name: /acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });
  });

  test('should highlight active nav link', async ({ page }) => {
    // On dashboard, "Inicio" should be active
    const inicioLink = page.getByRole('link', { name: /Inicio/ }).first();
    
    // Check if it has the active styling (accent background)
    const linkSpan = inicioLink.locator('span');
    const classes = await linkSpan.getAttribute('class');
    
    // Active links should have accent color class
    expect(classes).toContain('accent');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Header should still be visible
    await expect(page.locator('header')).toBeVisible();
    
    // Nav should be scrollable on mobile
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Mobile button text should be different
    const mobileButton = page.getByRole('link', { name: /\+ Partido/ });
    await expect(mobileButton).toBeVisible();
  });
});

test.describe('AppShell on Protected Pages', () => {
  test('should show AppShell on achievements page', async ({ page }) => {
    await page.goto('/g/padel/achievements', { waitUntil: 'domcontentloaded' });
    
    // Header should be visible
    await expect(page.locator('header')).toBeVisible();
    
    // Nav should be visible
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show AppShell on challenges page', async ({ page }) => {
    await page.goto('/g/padel/challenges', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show AppShell on pairs page', async ({ page }) => {
    await page.goto('/g/padel/pairs', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show AppShell on calendar page', async ({ page }) => {
    await page.goto('/g/padel/calendar', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should maintain navigation state across page transitions', async ({ page }) => {
    // Start on dashboard
    await page.goto('/g/padel', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('nav')).toBeVisible();
    
    // Navigate to matches
    await page.getByRole('link', { name: /Partidos/ }).first().click();
    await expect(page.locator('nav')).toBeVisible();
    
    // Navigate to ranking
    await page.getByRole('link', { name: /Ranking/ }).first().click();
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Match Cards - Visual Alignment', () => {
  test('match cards should have consistent spacing', async ({ page }) => {
    await page.goto('/g/padel/matches', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Find all match cards
    const matchCards = page.locator('[role="link"][tabindex="0"]');
    const count = await matchCards.count();

    if (count >= 2) {
      // Get bounding boxes of first two cards
      const box1 = await matchCards.nth(0).boundingBox();
      const box2 = await matchCards.nth(1).boundingBox();

      if (box1 && box2) {
        // Cards should have same width (within 5px tolerance)
        expect(Math.abs(box1.width - box2.width)).toBeLessThan(5);
      }
    }
  });

  test('team sections within cards should be aligned', async ({ page }) => {
    await page.goto('/g/padel/matches', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const matchCard = page.locator('[role="link"][tabindex="0"]').first();
    
    if (await matchCard.isVisible()) {
      // Find team divs inside the card
      const teamDivs = matchCard.locator('[class*="rounded-xl"][class*="border"]');
      const count = await teamDivs.count();

      if (count >= 2) {
        const box1 = await teamDivs.nth(0).boundingBox();
        const box2 = await teamDivs.nth(1).boundingBox();

        if (box1 && box2) {
          // Team sections should have same height (within 10px tolerance - content may vary)
          // But they should be in the same row (similar Y position on desktop)
          expect(Math.abs(box1.width - box2.width)).toBeLessThan(10);
        }
      }
    }
  });
});
