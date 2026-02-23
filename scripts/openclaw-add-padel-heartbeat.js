#!/usr/bin/env node
/**
 * Adds heartbeat to padel-orchestrator so main-session cron jobs can run.
 * Main session jobs enqueue system events and wait for heartbeat; without
 * heartbeat, runs are skipped with error "disabled".
 */
const fs = require('fs');
const path = process.env.OPENCLAW_CONFIG || '/home/ubuntu/.openclaw/openclaw.json';

const config = JSON.parse(fs.readFileSync(path, 'utf8'));
const list = config.agents?.list || [];
const padel = list.find(a => a.id === 'padel-orchestrator');

if (!padel) {
  console.error('padel-orchestrator not found in agents.list');
  process.exit(1);
}

if (padel.heartbeat?.every) {
  console.log('padel-orchestrator already has heartbeat:', padel.heartbeat.every);
  process.exit(0);
}

padel.heartbeat = {
  every: '30m',
  target: 'none'  // delivery via cron webhook, not heartbeat
};

fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
console.log('Added heartbeat to padel-orchestrator (every: 30m, target: none)');
console.log('Restart gateway: pkill -f openclaw-gateway');
