/* eslint-disable @typescript-eslint/no-explicit-any */
import { chromium } from 'playwright';
import * as fs from 'fs';

const TEST_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app/?_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB92A';
const TEST_GROUP_NAME = `Test${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${Math.random().toString(36).slice(2, 8)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

async function runTest() {
  console.log('🧪 PadelApp E2E - Working Match Test');
  console.log('=====================================');
  console.log(`Group: ${TEST_GROUP_NAME}`);
  console.log(`Passphrase: ${TEST_PASSPHRASE}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    // 1. Home page
    console.log('1. Loading home page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/01-home.png' });
    console.log('   ✅ Home page loaded');

    // 2. Create group
    console.log('2. Creating group...');
    await page.fill('input[placeholder*="Nombre"]', TEST_GROUP_NAME);
    await page.fill('input[placeholder*="Clave"]', TEST_PASSPHRASE);
    await page.click('button:has-text("Crear grupo")');
    await page.waitForTimeout(3000);
    console.log('   ✅ Group created');

    // 3. Add 4 players
    console.log('3. Adding players...');
    await page.click('a:has-text("Jugadores")');
    await page.waitForLoadState('networkidle');
    
    for (const player of TEST_PLAYERS) {
      await page.fill('.rounded-2xl:has-text("Invitados") input[type="text"]', player);
      await page.click('button:has-text("Agregar jugador")');
      await page.waitForTimeout(2000);
      console.log(`   ✅ Added: ${player}`);
    }

    // 4. Create match - MANUAL APPROACH
    console.log('4. Creating match...');
    await page.goto(`${TEST_URL}/g/${TEST_GROUP_NAME.toLowerCase()}/matches/new`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/04-match-form.png', fullPage: true });
    
    // Get all selects and work with them directly
    const selects = await page.locator('select').all();
    console.log(`   Found ${selects.length} selects`);
    
    // Select players by index in each dropdown
    // Skip first select (Mejor de 3/5 sets), then fill 4 player slots
    for (let i = 1; i <= 4 && i < selects.length; i++) {
      const options = await selects[i].locator('option').allTextContents();
      console.log(`   Select ${i}: ${options.slice(0, 3).join(', ')}...`);
      
      // Select index 1 (first player after "Elegir jugador")
      if (options.length > 1) {
        await selects[i].selectOption({ index: 1 });
        console.log(`   ✅ Selected: ${options[1]}`);
      }
    }
    
    // Select "Cargado por" (should be select index 5 if it exists)
    if (selects.length > 5) {
      const opts = await selects[5].locator('option').allTextContents();
      if (opts.length > 1) {
        await selects[5].selectOption({ index: 1 });
        console.log('   ✅ Selected Cargado por');
      }
    }
    
    await page.screenshot({ path: 'test-results/05-players-selected.png', fullPage: true });
    
    // Fill all 3 sets
    const inputs = await page.locator('input[type="number"]').all();
    console.log(`   Found ${inputs.length} number inputs`);
    
    // Set scores: 6-4, 3-6, 6-2 (Team 1 wins 2-1)
    const scores = [6, 4, 3, 6, 6, 2];
    for (let i = 0; i < Math.min(scores.length, inputs.length); i++) {
      await inputs[i].fill(scores[i].toString());
    }
    console.log('   ✅ Filled 3 sets: 6-4, 3-6, 6-2');
    
    await page.screenshot({ path: 'test-results/06-scores-filled.png', fullPage: true });
    
    // Save
    console.log('   Saving...');
    await page.click('button:has-text("Guardar partido")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/07-result.png', fullPage: true });
    
    // Check
    const url = page.url();
    console.log(`   Final URL: ${url}`);
    
    if (url.includes('/matches/') && !url.includes('/new')) {
      console.log('   ✅ MATCH SAVED SUCCESSFULLY!');
    } else {
      console.log('   ❌ Still on form or error');
    }

  } catch (err: any) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'test-results/error.png' });
  } finally {
    await browser.close();
  }

  console.log('');
  console.log('====================');
  console.log(`Group: ${TEST_GROUP_NAME}`);
  console.log(`Passphrase: ${TEST_PASSPHRASE}`);
  console.log('====================');
  
  fs.writeFileSync(`test-reports/e2e-${Date.now()}.md`, `# E2E\nGroup: ${TEST_GROUP_NAME}\nPass: ${TEST_PASSPHRASE}`);
}

runTest();
