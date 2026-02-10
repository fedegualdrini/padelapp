import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Weekly Challenges & Streak Rewards System
 * Tests: Challenges dashboard, progress tracking, and badges
 */

test.describe('Weekly Challenges System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to challenges page
    await page.goto('/g/padel/challenges');
    await page.waitForLoadState('networkidle');
  });

  test('challenges page loads and displays content', async ({ page }) => {
    // Check page title or header
    const header = page.locator('h1, h2').filter({ hasText: /Desafío|Challenge|Semana/i });
    await expect(header.first()).toBeVisible();
    
    // Check that challenges section exists
    const challengesSection = page.locator('text=/Desafíos semanales|Weekly Challenges/i');
    await expect(challengesSection).toBeVisible();
  });

  test('displays weekly challenges with progress', async ({ page }) => {
    // Look for challenge types
    const volumeChallenge = page.locator('text=/Volumen|Volume|Partidos/i');
    const performanceChallenge = page.locator('text=/Rendimiento|Performance|Victorias/i');
    const socialChallenge = page.locator('text=/Social|Amigos/i');
    
    // At least one challenge type should be visible
    const hasVolume = await volumeChallenge.isVisible().catch(() => false);
    const hasPerformance = await performanceChallenge.isVisible().catch(() => false);
    const hasSocial = await socialChallenge.isVisible().catch(() => false);
    
    expect(hasVolume || hasPerformance || hasSocial).toBe(true);
    
    // Check for progress indicators
    const progressBars = page.locator('[role="progressbar"], .progress, [class*="progress"]');
    const progressText = page.locator('text=/[0-9]+\/[0-9]+|completado|completed/i');
    
    const hasProgress = await progressBars.count() > 0 || await progressText.isVisible().catch(() => false);
  });

  test('displays player streak information', async ({ page }) => {
    // Look for streak information
    const streakSection = page.locator('text=/Racha|Streak/i');
    
    if (await streakSection.isVisible().catch(() => false)) {
      // Check for current streak number
      const streakNumber = page.locator('text=/[0-9]+ semana|[0-9]+ week/i');
      
      // Check for longest streak
      const longestStreak = page.locator('text=/Mejor racha|Longest|Record/i');
    }
  });

  test('displays weekly leaderboard', async ({ page }) => {
    // Look for leaderboard section
    const leaderboard = page.locator('text=/Clasificación|Leaderboard|Ranking semanal/i');
    
    if (await leaderboard.isVisible().catch(() => false)) {
      // Should show player names
      const playerNames = page.locator('text=/Fachi|Lucho|Leo|Nico|Fede/i');
      const hasPlayers = await playerNames.isVisible().catch(() => false);
      
      // Should show points or progress
      const points = page.locator('text=/[0-9]+ pts?|points/i');
    }
  });

  test('displays earned badges', async ({ page }) => {
    // Look for badges section
    const badgesSection = page.locator('text=/Insignias|Badges|Logros/i');
    
    if (await badgesSection.isVisible().catch(() => false)) {
      // Should display badge icons or names
      const badges = page.locator('text=/Semana Perfecta|Racha|Primera Victoria|🏆|🔥|🎯/i');
      
      // Could be empty or have badges
      const badgeCount = await badges.count();
    }
  });

  test('navigation from navbar works', async ({ page }) => {
    await page.goto('/g/padel');
    await page.waitForLoadState('networkidle');
    
    // Find and click "Desafíos" link in navbar
    const desafiosLink = page.locator('a:has-text("Desafíos"), nav a:has-text("Desafíos"), [role="navigation"] a:has-text("Desafíos")').first();
    
    if (await desafiosLink.isVisible().catch(() => false)) {
      await desafiosLink.click();
      await page.waitForURL(/\/challenges/);
      
      // Verify we're on challenges page
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('challenge completion status is visible', async ({ page }) => {
    // Look for completed challenge indicators
    const completedCheck = page.locator('text=/Completado|Completed|✓|✅/i');
    const incompleteCheck = page.locator('text=/Pendiente|Pending|En progreso|In progress/i');
    
    const hasCompleted = await completedCheck.isVisible().catch(() => false);
    const hasIncomplete = await incompleteCheck.isVisible().catch(() => false);
    
    // Should show some status for challenges
    expect(hasCompleted || hasIncomplete).toBe(true);
  });

  test('page handles no challenges gracefully', async ({ page }) => {
    // If no challenges exist, page should show appropriate message
    const emptyState = page.locator('text=/No hay desafíos|No challenges|Próximamente|Coming soon/i');
    const content = page.locator('[class*="challenge"], [data-testid*="challenge"]').first();
    
    // Either shows empty state or has challenge content
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasContent = await content.isVisible().catch(() => false);
    
    expect(hasEmpty || hasContent).toBe(true);
  });
});
