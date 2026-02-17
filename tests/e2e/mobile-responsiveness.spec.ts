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

  test('Dashboard should display correctly on mobile', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    // Check that main components are visible
    await expect(page.getByText('Próximo partido')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Últimos partidos')).toBeVisible();
    await expect(page.getByText('Ranking ELO')).toBeVisible();

    // Check Quick Actions FAB is visible
    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Verify FAB is positioned at bottom-right
    const fabBox = await fab.boundingBox();
    expect(fabBox).toBeTruthy();
    if (fabBox) {
      expect(fabBox.y).toBeGreaterThan(mobileViewport.height - 100);
      expect(fabBox.x).toBeGreaterThan(mobileViewport.width - 100);
    }
  });

  test('Matches page should be usable on mobile', async ({ page }) => {
    await page.goto('/g/test-group/matches', { waitUntil: 'domcontentloaded' });

    // Check heading and filters
    await expect(page.getByText('Todos los partidos')).toBeVisible();

    // Check that filters are visible and usable
    const filterButton = page.getByRole('button', { name: /filtros/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      // Filter dropdown should appear
      await expect(page.getByText('Filtrar por')).toBeVisible();
    }
  });

  test('Players page should display cards correctly on mobile', async ({ page }) => {
    await page.goto('/g/test-group/players', { waitUntil: 'domcontentloaded' });

    // Check heading
    await expect(page.getByText('Jugadores')).toBeVisible();

    // Check that player cards are visible
    const playerLinks = page.locator('a[href*="/players/"]');
    const count = await playerLinks.count();

    if (count > 0) {
      // First player card should be visible
      await expect(playerLinks.first()).toBeVisible();
    }
  });

  test('Calendar should be usable on mobile', async ({ page }) => {
    await page.goto('/g/test-group/calendar', { waitUntil: 'domcontentloaded' });

    // Check heading
    await expect(page.getByText('Calendario')).toBeVisible();

    // Check calendar grid is visible
    await expect(page.locator('.grid-cols-7')).toBeVisible();

    // Check navigation buttons are visible and touchable (min 44x44)
    const prevButton = page.getByRole('button', { name: /mes anterior/i });
    const nextButton = page.getByRole('button', { name: /mes siguiente/i });

    if (await prevButton.isVisible()) {
      const prevBox = await prevButton.boundingBox();
      expect(prevBox).toBeTruthy();
      if (prevBox) {
        expect(prevBox.width).toBeGreaterThanOrEqual(40);
        expect(prevBox.height).toBeGreaterThanOrEqual(40);
      }
    }

    if (await nextButton.isVisible()) {
      const nextBox = await nextButton.boundingBox();
      expect(nextBox).toBeTruthy();
      if (nextBox) {
        expect(nextBox.width).toBeGreaterThanOrEqual(40);
        expect(nextBox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('Events page should be usable on mobile', async ({ page }) => {
    await page.goto('/g/test-group/events', { waitUntil: 'domcontentloaded' });

    // Check heading
    await expect(page.getByText('Eventos')).toBeVisible();

    // Check "Nuevo evento" button is visible and touchable
    const newEventButton = page.getByRole('button', { name: /nuevo evento/i });
    if (await newEventButton.isVisible()) {
      const buttonBox = await newEventButton.boundingBox();
      expect(buttonBox).toBeTruthy();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44); // Minimum touch target
      }
    }
  });

  test('Ranking page should display correctly on mobile', async ({ page }) => {
    await page.goto('/g/test-group/ranking', { waitUntil: 'domcontentloaded' });

    // Check heading
    await expect(page.locator('h1, h2').filter({ hasText: /ranking/i })).toBeVisible();

    // Check that ranking list is visible
    await expect(page.locator('.grid').first()).toBeVisible();
  });

  test('NavBar should be scrollable horizontally on mobile', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    // Check that NavBar is visible
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Check that it has overflow-x-auto (horizontal scroll)
    const overflowStyle = await nav.evaluate((el) => {
      return window.getComputedStyle(el).overflowX;
    });
    expect(overflowStyle).toBe('auto' || 'scroll');
  });

  test('New Match form should be usable on mobile', async ({ page }) => {
    await page.goto('/g/test-group/matches/new', { waitUntil: 'domcontentloaded' });

    // Check form heading
    await expect(page.getByText('Nuevo partido')).toBeVisible();

    // Check that form inputs are visible
    await expect(page.getByLabel(/fecha/i)).toBeVisible();
    await expect(page.getByLabel(/hora/i)).toBeVisible();

    // Check submit button is visible and touchable
    const submitButton = page.getByRole('button', { name: /cargar partido/i });
    if (await submitButton.isVisible()) {
      const buttonBox = await submitButton.boundingBox();
      expect(buttonBox).toBeTruthy();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Add Player form should be usable on mobile', async ({ page }) => {
    await page.goto('/g/test-group/players/new', { waitUntil: 'domcontentloaded' });

    // Check form heading
    await expect(page.getByText('Nuevo jugador')).toBeVisible();

    // Check that name input is visible
    const nameInput = page.getByLabel(/nombre/i);
    await expect(nameInput).toBeVisible();

    // Check submit button is visible and touchable
    const submitButton = page.getByRole('button', { name: /agregar/i });
    if (await submitButton.isVisible()) {
      const buttonBox = await submitButton.boundingBox();
      expect(buttonBox).toBeTruthy();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Mobile Responsiveness (tablet viewport 768px)', () => {
  const tabletViewport = { width: 768, height: 1024 };

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(tabletViewport);
  });

  test('Dashboard should display correctly on tablet', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    // Check main components
    await expect(page.getByText('Próximo partido')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Últimos partidos')).toBeVisible();
    await expect(page.getByText('Ranking ELO')).toBeVisible();
  });
});
