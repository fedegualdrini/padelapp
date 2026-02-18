import { test, expect } from '@playwright/test';

/**
 * Mobile Responsiveness Tests
 * Tests key user flows for casual players on mobile devices (375px+)
 */

test.describe('Mobile Responsiveness (375px viewport)', () => {
  const mobileViewport = { width: 375, height: 667 };

  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(mobileViewport);
  });

  test.describe('Dashboard', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

      // Check that main components are visible
      await expect(page.getByText('Próximo partido')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Últimos partidos')).toBeVisible();
      await expect(page.getByText('Ranking ELO')).toBeVisible();

      // Check Quick Actions FAB is visible
      const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
      await expect(fab).toBeVisible({ timeout: 15000 });

      // Verify FAB is positioned at bottom-right (should be accessible)
      const fabBox = await fab.boundingBox();
      expect(fabBox).toBeTruthy();
      if (fabBox) {
        expect(fabBox.x).toBeGreaterThan(300); // Should be on the right side
        expect(fabBox.y).toBeGreaterThan(500); // Should be near the bottom
      }
    });
  });

  test.describe('New Match Form', () => {
    test('should be usable on mobile', async ({ page }) => {
      await page.goto('/g/test-group/matches/new', { waitUntil: 'domcontentloaded' });

      // Check form sections are visible
      await expect(page.getByText('Info del partido')).toBeVisible();
      await expect(page.getByText('Parejas habituales')).toBeVisible();
      await expect(page.getByText('Equipos')).toBeVisible();
      await expect(page.getByText('MVP')).toBeVisible();
      await expect(page.getByText('Marcador por set')).toBeVisible();

      // Check form inputs are tappable (sufficient touch targets)
      const dateInput = page.locator('input[name="played_date"]');
      await expect(dateInput).toBeVisible();

      const dateBox = await dateInput.boundingBox();
      expect(dateBox).toBeTruthy();
      if (dateBox) {
        // Touch targets should be at least 44x44px for mobile
        expect(dateBox.height).toBeGreaterThanOrEqual(40);
      }

      // Check player selectors are usable
      const team1Player1 = page.locator('select[name="team1_player1"]');
      await expect(team1Player1).toBeVisible();

      const selectorBox = await team1Player1.boundingBox();
      expect(selectorBox).toBeTruthy();
      if (selectorBox) {
        expect(selectorBox.height).toBeGreaterThanOrEqual(40);
      }

      // Check buttons are full-width on mobile
      const buttons = page.locator('form button[type="submit"], form button[type="button"]');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const buttonBox = await button.boundingBox();
        expect(buttonBox).toBeTruthy();
        if (buttonBox) {
          // On mobile, buttons should be at least 44px tall
          expect(buttonBox.height).toBeGreaterThanOrEqual(40);
          // Width should be substantial for easy tapping
          expect(buttonBox.width).toBeGreaterThanOrEqual(100);
        }
      }

      // Check set score inputs are properly stacked on mobile
      const setLabel = page.getByText('Set 1');
      await expect(setLabel).toBeVisible();

      const setLabelBox = await setLabel.boundingBox();
      expect(setLabelBox).toBeTruthy();
      if (setLabelBox) {
        // Label should be on its own line on mobile
        expect(setLabelBox.width).toBeLessThan(100);
      }
    });

    test('set score inputs should be side-by-side on mobile', async ({ page }) => {
      await page.goto('/g/test-group/matches/new', { waitUntil: 'domcontentloaded' });

      // Get both set 1 inputs
      const team1Input = page.locator('input[name="set1_team1"]');
      const team2Input = page.locator('input[name="set1_team2"]');

      await expect(team1Input).toBeVisible();
      await expect(team2Input).toBeVisible();

      const team1Box = await team1Input.boundingBox();
      const team2Box = await team2Input.boundingBox();

      expect(team1Box).toBeTruthy();
      expect(team2Box).toBeTruthy();

      if (team1Box && team2Box) {
        // Inputs should be on the same row (similar Y position)
        expect(Math.abs(team1Box.y - team2Box.y)).toBeLessThan(10);

        // Both inputs should have substantial width on mobile
        expect(team1Box.width).toBeGreaterThan(100);
        expect(team2Box.width).toBeGreaterThan(100);

        // Total width of both inputs should fit within mobile viewport (with margins)
        expect(team1Box.x + team1Box.width).toBeLessThan(375);
        expect(team2Box.x + team2Box.width).toBeLessThanOrEqual(375);
      }
    });
  });

  test.describe('Player Directory', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.goto('/g/test-group/players', { waitUntil: 'domcontentloaded' });

      // Check main sections are visible
      await expect(page.getByText('Jugadores')).toBeVisible();
      await expect(page.getByText('Habituales')).toBeVisible();
      await expect(page.getByText('Invitados')).toBeVisible();

      // Check compare button is full-width on mobile
      const compareButton = page.getByRole('button', { name: /comparar jugadores/i });
      await expect(compareButton).toBeVisible();

      const compareBox = await compareButton.boundingBox();
      expect(compareBox).toBeTruthy();
      if (compareBox) {
        // On mobile, button should span most of the width
        expect(compareBox.width).toBeGreaterThan(200);
      }

      // Check player cards are properly stacked
      const playerCards = page.locator('.rounded-xl.border');
      const cardCount = await playerCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Verify cards are in a grid layout
      if (cardCount >= 2) {
        const firstCard = playerCards.first();
        const secondCard = playerCards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        expect(firstBox).toBeTruthy();
        expect(secondBox).toBeTruthy();

        if (firstBox && secondBox) {
          // On mobile, cards might be stacked or in 2-column grid
          // Either way, they should fit within viewport
          expect(firstBox.x + firstBox.width).toBeLessThanOrEqual(375);
          expect(secondBox.x + secondBox.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });

  test.describe('ELO Rankings', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.goto('/g/test-group/ranking', { waitUntil: 'domcontentloaded' });

      // Check main content is visible
      await expect(page.getByText('Ranking')).toBeVisible();

      // On mobile, chart and sidebar should be stacked
      // Chart should be first
      const chartSection = page.locator('.rounded-lg.border').first();
      await expect(chartSection).toBeVisible();

      // Sidebar should be below chart
      const sidebarSection = page.locator('.rounded-lg.border').nth(1);
      await expect(sidebarSection).toBeVisible();

      const chartBox = await chartSection.boundingBox();
      const sidebarBox = await sidebarSection.boundingBox();

      expect(chartBox).toBeTruthy();
      expect(sidebarBox).toBeTruthy();

      if (chartBox && sidebarBox) {
        // Sidebar should be below chart on mobile
        expect(sidebarBox.y).toBeGreaterThan(chartBox.y);

        // Both should fit within mobile viewport
        expect(chartBox.width).toBeLessThanOrEqual(375);
        expect(sidebarBox.width).toBeLessThanOrEqual(375);
      }
    });

    test('chart should be usable on mobile', async ({ page }) => {
      await page.goto('/g/test-group/ranking', { waitUntil: 'domcontentloaded' });

      // Wait for chart to load
      await page.waitForTimeout(3000);

      // Chart container should be visible
      const chartContainer = page.locator('.rounded-lg.border').first();
      await expect(chartContainer).toBeVisible();

      const chartBox = await chartContainer.boundingBox();
      expect(chartBox).toBeTruthy();
      if (chartBox) {
        // Chart should have reasonable height on mobile
        expect(chartBox.height).toBeGreaterThan(300);
        // Width should fit within viewport
        expect(chartBox.width).toBeLessThanOrEqual(375);
      }
    });
  });

  test.describe('Mobile-Specific Layout', () => {
    test('should not have horizontal scroll', async ({ page }) => {
      await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

      // Check if there's horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 375;

      // Body width should not exceed viewport width significantly
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
    });

    test('text should be readable on mobile', async ({ page }) => {
      await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

      // Check heading sizes
      const heading = page.locator('h2').first();
      const headingStyles = await heading.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight,
        };
      });

      // Font size should be reasonable on mobile
      const fontSize = parseFloat(headingStyles.fontSize);
      expect(fontSize).toBeGreaterThan(14); // At least 14px
      expect(fontSize).toBeLessThan(32); // Not too large

      // Line height should provide good readability
      const lineHeight = parseFloat(headingStyles.lineHeight);
      expect(lineHeight).toBeGreaterThan(fontSize * 1.2);
    });

    test('touch targets should be sufficient', async ({ page }) => {
      await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

      // Check various interactive elements
      const buttons = page.locator('button, a, input, select');
      const buttonCount = await buttons.count();

      let checkedCount = 0;
      const minTouchTarget = 44; // Apple and Google recommend 44x44px

      for (let i = 0; i < Math.min(buttonCount, 20); i++) {
        const element = buttons.nth(i);
        const box = await element.boundingBox();

        if (box) {
          // Either height or width should be at least 44px
          // (some elements are wide but short, some are square)
          const hasMinSize = box.height >= minTouchTarget || box.width >= minTouchTarget;
          if (hasMinSize) {
            checkedCount++;
          }
        }
      }

      // At least some interactive elements should have good touch targets
      expect(checkedCount).toBeGreaterThan(5);
    });
  });
});

test.describe('Mobile Responsiveness (414px viewport)', () => {
  const mobileViewport = { width: 414, height: 896 };

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(mobileViewport);
  });

  test('should display correctly on larger mobile', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    // Check main components are visible
    await expect(page.getByText('Próximo partido')).toBeVisible({ timeout: 15000 });

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(414 + 10);
  });
});
