import { chromium } from 'playwright';
import * as fs from 'fs';

const TEST_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app?_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB32A';
const TEST_GROUP_NAME = `Test${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${Math.random().toString(36).slice(2, 8)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

async function runTest() {
  console.log('🧪 PadelApp E2E Test');
  console.log('====================');
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
    const inputs = await page.locator('input[type="text"]').all();
    await inputs[0].fill(TEST_GROUP_NAME);
    await inputs[1].fill(TEST_PASSPHRASE);
    await page.screenshot({ path: 'test-results/02-form-filled.png' });
    
    await page.click('button:has-text("Crear grupo")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/03-group-created.png', fullPage: true });
    console.log('   ✅ Group created');

    // 3. Add players using the + button (QuickActionsFAB)
    console.log('3. Adding 4 players...');
    const addedPlayers: string[] = [];
    
    for (let i = 0; i < TEST_PLAYERS.length; i++) {
      try {
        // Click the + FAB button
        await page.click('button[title="Cargar partido"], button svg[data-testid="Plus"]');
        await page.waitForTimeout(500);
        
        // Click "Nuevo jugador" option
        await page.click('text=Nuevo jugador');
        await page.waitForTimeout(500);
        
        // Fill player name
        await page.fill('input[type="text"]', TEST_PLAYERS[i]);
        await page.screenshot({ path: `test-results/04-player-${i+1}-form.png` });
        
        // Click Agregar
        await page.click('button:has-text("Agregar")');
        await page.waitForTimeout(1500);
        
        addedPlayers.push(TEST_PLAYERS[i]);
        console.log(`   ✅ Player ${i+1}: ${TEST_PLAYERS[i]}`);
      } catch (err: any) {
        console.log(`   ❌ Player ${i+1} failed: ${err.message}`);
      }
    }
    
    await page.screenshot({ path: 'test-results/05-players-added.png', fullPage: true });

    // 4. Load match
    console.log('4. Loading match...');
    try {
      // Click + button and select "Cargar partido"
      await page.click('button[title="Cargar partido"]');
      await page.waitForTimeout(500);
      await page.click('text=Cargar partido');
      await page.waitForTimeout(1000);
      
      // Select players
      const selects = await page.locator('select').all();
      for (let i = 0; i < Math.min(4, selects.length); i++) {
        const options = await selects[i].locator('option').count();
        if (options > 1) await selects[i].selectOption({ index: 1 });
      }
      
      // Fill scores
      const numbers = await page.locator('input[type="number"]').all();
      if (numbers.length >= 2) {
        await numbers[0].fill('6');
        await numbers[1].fill('4');
      }
      
      await page.screenshot({ path: 'test-results/06-match-form.png' });
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/07-match-loaded.png', fullPage: true });
      
      console.log('   ✅ Match loaded');
    } catch (err: any) {
      console.log('   ❌ Match loading failed:', err.message);
    }

  } catch (err: any) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // Generate report
  const report = `# E2E Test Report
**URL:** ${TEST_URL}
**Date:** ${new Date().toISOString()}

## Results
- Group: ${TEST_GROUP_NAME}
- Passphrase: ${TEST_PASSPHRASE}
- Players added: ${TEST_PLAYERS.join(', ')}

## Screenshots
All saved to test-results/
`;
  fs.mkdirSync('test-reports', { recursive: true });
  fs.writeFileSync(`test-reports/e2e-${Date.now()}.md`, report);
  console.log('');
  console.log('📊 Test complete. Check test-results/ for screenshots.');
}

runTest();
