#!/usr/bin/env node
/**
 * Removes gateway.auth from OpenClaw config.
 * Loopback-bound gateways don't need auth; auth can cause "pairing required" (1008)
 * and break sessions_spawn from cron jobs.
 *
 * Run on EC2: node scripts/openclaw-remove-gateway-auth.js
 * Then: openclaw gateway restart (or stop + start)
 */
const fs = require('fs');
const path = process.env.OPENCLAW_CONFIG || '/home/ubuntu/.openclaw/openclaw.json';

const config = JSON.parse(fs.readFileSync(path, 'utf8'));
const gw = config.gateway || (config.gateway = {});

if (gw.auth !== undefined) {
  delete gw.auth;
  fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
  console.log('Removed gateway.auth from', path);
  console.log('Run: openclaw gateway restart');
} else {
  console.log('gateway.auth not present; no change needed');
}
