/* eslint-disable @typescript-eslint/no-explicit-any */
import { chromium } from 'playwright';
import * as fs from 'fs';

const BASE_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app';
const SHARE_TOKEN = '_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB92A';
const TEST_URL = `${BASE_URL}/?${SHARE_TOKEN}`;

const TEST_GROUP_NAME = `Test${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${Math.random().toString(36).slice(2, 8)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

async function runTest() {
  console.log('🧪 PadelApp E2E - Complete Match Test');
  console.log('======================================');
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
    
    // Get the current URL to extract the group slug
    const groupUrl = page.url();
    console.log(`   Group URL: ${groupUrl}`);
    console.log('   ✅ Group created');

    // 3. Add 4 players
    console.log('3. Adding players...');
    await page.click('a:has-text("Jugadores")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/02-jugadores.png' });
    
    for (const player of TEST_PLAYERS) {
      await page.fill('.rounded-2xl:has-text("Invitados") input[type="text"]', player);
      await page.click('button:has-text("Agregar jugador")');
      await page.waitForTimeout(2000);
      console.log(`   ✅ Added: ${player}`);
    }
    
    await page.screenshot({ path: 'test-results/03-players-added.png', fullPage: true });

    // 4. Navigate to match form via UI
    console.log('4. Navigating to match form...');
    await page.click('a:has-text("Nuevo partido")');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/04-match-form.png', fullPage: true });
    console.log(`   Current URL: ${page.url()}`);

    // 5. Fill match form
    console.log('5. Filling match form...');
    
    // Get all selects
    const selects = await page.locator('select').all();
    console.log(`   Found ${selects.length} selects`);
    
    // Log all options for debugging
    for (let i = 0; i < Math.min(selects.length, 8); i++) {
      const opts = await selects[i].locator('option').allTextContents();
      console.log(`   Select ${i}: ${opts.slice(0, 4).join(', ')}${opts.length > 4 ? '...' : ''}`);
    }
    
    // Select players - find the 4 player dropdowns
    // They should have "Elegir jugador" as first option
    let playerSelectCount = 0;
    for (const select of selects) {
      const opts = await select.locator('option').allTextContents();
      if (opts.includes('Elegir jugador') && opts.some(o => TEST_PLAYERS.includes(o))) {
        // This is a player dropdown
        const playerToSelect = TEST_PLAYERS[playerSelectCount % 4];
        const idx = opts.indexOf(playerToSelect);
        if (idx >= 0) {
          await select.selectOption({ index: idx });
          console.log(`   ✅ Selected ${playerToSelect}`);
          playerSelectCount++;
        }
      }
    }
    
    // Select "Cargado por" if present
    for (const select of selects) {
      const opts = await select.locator('option').allTextContents();
      if (opts.includes('Tu nombre') && opts.length > 1) {
        await select.selectOption({ index: 1 });
        console.log('   ✅ Selected Cargado por');
        break;
      }
    }
    
    await page.screenshot({ path: 'test-results/05-players-selected.png', fullPage: true });

    // 6. Fill scores
    console.log('6. Filling scores...');
    const inputs = await page.locator('input[type="number"]').all();
    console.log(`   Found ${inputs.length} number inputs`);
    
    // Fill 3 sets: 6-4, 6-3, 6-2
    const scores = [6, 4, 6, 3, 6, 2];
    for (let i = 0; i < Math.min(scores.length, inputs.length); i++) {
      await inputs[i].fill(scores[i].toString());
    }
    console.log('   ✅ Filled 3 sets');
    
    await page.screenshot({ path: 'test-results/06-match-ready.png', fullPage: true });

    // 7. Save match
    console.log('7. Saving match...');
    const saveButton = page.locator('button:has-text("Guardar partido")');
    
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'test-results/07-result.png', fullPage: true });
      
      const finalUrl = page.url();
      console.log(`   Final URL: ${finalUrl}`);
      
      if (finalUrl.includes('/matches/') && !finalUrl.includes('/new')) {
        console.log('   ✅ MATCH SAVED SUCCESSFULLY!');
      } else {
        console.log('   ❌ Match not saved - check validation errors');
      }
    } else {
      console.log('   ❌ Save button not found');
    }

  } catch (err: any) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
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
