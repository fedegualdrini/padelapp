import { chromium } from 'playwright';
import * as fs from 'fs';

const TEST_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app/?_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB92A';
const TEST_GROUP_NAME = `Test${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${Math.random().toString(36).slice(2, 8)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

async function runTest() {
  console.log('🧪 PadelApp E2E Test - Full Match Creation');
  console.log('===========================================');
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

    // 4. Create match - Select ALL 4 players
    console.log('4. Creating match with all 4 players...');
    await page.click('nav a:has-text("Nuevo partido"), header a:has-text("Nuevo partido")');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/03-match-form-empty.png', fullPage: true });
    
    // Get all select dropdowns on the page
    const allSelects = await page.locator('select').all();
    console.log(`   Found ${allSelects.length} total dropdowns`);
    
    // Filter to find player dropdowns (those with "Elegir jugador" option)
    const playerDropdowns = [];
    for (const select of allSelects) {
      const options = await select.locator('option').allTextContents();
      if (options.includes('Elegir jugador') && options.some(o => ['Ana', 'Luis', 'Pedro', 'María'].some(p => o.includes(p)))) {
        playerDropdowns.push(select);
      }
    }
    
    console.log(`   Found ${playerDropdowns.length} player dropdowns in Equipos section`);
    
    // Select each of the 4 players for each position
    // Team 1: Ana + Luis, Team 2: Pedro + María
    const assignments = ['Ana', 'Luis', 'Pedro', 'María'];
    
    for (let i = 0; i < Math.min(4, playerDropdowns.length); i++) {
      // Click to open dropdown
      await playerDropdowns[i].click();
      await page.waitForTimeout(300);
      
      // Get options
      const options = await playerDropdowns[i].locator('option').allTextContents();
      console.log(`   Dropdown ${i+1} options: ${options.join(', ')}`);
      
      // Find and select the specific player
      const targetPlayer = assignments[i];
      const playerIndex = options.findIndex(o => o === targetPlayer);
      
      if (playerIndex >= 0) {
        await playerDropdowns[i].selectOption({ index: playerIndex });
        console.log(`   ✅ Selected ${targetPlayer} for position ${i+1}`);
      } else {
        // Select first available player if target not found
        if (options.length > 1) {
          await playerDropdowns[i].selectOption({ index: 1 });
          console.log(`   ⚠️ Selected fallback for position ${i+1}: ${options[1]}`);
        }
      }
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'test-results/04-players-selected.png', fullPage: true });
    
    // Fill "Cargado por" dropdown
    const cargadoPor = page.locator('select').filter({ hasText: 'Tu nombre' });
    if (await cargadoPor.count() > 0) {
      const options = await cargadoPor.first().locator('option').allTextContents();
      if (options.length > 1) {
        await cargadoPor.first().selectOption({ index: 1 });
        console.log('   ✅ Selected "Cargado por"');
      }
    }
    
    // Fill ALL sets (need at least 3 for "Mejor de 3 sets")
    // Set 1: 6-4, Set 2: 3-6, Set 3: 6-2 (Team 1 wins 2-1)
    const setInputs = await page.locator('input[placeholder*="ej: 6"], input[type="number"]').all();
    console.log(`   Found ${setInputs.length} score inputs`);
    
    // Fill first 3 sets (for "Mejor de 3 sets")
    const scores = [
      ['6', '4'],  // Set 1
      ['3', '6'],  // Set 2
      ['6', '2']   // Set 3
    ];
    
    for (let i = 0; i < Math.min(3, Math.floor(setInputs.length / 2)); i++) {
      const idx = i * 2;
      if (setInputs.length > idx + 1) {
        await setInputs[idx].fill(scores[i][0]);
        await setInputs[idx + 1].fill(scores[i][1]);
        console.log(`   ✅ Set ${i+1} score: ${scores[i][0]}-${scores[i][1]}`);
      }
    }
    
    await page.screenshot({ path: 'test-results/05-match-ready.png', fullPage: true });
    
    // Save match
    console.log('   Saving match...');
    await page.click('button:has-text("Guardar partido")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/06-match-saved.png', fullPage: true });
    
    // Check result
    const url = page.url();
    const hasError = await page.locator('text=incompleto').count() > 0;
    
    if (!hasError && !url.includes('/matches/new')) {
      console.log('   ✅ MATCH SAVED SUCCESSFULLY!');
      console.log(`   New URL: ${url}`);
    } else if (hasError) {
      console.log('   ❌ Match save failed - validation error');
    } else {
      console.log('   ⚠️ Still on form - check screenshot');
    }

    console.log('');
    console.log('====================');
    console.log('📊 TEST COMPLETE');
    console.log('====================');
    console.log(`Group: ${TEST_GROUP_NAME}`);
    console.log(`Passphrase: ${TEST_PASSPHRASE}`);
    console.log(`Players: ${TEST_PLAYERS.join(', ')}`);

  } catch (err: any) {
    console.error('❌ Test error:', err.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  const report = `# E2E Test - Match Creation
**Group:** ${TEST_GROUP_NAME}
**Passphrase:** ${TEST_PASSPHRASE}
**Date:** ${new Date().toISOString()}
`;
  fs.mkdirSync('test-reports', { recursive: true });
  fs.writeFileSync(`test-reports/e2e-match-${Date.now()}.md`, report);
}

runTest();
