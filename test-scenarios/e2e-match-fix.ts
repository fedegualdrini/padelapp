import { chromium } from 'playwright';
import * as fs from 'fs';

const TEST_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app/?_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB92A';
const TEST_GROUP_NAME = `Test${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${Math.random().toString(36).slice(2, 8)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

async function runTest() {
  console.log('🧪 PadelApp E2E Test - Correct Player Selection');
  console.log('=================================================');
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
    await page.click('button:has-text("Crear grupo")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/02-group-created.png', fullPage: true });
    console.log('   ✅ Group created');

    // 3. Add 4 players
    console.log('3. Adding 4 players...');
    await page.click('a:has-text("Jugadores")');
    await page.waitForLoadState('networkidle');
    
    for (let i = 0; i < TEST_PLAYERS.length; i++) {
      const nameInput = page.locator('.rounded-2xl:has-text("Invitados") input[type="text"]').first();
      await nameInput.fill(TEST_PLAYERS[i]);
      await page.waitForTimeout(500);
      await page.click('button:has-text("Agregar jugador")');
      await page.waitForTimeout(2000);
      console.log(`   ✅ Player ${i+1} added: ${TEST_PLAYERS[i]}`);
    }
    console.log('   ✅ All 4 players added');

    // 4. Load match - SELECT 4 DIFFERENT PLAYERS
    console.log('4. Loading match with proper player selection...');
    await page.click('a:has-text("Nuevo partido")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/03-match-form.png', fullPage: true });
    
    // Get all selects and identify player dropdowns (skip the "Mejor de" and "Cargado por" ones)
    const allSelects = await page.locator('select').all();
    console.log(`   Found ${allSelects.length} dropdowns total`);
    
    // Player dropdowns are the ones with "Elegir jugador" as first option
    const playerSelects = [];
    for (const select of allSelects) {
      const options = await select.locator('option').allTextContents();
      if (options.includes('Elegir jugador') && options.some(o => TEST_PLAYERS.some(p => o.includes(p)))) {
        playerSelects.push(select);
      }
    }
    console.log(`   Found ${playerSelects.length} player dropdowns`);
    
    // Select each player for a different position
    // Team 1: Ana + Luis, Team 2: Pedro + María
    const playerAssignments = ['Ana', 'Luis', 'Pedro', 'María'];
    
    for (let i = 0; i < Math.min(4, playerSelects.length); i++) {
      const options = await playerSelects[i].locator('option').allTextContents();
      const playerIndex = options.findIndex(o => o.includes(playerAssignments[i]));
      
      if (playerIndex > 0) {
        await playerSelects[i].selectOption({ index: playerIndex });
        console.log(`   ✅ Selected ${playerAssignments[i]} for position ${i+1}`);
      } else {
        // Fallback: select first available player
        await playerSelects[i].selectOption({ index: 1 });
        console.log(`   ⚠️ Selected fallback for position ${i+1}`);
      }
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'test-results/04-players-selected.png', fullPage: true });
    
    // Fill "Cargado por" (Loaded by) - first option
    const cargadoPorSelect = page.locator('select').filter({ hasText: /Tu nombre/ }).first();
    if (await cargadoPorSelect.count() > 0) {
      const options = await cargadoPorSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await cargadoPorSelect.selectOption({ index: 1 });
        console.log('   ✅ Selected "Cargado por"');
      }
    }
    
    // Fill scores
    const scoreInputs = await page.locator('input[type="number"]').all();
    if (scoreInputs.length >= 2) {
      await scoreInputs[0].fill('6');
      await scoreInputs[1].fill('4');
      console.log('   ✅ Scores filled: 6-4');
    }
    
    await page.screenshot({ path: 'test-results/05-match-filled.png', fullPage: true });
    
    // Save match
    console.log('   Saving match...');
    await page.click('button[type="submit"], button:has-text("Guardar")');
    
    // Wait for navigation or success message
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'test-results/06-after-save.png', fullPage: true });
    
    // Check if we're on a different page (success) or still on form (error)
    const currentUrl = page.url();
    const hasError = await page.locator('text=partido está incompleto').count() > 0;
    
    if (!hasError && !currentUrl.includes('/matches/new')) {
      console.log('   ✅ Match saved successfully!');
      console.log(`   New URL: ${currentUrl}`);
    } else if (hasError) {
      console.log('   ❌ Match save failed - form incomplete');
      const errorText = await page.locator('text=partido está incompleto').first().textContent();
      console.log(`   Error: ${errorText}`);
    } else {
      console.log('   ⚠️ Still on form page - checking status...');
    }

    console.log('');
    console.log('====================');
    console.log('📊 TEST COMPLETE');
    console.log('====================');
    console.log(`Group: ${TEST_GROUP_NAME}`);
    console.log(`Passphrase: ${TEST_PASSPHRASE}`);
    console.log(`URL: ${currentUrl}`);

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
`;
  fs.mkdirSync('test-reports', { recursive: true });
  fs.writeFileSync(`test-reports/e2e-match-${Date.now()}.md`, report);
}

runTest();
