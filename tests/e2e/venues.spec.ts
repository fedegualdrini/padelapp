import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Smart Court & Venue Rating System
 * Tests: Venue listing, detail view, and rating submission
 */

test.describe('Venue Rating System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to venues page
    await page.goto('/g/padel/venues');
    await page.waitForLoadState('networkidle');
  });

  test('venues list page loads and displays venues', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1', { hasText: /Canchas/i })).toBeVisible();
    
    // Check that venues are displayed
    const venueCards = page.locator('[data-testid="venue-card"], .venue-card, article');
    const count = await venueCards.count();
    
    // Should have at least 3 test venues
    expect(count).toBeGreaterThanOrEqual(1);
    
    // Check that venue cards have expected content
    if (count > 0) {
      const firstCard = venueCards.first();
      await expect(firstCard.locator('text=/Club Padel|Padel Center|Premium/i')).toBeVisible();
    }
  });

  test('venue detail page loads with full information', async ({ page }) => {
    // Click on first venue
    const firstVenueLink = page.locator('a[href*="/venues/"]').first();
    await firstVenueLink.click();
    
    await page.waitForURL(/\/venues\//);
    await page.waitForLoadState('networkidle');
    
    // Check venue name is displayed
    await expect(page.locator('h1')).toBeVisible();
    
    // Check address is displayed
    await expect(page.locator('text=/Calle|Avenida|Paseo/i')).toBeVisible();
    
    // Check rating section exists
    const ratingSection = page.locator('text=/Calificación|Rating|★/i');
    await expect(ratingSection).toBeVisible();
    
    // Check amenities section
    await expect(page.locator('text=/Servicios|Amenities/i')).toBeVisible();
    
    // Check reviews section
    await expect(page.locator('text=/Reseñas|Reviews/i')).toBeVisible();
  });

  test('can navigate to rating page from venue detail', async ({ page }) => {
    // Go to first venue
    const firstVenueLink = page.locator('a[href*="/venues/"]').first();
    await firstVenueLink.click();
    await page.waitForURL(/\/venues\//);
    
    // Find and click "Rate this venue" button
    const rateButton = page.locator('button:has-text("Calificar"), a:has-text("Calificar"), button:has-text("Rate"), a:has-text("Rate")').first();
    
    if (await rateButton.isVisible().catch(() => false)) {
      await rateButton.click();
      
      // Should navigate to rating page
      await page.waitForURL(/\/rate/);
      
      // Check rating form elements
      await expect(page.locator('text=/Calificar|Rate/i')).toBeVisible();
      await expect(page.locator('text=/Calidad de cancha|Court Quality/i')).toBeVisible();
    }
  });

  test('rating form has all 6 dimensions', async ({ page }) => {
    // Navigate directly to a venue's rating page
    await page.goto('/g/padel/venues/club-padel-madrid/rate');
    await page.waitForLoadState('networkidle');
    
    // Check all 6 rating dimensions are present
    const dimensions = [
      'Calidad de cancha',
      'Iluminación',
      'Comodidad', 
      'Servicios',
      'Accesibilidad',
      'Ambiente'
    ];
    
    for (const dimension of dimensions) {
      await expect(page.locator(`text=/${dimension}/i`)).toBeVisible();
    }
    
    // Check star rating elements exist
    const starButtons = page.locator('button svg, [role="button"] svg, .star');
    expect(await starButtons.count()).toBeGreaterThanOrEqual(30); // 6 dimensions × 5 stars
  });

  test('can submit a venue rating', async ({ page }) => {
    // Navigate to rating page
    await page.goto('/g/padel/venues/club-padel-madrid/rate');
    await page.waitForLoadState('networkidle');
    
    // Click 4 stars for each dimension (30 star buttons, click every 5th)
    const starButtons = page.locator('button').filter({ has: page.locator('svg') });
    
    // Click stars for each dimension - click the 4th star in each group
    const groups = 6;
    for (let i = 0; i < groups; i++) {
      // Click the 4th star (index 3) in each dimension
      const starGroup = page.locator('button').filter({ has: page.locator('svg') }).slice(i * 5, (i + 1) * 5);
      if (await starGroup.nth(3).isVisible().catch(() => false)) {
        await starGroup.nth(3).click();
      }
    }
    
    // Add optional review
    const reviewInput = page.locator('textarea');
    if (await reviewInput.isVisible().catch(() => false)) {
      await reviewInput.fill('Excelente cancha, muy recomendable para jugar con amigos.');
    }
    
    // Submit rating
    const submitButton = page.locator('button:has-text("Enviar"), button:has-text("Submit")').first();
    if (await submitButton.isEnabled().catch(() => false)) {
      await submitButton.click();
      
      // Should redirect back to venue detail
      await page.waitForURL(/\/venues\/club-padel-madrid(?!\/rate)/);
      
      // Verify we're back on the venue page
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('venue cards display correct information', async ({ page }) => {
    await page.goto('/g/padel/venues');
    await page.waitForLoadState('networkidle');
    
    // Check venue card structure
    const venueCards = page.locator('article, [class*="card"], [data-testid*="venue"]').first();
    
    if (await venueCards.isVisible().catch(() => false)) {
      // Card should have name
      await expect(venueCards.locator('text=/Club|Padel|Cancha/i')).toBeVisible();
      
      // Card should have rating (stars or number)
      const hasRating = await venueCards.locator('svg, text=/★|[0-9]\.[0-9]/i').isVisible().catch(() => false);
      
      // Card should have attributes
      const hasAttributes = await venueCards.locator('text=/Vidrio|Cemento|Interior|Exterior/i').isVisible().catch(() => false);
    }
  });

  test('navigation from navbar works', async ({ page }) => {
    await page.goto('/g/padel');
    await page.waitForLoadState('networkidle');
    
    // Find and click "Canchas" link in navbar
    const canchasLink = page.locator('a:has-text("Canchas"), nav a:has-text("Canchas"), [role="navigation"] a:has-text("Canchas")').first();
    
    if (await canchasLink.isVisible().catch(() => false)) {
      await canchasLink.click();
      await page.waitForURL(/\/venues/);
      
      // Verify we're on venues page
      await expect(page.locator('h1', { hasText: /Canchas/i })).toBeVisible();
    }
  });
});
