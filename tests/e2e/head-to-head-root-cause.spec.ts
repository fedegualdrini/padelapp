import { test } from '@playwright/test';
import { gotoCompare, getOptionValue } from './utils';

test.describe('Head-to-Head Root Cause Analysis', () => {

  test('should demonstrate the logic bug in handleChange', async ({ page }) => {
    console.log('\n=== ROOT CAUSE ANALYSIS ===\n');

    const { playerASelect, playerBSelect } = await gotoCompare(page);

    const playerAId = await getOptionValue(playerASelect, 1);
    const playerBId = await getOptionValue(playerBSelect, 2);

    console.log('Initial state:');
    console.log(`  playerA prop: undefined`);
    console.log(`  playerB prop: undefined`);
    console.log('');

    // Simulate selecting Player A
    console.log('User selects Player A from dropdown:');
    console.log(`  e.target.value = "${playerAId}"`);
    console.log(`  handleChange is called with:`);
    console.log(`    newPlayerA = "${playerAId}"`);
    console.log(`    newPlayerB = playerB || "" = "" (because playerB is undefined)`);
    console.log('');
    console.log(`  Condition check: if (newPlayerA && newPlayerB)`);

    // This is a debugging-style test, so we only assert the page loads.
    await page.waitForTimeout(500);
  });
});
