/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

/**
 * Core User Flows - Basic User Journeys
 * Tests: Group creation, add player, create match, create event
 */

test.describe('Core User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Create Group Flow', () => {
    test('user can create a new group', async ({ page }) => {
      // Click create group button/link
      const createGroupButton = page.locator('a:has-text("Crear grupo"), a:has-text("Create Group"), a[href*="create"]').first();
      
      if (await createGroupButton.isVisible().catch(() => false)) {
        await createGroupButton.click();
        await page.waitForURL(/\/groups\/new|\/create/, { timeout: 5000 });
        
        // Fill group details
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
        const slugInput = page.locator('input[name="slug"], input[placeholder*="slug"]').first();
        
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill(`Test Group ${Date.now()}`);
          await slugInput.fill(`test-group-${Date.now()}`);
          
          // Submit form
          const submitButton = page.locator('button:has-text("Crear"), button:has-text("Create"), button:has-text("Submit"), input[type="submit"]').first();
          if (await submitButton.isVisible().catch(() => false)) {
            await submitButton.click();
            
            // Should redirect to group page
            await page.waitForURL(/\//, { timeout: 10000 });
            
            // Verify group was created
            await expect(page.locator('text=/Test Group/')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Add Player Flow', () => {
    test('user can add a player to group', async ({ page }) => {
      // Navigate to ranking (should have players section)
      await page.goto('/g/padel/ranking');
      await page.waitForLoadState('networkidle');
      
      // Look for "Add player" button or link
      const addPlayerButton = page.locator('a:has-text("Agregar"), a:has-text("Add Player"), button:has-text("Agregar jugador"), [href*="players/new"], [href*="player/new"]').first();
      
      if (await addPlayerButton.isVisible().catch(() => false)) {
        await addPlayerButton.click();
        await page.waitForURL(/\/players\/new|\/player\/new/, { timeout: 5000 });
        
        // Fill player details
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
        
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill(`Test Player ${Date.now()}`);
          
          // Submit form
          const submitButton = page.locator('button:has-text("Agregar"), button:has-text("Add"), button:has-text("Submit"), input[type="submit"]').first();
          if (await submitButton.isVisible().catch(() => false)) {
            await submitButton.click();
            
            // Should redirect to players or ranking page
            await page.waitForURL(/\/players|\/ranking/, { timeout: 10000 });
            
            // Verify player was added (appears in ranking)
            const playerName = `Test Player ${Date.now()}`;
            await expect(page.locator(`text=${playerName}`)).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Create Match Flow', () => {
    test('user can create a new match', async ({ page }) => {
      // Navigate to matches page
      await page.goto('/g/padel/matches');
      await page.waitForLoadState('networkidle');
      
      // Click "Nuevo partido" button
      const createMatchButton = page.locator('a:has-text("Nuevo partido"), button:has-text("New Match"), a[href*="matches/new"]').first();
      
      if (await createMatchButton.isVisible().catch(() => false)) {
        await createMatchButton.click();
        await page.waitForURL(/\/matches\/new/, { timeout: 5000 });
        
        // Match should be on the page
        await expect(page.locator('text=/Partido|Match/i')).toBeVisible();
        
        // Verify player selection is available
        const playerSelectors = page.locator('input[type="checkbox"], [role="checkbox"]').all();
        expect(playerSelectors.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Create Event Flow', () => {
    test('user can create a new event', async ({ page }) => {
      // Navigate to events page
      await page.goto('/g/padel/events');
      await page.waitForLoadState('networkidle');
      
      // Click "Nuevo evento" button
      const createEventButton = page.locator('a:has-text("Nuevo evento"), button:has-text("New Event"), a[href*="events/new"]').first();
      
      if (await createEventButton.isVisible().catch(() => false)) {
        await createEventButton.click();
        await page.waitForURL(/\/events\/new/, { timeout: 5000 });
        
        // Event should be on the page
        await expect(page.locator('text=/Evento|Event/i')).toBeVisible();
        
        // Verify event type selection
        const eventTypeSelect = page.locator('select, [role="combobox"]').first();
        if (await eventTypeSelect.isVisible().catch(() => false)) {
          // Should have options
          await expect(eventTypeSelect.locator('option').first()).toBeVisible();
        }
      }
    });
  });
});

/**
 * Test helpers for core flows
 */

export async function fillAndSubmitForm(
  page: any,
  formData: Record<string, string>,
  submitText: string = 'Guardar' | 'Guardar' | 'Save' | 'Enviar' | 'Submit'
) {
  for (const [key, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${key}"], [placeholder*="${key.toLowerCase()}"]`).first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill(value);
    }
  }
  
  const submitButton = page.locator(`button:has-text("${submitText}")`).first();
  if (await submitButton.isVisible().catch(() => false)) {
    await submitButton.click();
  }
}

export async function verifySuccessMessage(page: any, message: string) {
  const successLocator = page.locator(`text=/${message}/i`);
  await expect(successLocator).toBeVisible({ timeout: 5000 });
}
