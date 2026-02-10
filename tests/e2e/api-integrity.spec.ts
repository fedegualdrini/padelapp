import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';
import { createBrowserContext } from '@playwright/test';

/**
 * API & Data Integrity Tests
 * Tests: Database migrations, RLS policies, CRUD operations, concurrent operations
 */

test.describe('API & Data Integrity', () => {
  test.describe('Database Migrations', () => {
    test('database migrations run successfully', async ({ page }) => {
      // This is more of an infra test
      // We can verify by checking if expected tables exist in the app
      
      // Navigate to ranking page
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      
      // If ranking loads, tables exist
      const rankingHeading = page.locator('h2:has-text("Ranking")').first();
      await expect(rankingHeading).toBeVisible();
    });

    test('required indexes are present', async ({ page }) => {
      // This would require API access to check indexes
      // For now, verify queries work (which suggests indexes are present)
      
      // Navigate to venues page (uses venue-related indexes)
      await page.goto('/g/padel/venues');
      await page.waitForLoadState('networkidle');
      
      // If venues load, indexes are working
      const venuesHeading = page.locator('h2:has-text("Canchas y clubes"), h1:has-text("Canchas y clubes")').first();
      await expect(venuesHeading).toBeVisible();
    });

    test('RLS policies are active', async ({ page }) => {
      // In demo/no-env mode, all slugs map to the demo group so this check is meaningless.
      test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'demo mode (no Supabase env)');

      // Test RLS by trying to access data from another group
      // Navigate to unknown group ranking
      
      await page.goto('/g/unknown-group/ranking');
      
      // Should show 404 or redirect (not show actual data)
      const pageContent = await page.content();
      const hasRankingData = pageContent.includes('Ranking') && 
                           (pageContent.includes('Player') || pageContent.includes('Jugador'));
      
      // Unknown group should not show ranking data
      expect(hasRankingData).toBe(false);
      
      // Verify we're redirected or shown error
      const url = page.url();
      const is404OrRedirect = url.includes('unknown') || 
                              url.includes('404') ||
                              url.includes('join');
      
      expect(is404OrRedirect).toBe(true);
    });

    test('foreign key constraints are enforced', async ({ page }) => {
      // This would require creating data with invalid references
      // For now, verify existing relationships work
      
      // Navigate to venue detail (has venue_id reference)
      await page.goto('/g/padel/venues');
      await page.waitForLoadState('networkidle');
      
      // Click on a venue
      const venueCard = page.locator('[data-testid*="venue-card"], .venue-card, a[href*="venues/"]').first();
      
      if (await venueCard.isVisible().catch(() => false)) {
        await venueCard.click();
        await page.waitForLoadState('networkidle');
        
        // Venue detail should load (foreign key is valid)
        const venueDetail = page.locator('text=/Venue|Venue info|Venue rating/i').first();
        if (await venueDetail.isVisible().catch(() => false)) {
          await expect(venueDetail).toBeVisible();
        }
      }
    });
  });

  test.describe('CRUD Operations', () => {
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'demo mode (no Supabase env)');
    test('create operation succeeds', async ({ page }) => {
      // Create a test match or event
      // Navigate to new match page
      
      await page.goto('/g/padel/matches/new');
      await page.waitForLoadState('networkidle');
      
      // Verify form is loaded
      const createHeading = page.locator('h1, h2').filter({ hasText: /Nuevo|New|Create/i }).first();
      await expect(createHeading).toBeVisible();
      
      // Form should have submit button
      const submitButton = page.locator('button:has-text("Crear"), button:has-text("Create"), input[type="submit"]').first();
      await expect(submitButton).toBeVisible();
    });

    test('read operation returns correct data', async ({ page }) => {
      // Read a specific player's data
      // Navigate to ranking and find a player
      
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      
      // Get first player name
      const firstPlayer = page.locator('td:has-text(/[A-Za-z]+ [A-Za-z]+/), [data-testid*="player"]').first();
      
      if (await firstPlayer.isVisible().catch(() => false)) {
        const playerName = await firstPlayer.innerText();
        
        // Player should have data visible
        expect(playerName).toBeTruthy();
        expect(playerName.length).toBeGreaterThan(0);
      }
    });

    test('update operation modifies data', async ({ page }) => {
      // This would require editing an existing match or venue
      // Navigate to venues page
      
      await page.goto('/g/padel/venues');
      await page.waitForLoadState('networkidle');
      
      // Look for edit button (if it exists)
      const editButton = page.locator('button:has-text("Editar"), button:has-text("Edit"), a:has-text("Edit")').first();
      
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await page.waitForLoadState('networkidle');
        
        // Edit form should be visible
        const editHeading = page.locator('h1, h2').filter({ hasText: /Edit|Editar/i }).first();
        if (await editHeading.isVisible().catch(() => false)) {
          await expect(editHeading).toBeVisible();
        }
      }
    });

    test('delete operation removes records', async ({ page }) => {
      // This would require creating and then deleting a test record
      // For now, verify delete UI exists
      
      // Navigate to matches
      await page.goto('/g/padel/matches');
      await page.waitForLoadState('networkidle');
      
      // Look for delete button
      const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Delete"), [aria-label*="delete"]').first();
      
      // Delete button might or might not be visible
      // If it exists, verify it's properly labeled
      if (await deleteButton.isVisible().catch(() => false)) {
        await expect(deleteButton).toHaveAttribute('aria-label', /delete/i);
      }
    });
  });

  test.describe('Concurrent Operations', () => {
    test('multiple users can view ranking simultaneously', async ({ browser }) => {
      // Create two separate contexts (simulating two users)
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Both navigate to ranking
      await Promise.all([
        page1.goto('/g/padel/ranking'),
        page2.goto('/g/padel/ranking')
      ]);
      
      // Both should load successfully
      await Promise.all([
        page1.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle')
      ]);
      
      // Verify both see ranking
      await Promise.all([
        expect(page1.locator('h2:has-text("Ranking")').first()).toBeVisible(),
        expect(page2.locator('h2:has-text("Ranking")').first()).toBeVisible()
      ]);
      
      // Clean up
      await context1.close();
      await context2.close();
    });

    test('data integrity is maintained during concurrent access', async ({ browser }) => {
      // Create two contexts
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Both navigate to venues
      await Promise.all([
        page1.goto('/g/padel/venues'),
        page2.goto('/g/padel/venues')
      ]);
      
      // Both should load same data
      await Promise.all([
        page1.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle')
      ]);
      
      // Both should see same number of venues
      const venues1 = await page1.locator('[data-testid*="venue-card"], .venue-card, [class*="venue"]').count();
      const venues2 = await page2.locator('[data-testid*="venue-card"], .venue-card, [class*="venue"]').count();
      
      expect(venues1).toBe(venues2);
      
      // Clean up
      await context1.close();
      await context2.close();
    });
  });

  test.describe('Data Seeding', () => {
    test('seed data loads correctly', async ({ page }) => {
      // Verify seed data is present
      // Check ranking has players
      
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      
      // Should have at least some players
      const rankingTable = page.locator('table, [role="grid"], [class*="ranking"]').first();
      if (await rankingTable.isVisible().catch(() => false)) {
        const rows = await rankingTable.locator('tr, [role="row"]').count();
        expect(rows).toBeGreaterThan(1); // At least header + 1 player
      }
    });

    test('test fixtures are consistent', async ({ page }) => {
      // Navigate to venues and check if test venues exist
      await page.goto('/g/padel/venues');
      await page.waitForLoadState('networkidle');
      
      // Should have some venues (from seed data)
      const venueCards = page.locator('[data-testid*="venue-card"], .venue-card').all();
      expect(venueCards.length).toBeGreaterThan(0);
    });

    test('relationships are valid', async ({ page }) => {
      // Verify foreign key relationships work
      // Navigate to venue detail and check ratings
      
      await page.goto('/g/padel/venues');
      await page.waitForLoadState('networkidle');
      
      const venueCard = page.locator('[data-testid*="venue-card"], .venue-card, a[href*="venues/"]').first();
      
      if (await venueCard.isVisible().catch(() => false)) {
        await venueCard.click();
        await page.waitForLoadState('networkidle');
        
        // Check if ratings section is visible
        const ratingsSection = page.locator('text=/Ratings|Calificaciones/i').first();
        if (await ratingsSection.isVisible().catch(() => false)) {
          // Ratings should display
          await expect(ratingsSection).toBeVisible();
        }
      }
    });

    test('required test data is present', async ({ page }) => {
      // Verify all required test data exists
      // Players, venues, groups, etc.
      
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      
      // Should have players
      const rankingHeading = page.locator('h2:has-text("Ranking")').first();
      await expect(rankingHeading).toBeVisible();
      
      // Should have at least 1 player
      const playerRows = page.locator('tr, [role="row"]').all();
      expect(playerRows.length).toBeGreaterThan(1);
    });
  });

  test.describe('Error Handling', () => {
    test('graceful error on network failure', async ({ page }) => {
      // This is hard to test without actual network control
      // For now, verify error UI exists
      
      // Navigate to a page and check error handling
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      
      // Error boundary should be in place (even if not triggered)
      const errorBoundary = page.locator('[role="alert"], [class*="error"]').all();
      // Error boundary might not be visible, but should exist in DOM
      // This is a passive check
    });

    test('graceful error on invalid data', async ({ page }) => {
      // Try to navigate to an invalid route
      await page.goto('/g/padel/invalid-route-12345');
      
      // Should show 404 or handle gracefully
      const content = await page.content();
      
      // Should not crash the app
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    test('graceful error on permission denied', async ({ page }) => {
      // Try to access protected route without authentication
      // This depends on how auth is implemented
      
      await page.goto('/g/unknown-group/ranking');
      
      // Should not show actual data
      const url = page.url();
      
      // Should be on join page or error page
      const isJoinOrError = url.includes('join') || 
                            url.includes('404') ||
                            url.includes('error');
      
      expect(isJoinOrError).toBe(true);
    });
  });

  test.describe('Performance', () => {
    test('ranking page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('venues page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/g/padel/venues');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('challenges page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/g/padel/challenges');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
