#!/usr/bin/env node
/**
 * Ensures Padel Work Cycle job is enabled.
 * Run when runs show status "skipped", error "disabled".
 */
const fs = require('fs');
const path = process.env.CRON_JOBS_FILE || '/home/ubuntu/.openclaw/cron/jobs.json';

const jobs = JSON.parse(fs.readFileSync(path, 'utf8'));
const p = jobs.jobs.find(j => j.name && j.name.includes('Padel Work'));

if (!p) {
  console.error('Padel Work Cycle job not found');
  process.exit(1);
}

const wasEnabled = p.enabled;
p.enabled = true;
p.updatedAtMs = Date.now();

fs.writeFileSync(path, JSON.stringify(jobs, null, 2), 'utf8');
console.log('Padel Work Cycle: enabled = true (was: %s)', wasEnabled);
console.log('Restart gateway if runs still skip: pkill -f openclaw-gateway');
