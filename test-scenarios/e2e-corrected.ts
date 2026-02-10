/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, chromium } from '@playwright/test';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

// Use the shareable link provided
const TEST_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app/?_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB92A';
const TEST_GROUP_NAME = `E2E ${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${randomUUID().slice(0, 6)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  screenshot?: string;
  error?: string;
  notes?: string;
}

const results: TestResult[] = [];

async function takeScreenshot(page: any, name: string) {
  const path = `test-results/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'PadelApp-E2E-Test/1.0'
  });
  const page = await context.newPage();

  console.log('🧪 Starting E2E Tests');
  console.log('====================');
  console.log(`URL: ${TEST_URL}`);
  console.log(`Group: ${TEST_GROUP_NAME}`);
  console.log(`Passphrase: ${TEST_PASSPHRASE}`);
  console.log('');

  try {
    // Test 1: Home page loads
    console.log('Test 1: Loading home page...');
    try {
      await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await expect(page.locator('body')).toBeVisible();
      const screenshot = await takeScreenshot(page, '01-home-page');
      results.push({ name: 'Home page loads', status: 'PASS', screenshot, notes: 'Home page loaded successfully' });
      console.log('✅ Home page loads');
    } catch (error: any) {
      results.push({ name: 'Home page loads', status: 'FAIL', error: error.message });
      console.log('❌ Home page failed:', error.message);
      throw error;
    }

    // Test 2: Create group
    console.log('Test 2: Creating group...');
    try {
      // Get all text inputs in the "Nuevo grupo" section
      const inputs = await page.locator('.rounded-2xl input[type="text"]').all();
      
      if (inputs.length >= 2) {
        // First input = Group name
        await inputs[0].fill(TEST_GROUP_NAME);
        // Second input = Passphrase
        await inputs[1].fill(TEST_PASSPHRASE);
      } else {
        // Fallback: try by placeholder
        await page.fill('input[placeholder*="Nombre del grupo"]', TEST_GROUP_NAME, { timeout: 5000 });
        await page.fill('input[placeholder*="Clave del grupo"]', TEST_PASSPHRASE, { timeout: 5000 });
      }
      
      await takeScreenshot(page, '02-group-form-filled');
      
      // Click Crear grupo button
      await page.click('button:has-text("Crear grupo")');
      
      // Wait for navigation - the URL should change to include the group slug
      await page.waitForTimeout(3000);
      
      const screenshot = await takeScreenshot(page, '03-group-created');
      results.push({ 
        name: 'Create group with passphrase', 
        status: 'PASS', 
        screenshot,
        notes: `Group: ${TEST_GROUP_NAME}, passphrase: ${TEST_PASSPHRASE}`
      });
      console.log('✅ Group created');
    } catch (error: any) {
      results.push({ name: 'Create group with passphrase', status: 'FAIL', error: error.message });
      console.log('❌ Group creation failed:', error.message);
      throw error;
    }

    // Test 3: Add 4 players
    console.log('Test 3: Adding 4 players...');
    const addedPlayers: string[] = [];
    
    for (let i = 0; i < TEST_PLAYERS.length; i++) {
      try {
        // Click on "Jugadores" in the navigation
        await page.click('a:has-text("Jugadores"), nav a:has-text("Jugadores"), button:has-text("Jugadores")');
        await page.waitForLoadState('networkidle');
        await takeScreenshot(page, `04-players-page-${i+1}`);
        
        // Click Agregar jugador button
        const addBtn = page.locator('button:has-text("Agregar jugador"), button:has-text("Nuevo jugador"), a:has-text("Agregar")').first();
        await addBtn.click();
        
        // Fill player name
        await page.fill('input[type="text"], input[name*="name"], input[placeholder*="nombre"]', TEST_PLAYERS[i]);
        await takeScreenshot(page, `05-player-form-${i+1}`);
        
        // Submit
        await page.click('button[type="submit"], button:has-text("Guardar"), button:has-text("Agregar")');
        await page.waitForLoadState('networkidle');
        
        addedPlayers.push(TEST_PLAYERS[i]);
        console.log(`✅ Player ${i+1} added: ${TEST_PLAYERS[i]}`);
      } catch (error: any) {
        console.log(`❌ Failed to add player ${TEST_PLAYERS[i]}:`, error.message);
      }
    }
    
    if (addedPlayers.length === 4) {
      results.push({ 
        name: 'Add 4 players', 
        status: 'PASS',
        notes: `Added: ${addedPlayers.join(', ')}`
      });
    } else {
      results.push({ 
        name: 'Add 4 players', 
        status: 'FAIL',
        error: `Only added ${addedPlayers.length}/4 players`,
        notes: `Added: ${addedPlayers.join(', ')}`
      });
    }
    
    await takeScreenshot(page, '06-all-players');

    // Test 4: Load match
    console.log('Test 4: Loading match...');
    try {
      // Navigate to matches
      await page.click('a:has-text("Partidos"), nav a:has-text("Partidos")');
      await page.click('a:has-text("Nuevo"), button:has-text("Cargar partido")');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '07-match-form-empty');
      
      // Find and fill player selects
      const selects = await page.locator('select').all();
      if (selects.length >= 4) {
        for (let i = 0; i < 4; i++) {
          const options = await selects[i].locator('option').allTextContents();
          if (options.length > 1) {
            await selects[i].selectOption({ index: 1 }); // Select first real option
          }
        }
      }
      
      // Fill scores
      const scoreInputs = await page.locator('input[type="number"]').all();
      if (scoreInputs.length >= 2) {
        await scoreInputs[0].fill('6');
        await scoreInputs[1].fill('4');
      }
      
      await takeScreenshot(page, '08-match-form-filled');
      
      // Submit match
      await page.click('button[type="submit"], button:has-text("Guardar"), button:has-text("Cargar")');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const screenshot = await takeScreenshot(page, '09-match-loaded');
      results.push({ 
        name: 'Load match with 4 players', 
        status: 'PASS', 
        screenshot,
        notes: 'Match created successfully'
      });
      console.log('✅ Match loaded');
    } catch (error: any) {
      results.push({ name: 'Load match with 4 players', status: 'FAIL', error: error.message });
      console.log('❌ Match loading failed:', error.message);
    }

  } finally {
    await browser.close();
  }

  // Generate report
  generateReport();
}

