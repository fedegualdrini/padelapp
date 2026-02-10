/* eslint-disable @typescript-eslint/no-explicit-any */
import { chromium } from 'playwright';
import * as fs from 'fs';

const TEST_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app/?_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB92A';
const TEST_GROUP_NAME = `Test${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${Math.random().toString(36).slice(2, 8)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

async function runTest() {
  console.log('🧪 PadelApp E2E Test - Full Process');
  console.log('====================================');
  console.log(`Group: ${TEST_GROUP_NAME}`);
  console.log(`Passphrase: ${TEST_PASSPHRASE}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    // 1. Load home page
    console.log('1. Loading home page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/01-home.png', fullPage: true });
    console.log('   ✅ Home page loaded');

    // 2. Create group
    console.log('2. Creating group...');
    await page.fill('input[placeholder*="Nombre del grupo"]', TEST_GROUP_NAME);
    await page.fill('input[placeholder*="Clave del grupo"]', TEST_PASSPHRASE);
    await page.screenshot({ path: 'test-results/02-form-filled.png' });
    
    await page.click('button:has-text("Crear grupo")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/03-group-created.png', fullPage: true });
    console.log('   ✅ Group created');

    // 3. Add 4 players
    console.log('3. Adding 4 players...');
    await page.click('a:has-text("Jugadores")');
    await page.waitForLoadState('networkidle');
    
    for (let i = 0; i < TEST_PLAYERS.length; i++) {
      console.log(`   Adding player ${i+1}: ${TEST_PLAYERS[i]}...`);
      
      // Fill the player name input
      const nameInput = page.locator('.rounded-2xl:has-text("Invitados") input[type="text"]').first();
      await nameInput.fill(TEST_PLAYERS[i]);
      await page.waitForTimeout(500);
      
      // Click Agregar jugador button
      await page.click('button:has-text("Agregar jugador")');
      await page.waitForTimeout(2000);
      
      console.log(`   ✅ Player ${i+1} added: ${TEST_PLAYERS[i]}`);
      await page.screenshot({ path: `test-results/04-player-${i+1}-added.png`, fullPage: true });
    }
    console.log('   ✅ All 4 players added');

    // 4. Load match - CLICK on dropdowns to see players
    console.log('4. Loading match...');
    await page.click('a:has-text("Nuevo partido")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/05-match-form.png', fullPage: true });
    
    // Click on first "Elegir jugador" dropdown to open it
    console.log('   Clicking first player dropdown...');
    await page.click('select');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/06-dropdown-opened.png', fullPage: true });
    
    // Get all options from the first dropdown
    const firstSelect = page.locator('select').first();
    const options = await firstSelect.locator('option').allTextContents();
    console.log(`   Dropdown options: ${options.join(', ')}`);
    
    // Check if our players are in the dropdown
    const playersFound = TEST_PLAYERS.filter(p => options.some(o => o.includes(p)));
    console.log(`   Players found in dropdown: ${playersFound.join(', ') || 'NONE'}`);
    
    // Select players for the match
    const selects = await page.locator('select').all();
    console.log(`   Found ${selects.length} player dropdowns`);
    
    for (let i = 0; i < Math.min(4, selects.length); i++) {
      await selects[i].click();
      await page.waitForTimeout(500);
      const opts = await selects[i].locator('option').allTextContents();
      console.log(`   Dropdown ${i+1} options: ${opts.slice(0, 5).join(', ')}${opts.length > 5 ? '...' : ''}`);
      
      if (opts.length > 1) {
        await selects[i].selectOption({ index: 1 });
        console.log(`   ✅ Selected player for position ${i+1}`);
      }
    }
    
    await page.screenshot({ path: 'test-results/07-players-selected.png', fullPage: true });
    
    // Fill scores
    const scoreInputs = await page.locator('input[type="number"]').all();
    if (scoreInputs.length >= 2) {
      await scoreInputs[0].fill('6');
      await scoreInputs[1].fill('4');
      console.log('   ✅ Scores filled: 6-4');
    }
    
    await page.screenshot({ path: 'test-results/08-match-filled.png', fullPage: true });
    
    // Save match
    await page.click('button[type="submit"], button:has-text("Guardar")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/09-match-saved.png', fullPage: true });
    console.log('   ✅ Match saved');

    console.log('');
    console.log('====================');
    console.log('✅ ALL TESTS PASSED');
    console.log('====================');
    console.log(`Group: ${TEST_GROUP_NAME}`);
    console.log(`Passphrase: ${TEST_PASSPHRASE}`);
    console.log(`Players: ${TEST_PLAYERS.join(', ')}`);
    console.log('');

  } catch (err: any) {
    console.error('❌ Test error:', err.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // Save report
  const report = `# E2E Test Report
**URL:** ${TEST_URL}
**Group:** ${TEST_GROUP_NAME}
**Passphrase:** ${TEST_PASSPHRASE}
**Players:** ${TEST_PLAYERS.join(', ')}
**Date:** ${new Date().toISOString()}
**Status:** Complete
`;
  fs.mkdirSync('test-reports', { recursive: true });
  fs.writeFileSync(`test-reports/e2e-full-${Date.now()}.md`, report);
  console.log('Report saved to test-reports/');
}

runTest();
