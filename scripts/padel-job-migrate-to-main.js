#!/usr/bin/env node
/**
 * Migrates Padel Work Cycle job from isolated+agentTurn to main+systemEvent.
 * Workaround for sessions_spawn 1008 "pairing required" (Bug #12210, #6217).
 *
 * Run on EC2: CRON_JOBS_FILE=~/.openclaw/cron/jobs.json node scripts/padel-job-migrate-to-main.js
 */
const fs = require('fs');
const path = process.env.CRON_JOBS_FILE || '/home/ubuntu/.openclaw/cron/jobs.json';

const jobs = JSON.parse(fs.readFileSync(path, 'utf8'));
const padel = jobs.jobs.find(j => j.name && j.name.includes('Padel Work'));

if (!padel) {
  console.error('Padel Work Cycle job not found');
  process.exit(1);
}

// Already migrated?
if (padel.sessionTarget === 'main' && padel.payload?.kind === 'systemEvent') {
  console.log('Job already on main+systemEvent; no change.');
  process.exit(0);
}

// Apply workaround
padel.sessionTarget = 'main';
padel.payload = {
  kind: 'systemEvent',
  text: padel.payload?.message || padel.payload?.text || ''
};
delete padel.payload.message;
delete padel.payload.timeoutSeconds;
padel.updatedAtMs = Date.now();

fs.writeFileSync(path, JSON.stringify(jobs, null, 2), 'utf8');
console.log('Migrated Padel Work Cycle to sessionTarget: main, payload.kind: systemEvent');
console.log('Restart gateway if needed: pkill -f openclaw-gateway (gateway may auto-restart)');
