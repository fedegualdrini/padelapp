#!/usr/bin/env node
/**
 * wacli-map-participants.mjs
 *
 * One-time mapper: WhatsApp group participants -> padelapp players.
 *
 * Reads participants from:
 *   wacli groups info --jid <groupJid> --json
 *
 * Writes (upserts):
 *  - whatsapp_identities (group_id, phone_e164) -> player_id
 *  - whatsapp_sender_identities (group_id, sender_jid) -> player_id
 *
 * Inputs:
 *  - BOT_DATABASE_URL (Postgres connection string)
 *  - .wacli-bot.json (for groupJid + padelGroupId)
 *  - mapping JSON (see below)
 *
 * Mapping JSON format (either via --mapping-file or --mapping-json):
 * {
 *   "+5491135020854": "Fede",
 *   "+5491140761591": "Leo"
 * }
 *
 * Usage:
 *   # Dry-run (prints plan)
 *   BOT_DATABASE_URL=... node scripts/wacli-map-participants.mjs \
 *     --mapping-json '{"+5491135020854":"Fede"}'
 *
 *   # Apply changes
 *   BOT_DATABASE_URL=... node scripts/wacli-map-participants.mjs \
 *     --mapping-file /path/to/mapping.json --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

const { Client } = pg;

function die(msg) {
  console.error(`\n[wacli-map] ${msg}\n`);
  process.exit(1);
}

function readJsonFile(p) {
  if (!fs.existsSync(p)) die(`File not found: ${p}`);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    die(`Invalid JSON in file: ${p}`);
  }
}

function loadCfg() {
  const p = path.resolve(process.cwd(), '.wacli-bot.json');
  if (!fs.existsSync(p)) die('Missing .wacli-bot.json');
  return readJsonFile(p);
}

function digits(s) {
  return String(s || '').replace(/\D/g, '');
}

function toE164FromWaPhoneJid(phoneJid) {
  // e.g. 5491135020854@s.whatsapp.net -> +5491135020854
  const d = digits(phoneJid);
  return d ? `+${d}` : null;
}

function normalizeSenderJid(senderJid) {
  // Normalize "2757...:44@lid" -> "2757...@lid"
  return String(senderJid || '').replace(/:(\d+)@lid$/, '@lid');
}

function runJson(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) die(`${cmd} ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  try {
    return JSON.parse(r.stdout);
  } catch {
    die(`Failed to parse JSON from ${cmd} ${args.join(' ')}`);
  }
}

function parseArgs(argv) {
  const out = {
    apply: false,
    mappingFile: null,
    mappingJson: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') out.apply = true;
    else if (a === '--mapping-file') out.mappingFile = argv[++i];
    else if (a === '--mapping-json') out.mappingJson = argv[++i];
    else if (a === '-h' || a === '--help') out.help = true;
    else die(`Unknown arg: ${a}`);
  }

  return out;
}

function printHelp() {
  console.log(`\nUsage:\n  node scripts/wacli-map-participants.mjs --mapping-file mapping.json [--apply]\n  node scripts/wacli-map-participants.mjs --mapping-json '{"+549...":"Name"}' [--apply]\n\nNotes:\n- Default mode is dry-run (prints planned changes).\n- Add --apply to write to DB.\n`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const cfg = loadCfg();
  const databaseUrl = process.env.BOT_DATABASE_URL;
  if (!databaseUrl) die('Missing BOT_DATABASE_URL');

  const groupJid = cfg.groupJid;
  const groupId = cfg.padelGroupId;
  if (!groupJid || !groupId) die('Missing groupJid/padelGroupId in .wacli-bot.json');

  let mapping = null;
  if (args.mappingFile) mapping = readJsonFile(path.resolve(process.cwd(), args.mappingFile));
  else if (args.mappingJson) {
    try {
      mapping = JSON.parse(args.mappingJson);
    } catch {
      die('Invalid JSON passed to --mapping-json');
    }
  } else {
    die('Missing mapping input. Provide --mapping-file or --mapping-json');
  }

  // normalize mapping keys/values
  const phoneToName = new Map();
  for (const [k, v] of Object.entries(mapping)) {
    const phone = k.startsWith('+') ? k : `+${digits(k)}`;
    const name = String(v || '').trim();
    if (!phone || phone === '+') die(`Invalid phone key: ${k}`);
    if (!name) die(`Missing player name for phone: ${k}`);
    phoneToName.set(phone, name);
  }

  const info = runJson('wacli', ['groups', 'info', '--jid', groupJid, '--json']);
  const participants = info?.data?.Participants || [];
  if (!participants.length) die('No participants returned (are you authenticated?)');

  const participantRows = participants
    .map((p) => {
      const lid = normalizeSenderJid(p.LID || p.JID);
      const phoneE164 = toE164FromWaPhoneJid(p.PhoneNumber);
      return {
        lid,
        phoneE164,
        isAdmin: !!p.IsAdmin,
      };
    })
    .filter((p) => p.lid && p.phoneE164);

  const db = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await db.connect();

  const { rows: players } = await db.query('select id, name from players where group_id=$1', [groupId]);
  const byName = new Map(players.map((p) => [p.name.toLowerCase(), p]));

  const planned = [];
  for (const pr of participantRows) {
    const playerName = phoneToName.get(pr.phoneE164);
    if (!playerName) continue; // not mapped by user

    const player = byName.get(playerName.toLowerCase());
    if (!player) die(`Player not found in DB: ${playerName} (from phone ${pr.phoneE164})`);

    planned.push({
      phoneE164: pr.phoneE164,
      senderJid: pr.lid,
      playerId: player.id,
      playerName: player.name,
      isAdmin: pr.isAdmin,
    });
  }

  console.log('\n[wacli-map] Planned mappings (from group participants):');
  planned.forEach((x) => {
    console.log(`- ${x.phoneE164} / ${x.senderJid} -> ${x.playerName}`);
  });

  const unmappedPhones = [...participantRows]
    .map((p) => p.phoneE164)
    .filter((ph) => !phoneToName.has(ph));
  if (unmappedPhones.length) {
    console.log('\n[wacli-map] Participants without mapping provided (skipped):');
    unmappedPhones.forEach((p) => console.log(`- ${p}`));
  }

  if (!args.apply) {
    console.log('\n[wacli-map] Dry-run only. Re-run with --apply to write changes.');
    await db.end();
    return;
  }

  // Apply: upsert phone + sender mappings
  for (const x of planned) {
    await db.query(
      `insert into whatsapp_identities (group_id, player_id, phone_e164)
       values ($1,$2,$3)
       on conflict (group_id, phone_e164)
       do update set player_id = excluded.player_id, updated_at = now()`,
      [groupId, x.playerId, x.phoneE164]
    );

    // unique(group_id, player_id) exists; upsert by player_id so we can rebind sender_jid if needed.
    await db.query(
      `insert into whatsapp_sender_identities (group_id, player_id, sender_jid)
       values ($1,$2,$3)
       on conflict (group_id, player_id)
       do update set sender_jid = excluded.sender_jid, updated_at = now()`,
      [groupId, x.playerId, x.senderJid]
    );
  }

  console.log(`\n[wacli-map] Applied ${planned.length} mappings.`);

  await db.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
