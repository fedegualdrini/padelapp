#!/usr/bin/env node
/**
 * Prime the bot cursor so it starts processing only future messages.
 * Writes .wacli-bot-state.json with lastProcessedTs = now.
 */

import fs from 'node:fs';
import path from 'node:path';

const statePath = path.resolve(process.cwd(), '.wacli-bot-state.json');
const now = Date.now();
const payload = { lastProcessedTs: now };

fs.writeFileSync(statePath + '.tmp', JSON.stringify(payload, null, 2) + '\n');
fs.renameSync(statePath + '.tmp', statePath);

console.log(`[prime] wrote ${statePath}`);
console.log(`[prime] lastProcessedTs=${now} (${new Date(now).toISOString()})`);