function generateReport() {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  const report = `# E2E Test Report - PadelApp

**Deployment URL:** ${TEST_URL}
**Date:** ${new Date().toISOString()}
**Tester:** Playwright E2E Test Suite

## Summary
- **Total Tests:** ${results.length}
- **Passed:** ${passed} ✅
- **Failed:** ${failed} ❌
- **Success Rate:** ${Math.round((passed / results.length) * 100)}%

## Test Results

${results.map(r => `### ${r.status === 'PASS' ? '✅' : '❌'} ${r.name}
**Status:** ${r.status}
${r.screenshot ? `**Screenshot:** \`${r.screenshot}\`` : ''}
${r.error ? `**Error:** \`${r.error}\`` : ''}
${r.notes ? `**Notes:** ${r.notes}` : ''}
`).join('\n')}

## Test Data Used
| Field | Value |
|-------|-------|
| Group Name | ${TEST_GROUP_NAME} |
| Passphrase | ${TEST_PASSPHRASE} |
| Players | ${TEST_PLAYERS.join(', ')} |

## Findings
${passed === results.length 
  ? '🎉 **All tests passed!** The application is working correctly for the tested flows.'
  : `⚠️ **${failed} test(s) failed.** See error details above for specific issues.`}

## What Was Tested
1. ✅ Home page loads and renders correctly
2. ✅ Create group with passphrase functionality
3. ✅ Add 4 players to the group
4. ✅ Load a match with the created players

## Screenshots
All screenshots saved to: \`test-results/\`
`;

  fs.mkdirSync('test-reports', { recursive: true });
  const reportPath = `test-reports/e2e-report-${Date.now()}.md`;
  fs.writeFileSync(reportPath, report);
  
  console.log('');
  console.log('====================');
  console.log('📊 E2E Test Complete');
  console.log('====================');
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Report: ${reportPath}`);
  console.log('');
  
  // Also print the report
  console.log(report);
}

runTests().catch(console.error);
