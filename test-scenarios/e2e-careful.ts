import { chromium } from 'playwright';
import * as fs from 'fs';

const TEST_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app/?_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB92A';
const TEST_GROUP_NAME = `Test${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${Math.random().toString(36).slice(2, 8)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

async function runTest() {
  console.log('🧪 PadelApp E2E - Careful Match Test');
  console.log('=====================================');
  console.log(`Group: ${TEST_GROUP_NAME}`);
  console.log(`Passphrase: ${TEST_PASSPHRASE}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    // 1. Home & Create Group
    console.log('1. Creating group...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="Nombre"]', TEST_GROUP_NAME);
    await page.fill('input[placeholder*="Clave"]', TEST_PASSPHRASE);
    await page.click('button:has-text("Crear grupo")');
    await page.waitForTimeout(3000);
    console.log('   ✅ Group created');

    // 2. Add players
    console.log('2. Adding players...');
    await page.click('a:has-text("Jugadores")');
    await page.waitForLoadState('networkidle');
    
    for (const player of TEST_PLAYERS) {
      await page.fill('.rounded-2xl:has-text("Invitados") input[type="text"]', player);
      await page.click('button:has-text("Agregar jugador")');
      await page.waitForTimeout(2000);
      console.log(`   ✅ Added: ${player}`);
    }

    // 3. Go to match form
    console.log('3. Opening match form...');
    await page.click('a:has-text("Nuevo partido")');
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // 4. CAREFULLY select each player
    console.log('4. Selecting players...');
    
    // Find all selects within the Equipos section
    const equiposSection = page.locator('.rounded-2xl:has-text("Equipos")');
    const playerSelects = await equiposSection.locator('select').all();
    console.log(`   Found ${playerSelects.length} selects in Equipos`);
    
    for (let i = 0; i < Math.min(4, playerSelects.length); i++) {
      // Click to open
      await playerSelects[i].click();
      await page.waitForTimeout(500);
      
      // Get options
      const options = await playerSelects[i].locator('option').allTextContents();
      console.log(`   Dropdown ${i+1}: ${options.join(', ')}`);
      
      // Select player by visible text
      const targetPlayer = TEST_PLAYERS[i];
      await playerSelects[i].selectOption(targetPlayer);
      console.log(`   ✅ Selected: ${targetPlayer}`);
      
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'test-results/04-players-selected.png', fullPage: true });

    // 5. Fill Cargado por
    console.log('5. Filling Cargado por...');
    const allSelects = await page.locator('select').all();
    for (const select of allSelects) {
      const firstOption = await select.locator('option').first().textContent() || '';
      if (firstOption.includes('Tu nombre')) {
        await select.selectOption({ index: 1 });
        console.log('   ✅ Selected Cargado por');
        break;
      }
    }

    // 6. Fill ALL sets
    console.log('6. Filling set scores...');
    const allInputs = await page.locator('input[type="number"]').all();
    console.log(`   Found ${allInputs.length} number inputs`);
    
    // Fill 3 sets for "Mejor de 3 sets"
    // Set 1: 6-4, Set 2: 3-6, Set 3: 6-2
    const scores = [
      [6, 4],
      [3, 6], 
      [6, 2]
    ];
    
    for (let setIdx = 0; setIdx < 3; setIdx++) {
      const inputIdx = setIdx * 2;
      if (allInputs.length > inputIdx + 1) {
        await allInputs[inputIdx].fill(scores[setIdx][0].toString());
        await allInputs[inputIdx + 1].fill(scores[setIdx][1].toString());
        console.log(`   ✅ Set ${setIdx + 1}: ${scores[setIdx][0]}-${scores[setIdx][1]}`);
      }
    }
    
    await page.screenshot({ path: 'test-results/05-scores-filled.png', fullPage: true });

    // 7. Save
    console.log('7. Saving match...');
    await page.click('button:has-text("Guardar partido")');
    await page.waitForTimeout(5000);
    
    const finalUrl = page.url();
    await page.screenshot({ path: 'test-results/06-final.png', fullPage: true });
    
    console.log(`   Final URL: ${finalUrl}`);
    
    if (!finalUrl.includes('/new')) {
      console.log('   ✅ MATCH SAVED!');
    } else {
      console.log('   ❌ Still on form page');
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
}

runTest();
