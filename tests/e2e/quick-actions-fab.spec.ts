import { test, expect } from '@playwright/test';

test.describe('Quick Actions FAB', () => {
  test('should be visible on dashboard', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    // Wait for FAB to be visible
    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });
  });

  test('should expand on click', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Click FAB to expand
    await fab.click();

    // Check that secondary actions appear
    const secondaryActions = page.getByRole('link', { name: /cargar nuevo partido/i });
    await expect(secondaryActions).toBeVisible({ timeout: 5000 });

    // Verify other secondary actions
    await expect(page.getByRole('link', { name: /crear nuevo evento/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /agregar nuevo jugador/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ver calendario de eventos/i })).toBeVisible();
  });

  test('should close on click outside', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Expand FAB
    await fab.click();
    await expect(page.getByRole('link', { name: /cargar nuevo partido/i })).toBeVisible();

    // Click outside (click on page heading)
    await page.locator('h1').click();

    // FAB should be closed (secondary actions no longer visible)
    await expect(page.getByRole('link', { name: /cargar nuevo partido/i })).not.toBeVisible();
  });

  test('should close on Escape key', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Expand FAB
    await fab.click();
    await expect(page.getByRole('link', { name: /cargar nuevo partido/i })).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // FAB should be closed
    await expect(page.getByRole('link', { name: /cargar nuevo partido/i })).not.toBeVisible();
  });

  test('should navigate to load match page on secondary action click', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Expand FAB
    await fab.click();

    // Click "Cargar partido"
    await page.getByRole('link', { name: /cargar nuevo partido/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/g\/test-group\/matches\/new/);
  });

  test('should navigate to create event page', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    await fab.click();
    await page.getByRole('link', { name: /crear nuevo evento/i }).click();

    await expect(page).toHaveURL(/\/g\/test-group\/events\/new/);
  });

  test('should navigate to new player page', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    await fab.click();
    await page.getByRole('link', { name: /agregar nuevo jugador/i }).click();

    await expect(page).toHaveURL(/\/g\/test-group\/players\/new/);
  });

  test('should navigate to calendar page', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    await fab.click();
    await page.getByRole('link', { name: /ver calendario de eventos/i }).click();

    await expect(page).toHaveURL(/\/g\/test-group\/calendar/);
  });

  test('should not be visible on join page', async ({ page }) => {
    await page.goto('/g/test-group/join', { waitUntil: 'domcontentloaded' });

    // FAB should not be visible on join page
    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).not.toBeVisible({ timeout: 5000 });
  });

  test('should have correct ARIA attributes', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Check ARIA attributes
    await expect(fab).toHaveAttribute('role', 'button');
    await expect(fab).toHaveAttribute('aria-expanded', 'false');

    // Click and verify aria-expanded changes
    await fab.click();
    await expect(fab).toHaveAttribute('aria-expanded', 'true');

    // Close and verify it changes back
    await page.keyboard.press('Escape');
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Focus FAB
    await fab.focus();

    // Press Enter to expand
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: /cargar nuevo partido/i })).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');

    // Press Space to expand
    await page.keyboard.press(' ');
    await expect(page.getByRole('link', { name: /cargar nuevo partido/i })).toBeVisible();
  });

  test('should show labels for secondary actions', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    await fab.click();

    // Check that labels are visible
    await expect(page.getByText('Cargar partido')).toBeVisible();
    await expect(page.getByText('Crear evento')).toBeVisible();
    await expect(page.getByText('Nuevo jugador')).toBeVisible();
    await expect(page.getByText('Ver calendario')).toBeVisible();
  });

  test('should persist across route changes within protected pages', async ({ page }) => {
    // Start on dashboard
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });
    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Navigate to matches page
    await page.goto('/g/test-group/matches', { waitUntil: 'domcontentloaded' });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Navigate to players page
    await page.goto('/g/test-group/players', { waitUntil: 'domcontentloaded' });
    await expect(fab).toBeVisible({ timeout: 15000 });
  });

  test('should have hover effect', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Hover over FAB
    await fab.hover();

    // Verify tooltip is shown
    await expect(fab).toHaveAttribute('title', 'Cargar partido');
  });

  test('should show X icon when expanded', async ({ page }) => {
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Check that it shows + icon when collapsed (aria-label indicates it opens)
    await expect(fab).toHaveAttribute('aria-label', 'Abrir acciones rápidas');

    // Click to expand
    await fab.click();

    // Check that it shows × icon when expanded (aria-label indicates it closes)
    await expect(fab).toHaveAttribute('aria-label', 'Cerrar acciones rápidas');
  });

  test('should have correct positioning on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/g/test-group', { waitUntil: 'domcontentloaded' });

    const fab = page.getByRole('button', { name: /abrir acciones rápidas/i });
    await expect(fab).toBeVisible({ timeout: 15000 });

    // Check that FAB is positioned at bottom-right
    const box = await fab.boundingBox();
    const viewportSize = page.viewportSize();
    expect(box).toBeTruthy();
    if (box && viewportSize) {
      expect(box.y).toBeGreaterThan(viewportSize.height - 100); // Bottom area
      expect(box.x).toBeGreaterThan(viewportSize.width - 100); // Right area
    }
  });
});
