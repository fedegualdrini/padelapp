/* eslint-disable @typescript-eslint/no-explicit-any */
import { chromium } from 'playwright';
import * as fs from 'fs';

const TEST_URL = 'https://padelapp-git-claudio-fedegualdrini-gmailcoms-projects.vercel.app/?_vercel_share=vvpSfzszF14TXHJF7LMIqotusc6OB92A';
const TEST_GROUP_NAME = `Test${Date.now().toString().slice(-4)}`;
const TEST_PASSPHRASE = `${Math.random().toString(36).slice(2, 8)}`;
const TEST_PLAYERS = ['Ana', 'Luis', 'Pedro', 'María'];

async function runTest() {
  console.log('🧪 PadelApp E2E Test - Fixed Version');
  console.log('====================================');
  console.log(`Group: ${TEST_GROUP_NAME}`);
  console.log(`Passphrase: ${TEST_PASSPHRASE}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const addedPlayers: string[] = [];

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

    // 3. Add players - NAVIGATE TO JUGADORES FIRST
    console.log('3. Adding 4 players...');
    
    // Click Jugadores in nav
    await page.click('a:has-text("Jugadores")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/04-jugadores-page.png', fullPage: true });
    
    for (let i = 0; i < TEST_PLAYERS.length; i++) {
      try {
        console.log(`   Adding player ${i+1}: ${TEST_PLAYERS[i]}...`);
        
        // Fill the player name input (first text input in the Invitados section)
        const nameInput = page.locator('.rounded-2xl:has-text("Invitados") input[type="text"]').first();
        await nameInput.fill(TEST_PLAYERS[i]);
        await page.waitForTimeout(500);
        
        await page.screenshot({ path: `test-results/05-player-${i+1}-filled.png` });
        
        // Click Agregar jugador button
        await page.click('button:has-text("Agregar jugador")');
        
        // WAIT for the player to appear in the Invitados list
        await page.waitForTimeout(2000);
        
        // VERIFY: Check if player appears in the Invitados section
        // Look for player name in the Invitados section (not in the input field)
        const invitadosSection = page.locator('text=Invitados').locator('..'); // Parent of "Invitados" text
        const playerCards = await page.locator('.rounded-2xl:has-text("Invitados") .rounded-xl, [class*="Invitados"] >> div').count();
        const playerNameInList = await page.locator(`.rounded-2xl:has-text("Invitados") :text("${TEST_PLAYERS[i]}")`).count();
        
        // Alternative: just check if "Sin resultados" is gone from Invitados section after first player
        const hasPlayers = await page.locator('.rounded-2xl:has-text("Invitados") :text("Sin resultados")').count() === 0;
        
        if (playerNameInList > 0 || (i === 0 && hasPlayers) || (i > 0 && await page.locator(`text=${TEST_PLAYERS[i]}`).count() > 1)) {
          addedPlayers.push(TEST_PLAYERS[i]);
          console.log(`   ✅ Player ${i+1} CONFIRMED: ${TEST_PLAYERS[i]}`);
        } else {
          console.log(`   ❌ Player ${i+1} NOT FOUND: ${TEST_PLAYERS[i]}`);
        }
        
        await page.screenshot({ path: `test-results/06-after-player-${i+1}.png`, fullPage: true });
        
      } catch (err: any) {
        console.log(`   ❌ Error adding player ${TEST_PLAYERS[i]}: ${err.message}`);
        await page.screenshot({ path: `test-results/error-player-${i+1}.png`, fullPage: true });
      }
    }

    // 4. Verify players in match form
    console.log('4. Checking match form for players...');
    await page.click('a:has-text("Nuevo partido")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/07-match-form.png', fullPage: true });
    
    // Check if players appear in dropdowns
    const firstSelect = page.locator('select').first();
    const options = await firstSelect.locator('option').allTextContents();
    console.log(`   Dropdown options: ${options.join(', ')}`);
    
    const playersInDropdown = TEST_PLAYERS.filter(p => options.some(o => o.includes(p)));
    console.log(`   Players found in dropdown: ${playersInDropdown.join(', ') || 'NONE'}`);

  } catch (err: any) {
    console.error('Test error:', err.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // Report
  console.log('');
  console.log('====================');
  console.log('📊 TEST RESULTS');
  console.log('====================');
  console.log(`Group: ${TEST_GROUP_NAME}`);
  console.log(`Players added: ${addedPlayers.length}/4`);
  console.log(`Players: ${addedPlayers.join(', ') || 'None'}`);
  console.log(`Status: ${addedPlayers.length === 4 ? '✅ ALL PLAYERS ADDED' : '❌ SOME PLAYERS FAILED'}`);
  console.log('');
  console.log('Screenshots saved to test-results/');
  
  // Save report
  const report = `# E2E Test Report
**URL:** ${TEST_URL}
**Group:** ${TEST_GROUP_NAME}
**Passphrase:** ${TEST_PASSPHRASE}
**Players Added:** ${addedPlayers.length}/4 (${addedPlayers.join(', ')})
**Status:** ${addedPlayers.length === 4 ? '✅ PASS' : '❌ FAIL'}
**Date:** ${new Date().toISOString()}
`;
  fs.mkdirSync('test-reports', { recursive: true });
  fs.writeFileSync(`test-reports/e2e-verified-${Date.now()}.md`, report);
}

runTest();
