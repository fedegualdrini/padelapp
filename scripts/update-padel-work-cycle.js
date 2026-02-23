#!/usr/bin/env node
/**
 * Updates the Padel Work Cycle job payload in jobs.json
 */
const fs = require('fs');
const path = require('path');

const JOBS_FILE = process.env.CRON_JOBS_FILE || '/home/ubuntu/.openclaw/cron/jobs.json';
const PROMPT_FILE = path.join(__dirname, 'padel-work-cycle-prompt.txt');

const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
const newMessage = fs.readFileSync(PROMPT_FILE, 'utf8');

const padelJob = jobs.jobs.find(j => j.name && j.name.includes('Padel Work Cycle'));
if (!padelJob) {
  console.error('Padel Work Cycle job not found');
  process.exit(1);
}

// systemEvent uses .text; agentTurn uses .message
if (padelJob.payload.kind === 'systemEvent') {
  padelJob.payload.text = newMessage;
} else {
  padelJob.payload.message = newMessage;
}
padelJob.updatedAtMs = Date.now();

fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf8');
console.log('Updated Padel Work Cycle job payload');
process.exit(0);
