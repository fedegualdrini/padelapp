import { test, expect } from '@playwright/test';

test.describe('Calendar', () => {
  // Reproduce negative-offset timezone behavior (es-AR).
  test.use({ timezoneId: 'America/Argentina/Buenos_Aires' });

  test('should navigate months and re-render month-scoped events (demo)', async ({ page }) => {
    // Use demo slug so the calendar works without any Supabase env.
    await page.goto('/g/demo/calendar?year=2025&month=0', { waitUntil: 'domcontentloaded' });

    // Header label should match query params.
    await expect(page.getByRole('heading', { name: /enero 2025/i })).toBeVisible({ timeout: 15000 });

    // Click the anchor event day and verify month-scoped demo event renders.
    await page.getByTestId('calendar-day-2025-01-02').click();
    await expect(page.getByRole('heading', { name: 'Evento demo 2025-01' })).toBeVisible();

    // Close modal.
    await page.getByTestId('calendar-day-modal-backdrop').click({ position: { x: 5, y: 5 } });

    // Navigate to next month and verify both URL and rendered event update.
    await page.getByRole('button', { name: /mes siguiente/i }).click();
    await expect(page).toHaveURL(/\/g\/demo\/calendar\?year=2025&month=1/);
    await expect(page.getByRole('heading', { name: /febrero 2025/i })).toBeVisible();

    // Feb 2, 2025 is Sunday. The modal header weekday should match the grid date.
    await page.getByTestId('calendar-day-2025-02-02').click();
    await expect(page.getByRole('heading', { level: 3 })).toContainText(/domingo/i);
    await expect(page.getByRole('heading', { name: 'Evento demo 2025-02' })).toBeVisible();

    // Feb 3 demo match should also render (regression for missing calendar items).
    await page.getByTestId('calendar-day-modal-backdrop').click({ position: { x: 5, y: 5 } });
    await page.getByTestId('calendar-day-2025-02-03').click();
    await expect(page.getByRole('heading', { level: 3 })).toContainText(/lunes/i);
    await expect(page.getByRole('heading', { name: 'Partidos', exact: true })).toBeVisible();
  });
});
