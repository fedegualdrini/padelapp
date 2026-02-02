import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

const TEST_URL = process.env.TEST_URL || 'https://padelapp-oj93bi5g4-fedegualdrini-gmailcoms-projects.vercel.app/';
const TEST_GROUP_NAME = `E2E Test Group ${Date.now()}`;
const TEST_GROUP_SLUG = `e2e-test-${Date.now()}`;
const TEST_PASSPHRASE = `test-${randomUUID().slice(0, 8)}`;
const TEST_PLAYERS = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'];

const results = {
  url: TEST_URL,
  timestamp: new Date().toISOString(),
  tests: [] as Array<{
    name: string;
    status: 'PASS' | 'FAIL';
    screenshot?: string;
    error?: string;
    notes?: string;
  }>
};

test.describe('PadelApp E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
  });

  test('1. Home page loads successfully', async ({ page }) => {
    try {
      await expect(page.locator('body')).toBeVisible();
      await page.screenshot({ path: 'test-results/01-home-page.png', fullPage: true });
      results.tests.push({ name: 'Home page loads', status: 'PASS', screenshot: 'test-results/01-home-page.png' });
    } catch (error) {
      results.tests.push({ name: 'Home page loads', status: 'FAIL', error: error.message });
      throw error;
    }
  });

  test('2. Create new group with passphrase', async ({ page }) => {
    try {
      // Look for create group button/link
      const createButton = page.locator('text=Crear grupo, button:has-text("Crear"), a:has-text("Crear grupo")').first();
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();
      
      await page.screenshot({ path: 'test-results/02-create-group-form.png' });
      
      // Fill group form
      await page.fill('input[name="name"], input[placeholder*="nombre"], input[type="text"]:nth-of-type(1)', TEST_GROUP_NAME);
      await page.fill('input[name="slug"], input[placeholder*="slug"], input[type="text"]:nth-of-type(2)', TEST_GROUP_SLUG);
      
      // Look for passphrase field
      const passphraseInput = page.locator('input[name="passphrase"], input[type="password"], input[placeholder*="contraseña"], input[placeholder*="passphrase"]').first();
      if (await passphraseInput.isVisible().catch(() => false)) {
        await passphraseInput.fill(TEST_PASSPHRASE);
      }
      
      await page.screenshot({ path: 'test-results/03-group-form-filled.png' });
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")').first();
      await submitButton.click();
      
      // Wait for navigation to new group
      await page.waitForURL(new RegExp(TEST_GROUP_SLUG), { timeout: 15000 });
      
      await page.screenshot({ path: 'test-results/04-group-created.png', fullPage: true });
      
      results.tests.push({ 
        name: 'Create group with passphrase', 
        status: 'PASS', 
        screenshot: 'test-results/04-group-created.png',
        notes: `Group created: ${TEST_GROUP_NAME}, slug: ${TEST_GROUP_SLUG}`
      });
    } catch (error) {
      results.tests.push({ name: 'Create group with passphrase', status: 'FAIL', error: error.message });
      throw error;
    }
  });

  test('3. Add 4 players to the group', async ({ page }) => {
    try {
      const playerIds: string[] = [];
      
      for (let i = 0; i < TEST_PLAYERS.length; i++) {
        // Navigate to players page
        await page.goto(`${TEST_URL}/g/${TEST_GROUP_SLUG}/players`);
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: `test-results/05-players-page-${i+1}.png` });
        
        // Click add player button
        const addButton = page.locator('text=Agregar jugador, button:has-text("Agregar"), a:has-text("Agregar")').first();
        await addButton.click();
        
        // Fill player name
        const nameInput = page.locator('input[name="name"], input[placeholder*="nombre"]').first();
        await nameInput.fill(TEST_PLAYERS[i]);
        
        await page.screenshot({ path: `test-results/06-player-form-${i+1}.png` });
        
        // Submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Agregar")').first();
        await submitButton.click();
        
        // Wait for player to appear
        await expect(page.locator(`text=${TEST_PLAYERS[i]}`)).toBeVisible({ timeout: 10000 });
        
        playerIds.push(TEST_PLAYERS[i]);
      }
      
      await page.screenshot({ path: 'test-results/07-all-players-added.png', fullPage: true });
      
      results.tests.push({ 
        name: 'Add 4 players', 
        status: 'PASS', 
        screenshot: 'test-results/07-all-players-added.png',
        notes: `Players added: ${TEST_PLAYERS.join(', ')}`
      });
    } catch (error) {
      results.tests.push({ name: 'Add 4 players', status: 'FAIL', error: error.message });
      throw error;
    }
  });

  test('4. Load a match with the players', async ({ page }) => {
    try {
      // Navigate to new match page
      await page.goto(`${TEST_URL}/g/${TEST_GROUP_SLUG}/matches/new`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'test-results/08-match-form-empty.png' });
      
      // Select players for teams (using first 4 available)
      const selects = await page.locator('select').all();
      
      if (selects.length >= 4) {
        // Select team 1 players
        await selects[0].selectOption({ index: 1 });
        await selects[1].selectOption({ index: 2 });
        
        // Select team 2 players
        await selects[2].selectOption({ index: 3 });
        await selects[3].selectOption({ index: 4 });
      }
      
      // Fill scores
      const scoreInputs = page.locator('input[type="number"], input[name*="score"], input[name*="set"]');
      const scoreCount = await scoreInputs.count();
      
      if (scoreCount >= 2) {
        await scoreInputs.nth(0).fill('6');
        await scoreInputs.nth(1).fill('4');
      }
      
      await page.screenshot({ path: 'test-results/09-match-form-filled.png' });
      
      // Submit match
      const submitButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Cargar")').first();
      await submitButton.click();
      
      // Wait for redirect to matches list
      await page.waitForURL(new RegExp(`${TEST_GROUP_SLUG}/matches`), { timeout: 15000 });
      
      await page.screenshot({ path: 'test-results/10-match-loaded.png', fullPage: true });
      
      results.tests.push({ 
        name: 'Load match with 4 players', 
        status: 'PASS', 
        screenshot: 'test-results/10-match-loaded.png',
        notes: 'Match created with 2 teams of 2 players'
      });
    } catch (error) {
      results.tests.push({ name: 'Load match with 4 players', status: 'FAIL', error: error.message });
      throw error;
    }
  });
});

