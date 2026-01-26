#!/usr/bin/env node
/**
 * WhatsApp Thursday Attendance Bot (wacli-based)
 *
 * Implements the plan in docs/WHATSAPP_THURSDAY_ATTENDANCE_BOT_PLAN.md.
 *
 * NOTE: This script is a starting point. It expects:
 * - wacli installed and authenticated
 * - a local config file (gitignored): .wacli-bot.json
 * - a DB connection string in BOT_DATABASE_URL (service access)
 *
 * Safety:
 * - Only processes messages from the configured groupJid.
 * - Ignores all commands until admin runs !jueves for the active occurrence.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import pg from 'pg';

const { Client } = pg;

function die(msg) {
  console.error(`\n[wacli-bot] ${msg}\n`);
  process.exit(1);
}

function loadConfig() {
  const p = path.resolve(process.cwd(), '.wacli-bot.json');
  if (!fs.existsSync(p)) {
    die('Missing .wacli-bot.json (gitignored). Create it with {groupJid,padelGroupId,adminPhone}.');
  }
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function normalizeCmd(text) {
  return String(text || '').trim().toLowerCase();
}

function nextThursdayAt20UTCish() {
  // NOTE: App/group likely uses a local timezone. For MVP, store a UTC timestamptz computed from server time.
  // TODO: add group timezone support.
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 20, 0, 0));
  // move to next Thursday
  const day = d.getUTCDay(); // 0..6
  const target = 4;
  let delta = (target - day + 7) % 7;
  if (delta === 0) delta = 7;
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

async function ensureWeeklyEvent(client, groupId) {
  const { rows } = await client.query(
    `select id, active_occurrence_id from weekly_events where group_id = $1 and is_active = true order by created_at asc limit 1`,
    [groupId]
  );
  if (rows[0]) return rows[0];

  const insert = await client.query(
    `insert into weekly_events (group_id) values ($1) returning id, active_occurrence_id`,
    [groupId]
  );
  return insert.rows[0];
}

async function ensureOccurrence(client, weeklyEventId, groupId, startsAt) {
  const { rows } = await client.query(
    `select id, status from event_occurrences where weekly_event_id = $1 and starts_at = $2 limit 1`,
    [weeklyEventId, startsAt]
  );
  if (rows[0]) return rows[0];

  const ins = await client.query(
    `insert into event_occurrences (weekly_event_id, group_id, starts_at) values ($1,$2,$3) returning id, status`,
    [weeklyEventId, groupId, startsAt]
  );
  return ins.rows[0];
}

async function setActiveOccurrence(client, weeklyEventId, occurrenceId) {
  await client.query(`update weekly_events set active_occurrence_id = $1, updated_at = now() where id = $2`, [occurrenceId, weeklyEventId]);
}

async function getActiveOccurrence(client, weeklyEventId) {
  const { rows } = await client.query(`select active_occurrence_id from weekly_events where id = $1`, [weeklyEventId]);
  return rows[0]?.active_occurrence_id ?? null;
}

async function upsertAttendance(client, occurrenceId, groupId, playerId, status, source, lastMessageId) {
  await client.query(
    `insert into attendance (occurrence_id, group_id, player_id, status, source, last_message_id)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (occurrence_id, player_id)
     do update set status = excluded.status, source = excluded.source, last_message_id = excluded.last_message_id, updated_at = now()`,
    [occurrenceId, groupId, playerId, status, source, lastMessageId]
  );
}

async function getPlayerIdForPhone(client, groupId, phoneE164) {
  const { rows } = await client.query(
    `select player_id from whatsapp_identities where group_id = $1 and phone_e164 = $2 limit 1`,
    [groupId, phoneE164]
  );
  return rows[0]?.player_id ?? null;
}

async function buildRoster(client, occurrenceId) {
  const { rows } = await client.query(
    `select a.status, p.name
       from attendance a
       join players p on p.id = a.player_id
      where a.occurrence_id = $1
      order by a.created_at asc`,
    [occurrenceId]
  );
  const by = { confirmed: [], waitlist: [], maybe: [], declined: [] };
  for (const r of rows) {
    if (by[r.status]) by[r.status].push(r.name);
  }
  return by;
}

function formatRoster(by, capacity = 4) {
  const confirmed = by.confirmed || [];
  const waitlist = by.waitlist || [];
  const declined = by.declined || [];
  const maybe = by.maybe || [];
  const missing = Math.max(0, capacity - confirmed.length);

  const lines = [
    `Confirmados (${confirmed.length}/${capacity}): ${confirmed.join(', ') || '-'}`,
    `Espera: ${waitlist.join(', ') || '-'}`,
    `Duda: ${maybe.join(', ') || '-'}`,
    `No vienen: ${declined.join(', ') || '-'}`,
    missing ? `Faltan: ${missing}` : 'Completo ✅',
  ];
  return lines.join('\n');
}

async function wacliSendGroupText(groupJid, message) {
  // Requires wacli binary installed.
  return new Promise((resolve, reject) => {
    const p = spawn('wacli', ['send', 'text', '--to', groupJid, '--message', message], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString('utf8')));
    p.stderr.on('data', (d) => (err += d.toString('utf8')));
    p.on('close', (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(err || `wacli send failed (code ${code})`));
    });
  });
}

async function handleMessage({ cfg, db, msg }) {
  // msg shape depends on wacli JSON. We treat it defensively.
  const chatJid = msg?.chat?.jid || msg?.chat || msg?.jid;
  if (!chatJid || chatJid !== cfg.groupJid) return;

  const text = normalizeCmd(msg?.text || msg?.message?.text || msg?.body || '');
  if (!text.startsWith('!')) return;

  const fromPhone = msg?.from?.phone || msg?.from || msg?.sender?.phone || msg?.sender;
  const messageId = msg?.id || msg?.message?.id || msg?.key?.id || null;

  const weekly = await ensureWeeklyEvent(db, cfg.padelGroupId);

  // Strict mode: ignore everything until admin starts with !jueves
  const activeOccurrenceId = await getActiveOccurrence(db, weekly.id);

  const isAdmin = String(fromPhone || '') === String(cfg.adminPhone || '');

  if (text === '!jueves') {
    if (!isAdmin) {
      // Optional: reply with guidance; keep quiet by default.
      return;
    }
    const startsAt = nextThursdayAt20UTCish();
    const occ = await ensureOccurrence(db, weekly.id, cfg.padelGroupId, startsAt);
    await setActiveOccurrence(db, weekly.id, occ.id);

    const roster = await buildRoster(db, occ.id);
    const message = `🗓️ Lista Jueves 20:00\n\n${formatRoster(roster, 4)}\n\nComandos: !in / !out / !status`;
    await wacliSendGroupText(cfg.groupJid, message);
    return;
  }

  if (!activeOccurrenceId) {
    // ignore all commands pre-kickoff
    return;
  }

  if (text === '!status') {
    const roster = await buildRoster(db, activeOccurrenceId);
    await wacliSendGroupText(cfg.groupJid, `📋 Estado\n\n${formatRoster(roster, 4)}`);
    return;
  }

  if (text === '!in' || text === '!out') {
    const playerId = await getPlayerIdForPhone(db, cfg.padelGroupId, fromPhone);
    if (!playerId) {
      // Optional: announce unknown mapping
      return;
    }

    const desired = text === '!in' ? 'confirmed' : 'declined';
    await upsertAttendance(db, activeOccurrenceId, cfg.padelGroupId, playerId, desired, 'whatsapp', messageId);

    const roster = await buildRoster(db, activeOccurrenceId);
    await wacliSendGroupText(cfg.groupJid, `${text === '!in' ? '✅ Confirmado' : '❌ No viene'}\n\n${formatRoster(roster, 4)}`);
    return;
  }

  // TODO: !lock/!unlock/!reset/!suggest, waitlist enforcement, cutoff enforcement.
}

async function main() {
  const cfg = loadConfig();
  const databaseUrl = process.env.BOT_DATABASE_URL;
  if (!databaseUrl) die('Missing BOT_DATABASE_URL. Provide a Postgres connection string for bot service access.');

  const db = new Client({ connectionString: databaseUrl });
  await db.connect();

  // Stream wacli sync output as JSON lines.
  const p = spawn('wacli', ['sync', '--follow', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  p.stderr.on('data', (d) => {
    // Keep stderr for diagnostics; do not crash.
    process.stderr.write(d);
  });

  let buf = '';
  p.stdout.on('data', async (d) => {
    buf += d.toString('utf8');
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const msg = JSON.parse(trimmed);
        await handleMessage({ cfg, db, msg });
      } catch {
        // ignore malformed lines
      }
    }
  });

  p.on('close', async (code) => {
    await db.end();
    die(`wacli sync exited (code ${code})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
