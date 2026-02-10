import { test, expect } from '@playwright/test';
import {
  navigateAndReady,
  clickButton,
  fillField,
  login,
} from './test-helpers';
import players from './fixtures/players.json';

test.describe('Racket Performance Tracker', () => {
  let groupSlug: string;
  let playerId: string;

  test.beforeAll(async () => {
    // Use first player and group
    playerId = players.players[0].id;
    groupSlug = 'test-group'; // Replace with actual test group slug
  });

  test.beforeEach(async ({ page }) => {
    // Login and navigate to player rackets page
    await login(page);
    await navigateAndReady(page, `/g/${groupSlug}/players/${playerId}/rackets`);
  });

  test.describe('Racket Management', () => {
    test('should display empty state when no rackets exist', async ({ page }) => {
      // Check for empty state message
      await expect(page.getByText(/No rackets yet/i)).toBeVisible();
      await expect(page.getByText(/Add your first racket/i)).toBeVisible();
    });

    test('should add a new racket', async ({ page }) => {
      // Click "Add Racket" button
      await clickButton(page, /Add Racket/i);

      // Wait for modal to appear
      await expect(page.getByText(/Add a new racket/i)).toBeVisible();

      // Fill form fields
      await fillField(page, 'Brand', 'Bullpadel');
      await fillField(page, 'Model', 'Vertex 03');
      await fillField(page, 'Weight', '360');
      await fillField(page, 'Balance', '265');

      // Submit form
      await clickButton(page, 'Add');

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Check that racket was added
      await expect(page.getByText('Bullpadel Vertex 03')).toBeVisible();
      await expect(page.getByText('360g')).toBeVisible();
    });

    test('should validate required fields when adding racket', async ({ page }) => {
      // Click "Add Racket" button
      await clickButton(page, /Add Racket/i);

      // Try to submit without required fields
      await clickButton(page, 'Add');

      // Should not submit (modal should still be visible)
      await expect(page.getByText(/Add a new racket/i)).toBeVisible();
    });

    test('should edit an existing racket', async ({ page }) => {
      // Add a racket first
      await clickButton(page, /Add Racket/i);
      await fillField(page, 'Brand', 'Adidas');
      await fillField(page, 'Model', 'Adipower');
      await clickButton(page, 'Add');
      await page.waitForLoadState('networkidle');

      // Click on racket card to edit
      await page.click('text=Adidas Adipower');

      // Wait for edit modal
      await expect(page.getByText(/Edit Racket/i)).toBeVisible();

      // Update weight
      const weightInput = page.getByPlaceholder('360');
      await weightInput.fill('365');

      // Submit
      await clickButton(page, 'Update');

      // Check update
      await expect(page.getByText('365g')).toBeVisible();
    });

    test('should delete a racket', async ({ page }) => {
      // Add a racket first
      await clickButton(page, /Add Racket/i);
      await fillField(page, 'Brand', 'Wilson');
      await fillField(page, 'Model', 'Blade');
      await clickButton(page, 'Add');
      await page.waitForLoadState('networkidle');

      // Find and click delete button on racket card
      const deleteButton = page.locator('[data-testid="delete-racket"]').first();
      await deleteButton.click();

      // Confirm deletion (first click shows confirmation, second deletes)
      await deleteButton.click();

      // Wait for reload
      await page.waitForLoadState('networkidle');

      // Check racket is gone
      await expect(page.getByText('Wilson Blade')).not.toBeVisible();
    });
  });

  test.describe('Racket Stats Display', () => {
    test.beforeEach(async () => {
      // Create test rackets with match data
      // This would typically be done via API setup
      // For now, we'll just add rackets and test the UI
    });

    test('should display racket stats after matches are played', async () => {
      // This test requires match data to be set up
      // Skip for now, will be implemented with proper test data setup
      test.skip(true, 'Requires match data setup');
    });

    test('should show empty stats for new racket', async ({ page }) => {
      // Add a racket
      await clickButton(page, /Add Racket/i);
      await fillField(page, 'Brand', 'Nox');
      await fillField(page, 'Model', 'ML10 Pro Cup');
      await clickButton(page, 'Add');
      await page.waitForLoadState('networkidle');

      // Check that "No matches played yet" is shown
      await expect(page.getByText(/No matches played yet/i)).toBeVisible();
    });
  });

  test.describe('Racket Comparison', () => {
    test('should open comparison modal', async ({ page }) => {
      // Add at least 2 rackets first
      await clickButton(page, /Add Racket/i);
      await fillField(page, 'Brand', 'Bullpadel');
      await fillField(page, 'Model', 'Vertex 03');
      await clickButton(page, 'Add');
      await page.waitForLoadState('networkidle');

      await clickButton(page, /Add Racket/i);
      await fillField(page, 'Brand', 'Adidas');
      await fillField(page, 'Model', 'Adipower');
      await clickButton(page, 'Add');
      await page.waitForLoadState('networkidle');

      // Click "Compare" button
      await clickButton(page, 'Compare');

      // Check modal is open
      await expect(page.getByText(/Compare Rackets/i)).toBeVisible();
      await expect(page.getByText(/Select 2-4 rackets/i)).toBeVisible();
    });

    test('should select rackets and compare', async ({ page }) => {
      // Add 2 rackets
      await clickButton(page, /Add Racket/i);
      await fillField(page, 'Brand', 'Bullpadel');
      await fillField(page, 'Model', 'Vertex 03');
      await clickButton(page, 'Add');
      await page.waitForLoadState('networkidle');

      await clickButton(page, /Add Racket/i);
      await fillField(page, 'Brand', 'Adidas');
      await fillField(page, 'Model', 'Adipower');
      await clickButton(page, 'Add');
      await page.waitForLoadState('networkidle');

      // Open comparison modal
      await clickButton(page, 'Compare');

      // Select 2 rackets
      const racketButtons = page.locator('button').filter({ hasText: /Bullpadel|Adidas/ });
      await racketButtons.first().click();
      await racketButtons.nth(1).click();

      // Click compare button
      await clickButton(page, 'Compare');

      // Check comparison table is displayed
      await expect(page.getByText(/Win Rate/i)).toBeVisible();
      await expect(page.getByText(/ELO Change/i)).toBeVisible();
    });

    test('should limit selection to 4 rackets', async () => {
      // This test would require 5 rackets to be created
      // For now, we'll just check the UI logic
      test.skip(true, 'Requires multiple rackets setup');
    });
  });

  test.describe('Racket Selection in Match Creation', () => {
    test('should show racket dropdown in match creation', async ({ page }) => {
      // Navigate to new match page
      await navigateAndReady(page, `/g/${groupSlug}/matches/new`);

      // Check that racket dropdown exists (this would need data-testid or aria-label)
      // For now, we'll check if there's any dropdown for rackets
      const racketDropdowns = page.getByRole('combobox');
      await expect(racketDropdowns.first()).toBeVisible();
    });

    test('should save racket selection with match', async () => {
      // This would require more complex setup
      test.skip(true, 'Requires match creation setup');
    });
  });

  test.describe('Insights', () => {
    test('should display insights when data is available', async () => {
      // This requires match and racket data
      test.skip(true, 'Requires match data setup');
    });

    test('should show best performing racket insight', async () => {
      test.skip(true, 'Requires match data setup');
    });

    test('should show most used racket insight', async () => {
      test.skip(true, 'Requires match data setup');
    });

    test('should show aging warning for heavily used rackets', async () => {
      test.skip(true, 'Requires match data setup');
    });
  });
});