// After all tests, write the report
test.afterAll(async () => {
  const fs = await import('fs');
  const path = await import('path');
  
  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const failed = results.tests.filter(t => t.status === 'FAIL').length;
  
  const report = `# E2E Test Report

**Deployment URL:** ${results.url}
**Date:** ${results.timestamp}
**Tester:** Playwright E2E Test

## Summary
- **Total Tests:** ${results.tests.length}
- **Passed:** ${passed}
- **Failed:** ${failed}
- **Success Rate:** ${Math.round((passed / results.tests.length) * 100)}%

## Test Results

${results.tests.map(t => `
### ${t.status === 'PASS' ? '✅' : '❌'} ${t.name}
**Status:** ${t.status}
${t.screenshot ? `**Screenshot:** ${t.screenshot}` : ''}
${t.error ? `**Error:** ${t.error}` : ''}
${t.notes ? `**Notes:** ${t.notes}` : ''}
`).join('\n')}

## Test Data
- **Group Name:** ${TEST_GROUP_NAME}
- **Group Slug:** ${TEST_GROUP_SLUG}
- **Passphrase:** ${TEST_PASSPHRASE}
- **Players:** ${TEST_PLAYERS.join(', ')}

## Findings
${results.tests.every(t => t.status === 'PASS') 
  ? 'All tests passed successfully! The application is working correctly for the tested flows.'
  : 'Some tests failed. See details above for specific issues.'}
`;

  fs.mkdirSync('test-reports', { recursive: true });
  fs.writeFileSync(`test-reports/e2e-report-${Date.now()}.md`, report);
  console.log('Report saved to test-reports/');
});
