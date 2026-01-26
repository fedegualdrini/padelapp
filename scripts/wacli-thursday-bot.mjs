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

function loadState() {
  const p = path.resolve(process.cwd(), '.wacli-bot-state.json');
  if (!fs.existsSync(p)) return { lastProcessedTs: 0, inviteMenu: null };
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      lastProcessedTs: Number(parsed?.lastProcessedTs || 0),
      inviteMenu: parsed?.inviteMenu ?? null,
    };
  } catch {
    return { lastProcessedTs: 0, inviteMenu: null };
  }
}

function saveState(state) {
  const p = path.resolve(process.cwd(), '.wacli-bot-state.json');
  const tmp = `${p}.tmp`;
  const payload = JSON.stringify(
    {
      lastProcessedTs: state.lastProcessedTs || 0,
      inviteMenu: state.inviteMenu ?? null,
    },
    null,
    2
  );
  fs.writeFileSync(tmp, payload + '\n');
  fs.renameSync(tmp, p);
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

function normalizeSenderJid(senderJid) {
  const s = String(senderJid || '');
  // Normalize "2757...:44@lid" -> "2757...@lid" so it matches what we store from group participants.
  return s.replace(/:(\d+)@lid$/, '@lid');
}

async function getPlayerIdForSenderJid(client, groupId, senderJid) {
  const normalized = normalizeSenderJid(senderJid);
  const { rows } = await client.query(
    `select player_id
       from whatsapp_sender_identities
      where group_id = $1 and sender_jid = $2
      limit 1`,
    [groupId, normalized]
  );
  return rows[0]?.player_id ?? null;
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

async function getConfirmedPlayers(client, occurrenceId) {
  const { rows } = await client.query(
    `select a.player_id, p.name
       from attendance a
       join players p on p.id = a.player_id
      where a.occurrence_id = $1
        and a.status = 'confirmed'
      order by a.created_at asc`,
    [occurrenceId]
  );
  return rows;
}

async function getLatestEloByPlayer(client, groupId, playerIds) {
  if (!playerIds.length) return new Map();

  // Same data source as ranking: elo_ratings joined to matches filtered by group.
  // We pick the latest rating per player by match played_at (desc) and created_at (desc).
  const { rows } = await client.query(
    `select distinct on (er.player_id)
        er.player_id,
        er.rating
     from elo_ratings er
     join matches m on m.id = er.as_of_match_id
     where m.group_id = $1
       and er.player_id = any($2::uuid[])
     order by er.player_id, m.played_at desc, m.created_at desc, er.created_at desc`,
    [groupId, playerIds]
  );

  const map = new Map();
  for (const r of rows) map.set(r.player_id, Number(r.rating));
  return map;
}

function suggestPairsByElo(players) {
  // players: [{ player_id, name, elo }], length=4
  const [a, b, c, d] = players;
  const splits = [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ].map((s) => {
    const sum1 = s.team1[0].elo + s.team1[1].elo;
    const sum2 = s.team2[0].elo + s.team2[1].elo;
    return { ...s, sum1, sum2, diff: Math.abs(sum1 - sum2) };
  });

  splits.sort((x, y) => x.diff - y.diff);
  return splits[0];
}

function formatPairSuggestion(playersWithElo) {
  if (playersWithElo.length !== 4) return '';
  const best = suggestPairsByElo(playersWithElo);
  const t1 = best.team1.map((p) => p.name).join(' + ');
  const t2 = best.team2.map((p) => p.name).join(' + ');
  return [
    '🎾 Parejas sugeridas (por ELO):',
    `Equipo 1: ${t1} (ELO ${best.sum1})`,
    `Equipo 2: ${t2} (ELO ${best.sum2})`,
    `Δ ELO: ${best.diff}`,
  ].join('\n');
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

async function handleMessage({ cfg, db, msg, state }) {
  // msg shape depends on wacli JSON.
  // For wacli sync --json, messages look like:
  // { ChatJID, ChatName, MsgID, SenderJID, Timestamp, FromMe, Text, DisplayText, ... }
  // We'll support both the wacli shape and a couple of fallback shapes.
  const chatJid = msg?.ChatJID || msg?.chat?.jid || msg?.chat || msg?.jid;
  if (!chatJid || chatJid !== cfg.groupJid) return;

  const text = normalizeCmd(msg?.Text || msg?.text || msg?.message?.text || msg?.body || '');

  // In this setup, wacli is linked to the admin's personal WhatsApp account,
  // so group commands sent by the admin appear as FromMe=true.
  // We therefore must NOT blanket-ignore FromMe.
  // Instead, ignore messages that look like our own bot outputs (to avoid loops).
  const botOutputPrefixes = [
    '🗓️ lista jueves',
    '📋 estado',
    '✅ confirmado',
    '⏳ lista de espera',
    '❌ no viene',
    '🔒 lista cerrada',
    '🔓 lista reabierta',
    '🧹 lista reiniciada',
    '💡 sugerencias',
    '🆔 tu id',
    '⚠️ no tengo tu identidad',
    '✅ vinculado',
    '📨 invitados',
    '✅ invite',
  ];
  const looksLikeBotOutput = botOutputPrefixes.some((p) => text.startsWith(p));
  if (looksLikeBotOutput) return;

  if (!text.startsWith('!')) return;

  // Sender identity:
  // - Prefer SenderJID when present (wacli json)
  // - Else fall back to older shapes.
  const senderJid = msg?.SenderJID || msg?.sender?.jid || msg?.from?.jid || msg?.from || msg?.sender;
  const messageId = msg?.MsgID || msg?.id || msg?.message?.id || msg?.key?.id || null;

  // Sender identity:
  // - senderJid is the stable value we can use for mapping when WhatsApp emits LIDs.
  // - fromPhone is best-effort digits extraction for phone-based mapping.
  const senderJidStr = (senderJid && typeof senderJid === 'string') ? senderJid : String(senderJid || '');
  const fromPhone = senderJidStr;

  const weekly = await ensureWeeklyEvent(db, cfg.padelGroupId);

  // Strict mode: ignore everything until admin starts with !jueves
  const activeOccurrenceId = await getActiveOccurrence(db, weekly.id);

  // Try to match admin:
  // - If sender is an E.164 JID (e.g. 54911...@s.whatsapp.net), match on digits.
  // - If sender is a LID (e.g. 2757...@lid), we can't derive the phone; in that case
  //   allow override by setting cfg.adminSenderJid.
  function digits(s) {
    return String(s || '').replace(/\D/g, '');
  }

  const adminDigits = digits(cfg.adminPhone);
  const senderDigits = digits(fromPhone);

  const isAdmin =
    (adminDigits && senderDigits && senderDigits.endsWith(adminDigits)) ||
    (cfg.adminSenderJid && String(senderJidStr) === String(cfg.adminSenderJid));

  if (text === '!whoami') {
    // Helper for mapping: show the sender JID that WhatsApp/wacli sees.
    // This is needed when SenderJID is a LID (not a phone JID).
    await wacliSendGroupText(cfg.groupJid, `🆔 Tu ID (senderJid): ${senderJidStr}`);
    return;
  }

  if (text.startsWith('!bindjid')) {
    // Admin-only mapping helper:
    // Usage: !bindjid <senderJid> <player name>
    if (!isAdmin) return;

    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length < 3) {
      await wacliSendGroupText(cfg.groupJid, 'Uso: !bindjid <senderJid> <player name>');
      return;
    }

    const bindSenderJid = parts[1];
    const playerName = parts.slice(2).join(' ');

    const { rows: players } = await db.query(
      `select id, name
         from players
        where group_id = $1
          and lower(name) = lower($2)
        limit 1`,
      [cfg.padelGroupId, playerName]
    );

    const player = players[0];
    if (!player) {
      await wacliSendGroupText(cfg.groupJid, `No encontré jugador con nombre: ${playerName}`);
      return;
    }

    await db.query(
      `insert into whatsapp_sender_identities (group_id, player_id, sender_jid)
       values ($1,$2,$3)
       on conflict (group_id, sender_jid)
       do update set player_id = excluded.player_id, updated_at = now()`,
      [cfg.padelGroupId, player.id, bindSenderJid]
    );

    await wacliSendGroupText(cfg.groupJid, `✅ Vinculado ${player.name} ↔ ${bindSenderJid}`);
    return;
  }

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

  // Admin invite menu
  // - !invite -> show numbered list of invite players sorted by matches played
  // - !invite <n> in|out -> mark that invite as confirmed/declined for the active occurrence
  if (text === '!invite' || text.startsWith('!invite ')) {
    if (!isAdmin) return;

    async function getInvitesSorted(groupId, limit = 20) {
      const { rows } = await db.query(
        `with invite_players as (
           select id, name
             from players
            where group_id = $1 and status = 'invite'
         ), stats as (
           select v.player_id, count(distinct v.match_id)::int as matches_played
             from v_player_match_participation_enriched v
            where v.group_id = $1
            group by v.player_id
         )
         select ip.id as player_id, ip.name,
                coalesce(s.matches_played, 0) as matches_played
           from invite_players ip
           left join stats s on s.player_id = ip.id
          order by matches_played desc, ip.name asc
          limit $2`,
        [groupId, limit]
      );
      return rows;
    }

    const menuTtlMs = 15 * 60 * 1000;

    // Selection form: !invite <n> in|out
    const m = text.match(/^!invite\s+(\d+)\s+(in|out)$/);
    if (m) {
      const n = Number(m[1]);
      const action = m[2];

      const menu = state?.inviteMenu;
      if (!menu || !menu.createdAtTs || !Array.isArray(menu.items)) {
        await wacliSendGroupText(cfg.groupJid, '📨 Invitados: menú no disponible. Enviá !invite primero.');
        return;
      }
      if (Date.now() - Number(menu.createdAtTs) > menuTtlMs) {
        await wacliSendGroupText(cfg.groupJid, '📨 Invitados: menú expiró. Enviá !invite de nuevo.');
        return;
      }

      const item = menu.items.find((it) => Number(it.n) === n);
      if (!item) {
        await wacliSendGroupText(cfg.groupJid, '📨 Invitados: número inválido. Enviá !invite para ver la lista.');
        return;
      }

      // Apply to attendance
      // Resolve current confirmed count
      const { rows: confirmedRows } = await db.query(
        `select count(*)::int as n from attendance where occurrence_id=$1 and status='confirmed'`,
        [activeOccurrenceId]
      );
      const confirmedCount = confirmedRows[0]?.n ?? 0;

      if (action === 'in') {
        const status = confirmedCount < 4 ? 'confirmed' : 'waitlist';
        await upsertAttendance(db, activeOccurrenceId, cfg.padelGroupId, item.playerId, status, 'admin', messageId);
        const roster = await buildRoster(db, activeOccurrenceId);
        await wacliSendGroupText(cfg.groupJid, `✅ Invite ${item.name}: ${status === 'confirmed' ? 'confirmado' : 'espera'}\n\n${formatRoster(roster, 4)}`);
        return;
      }

      // out
      await upsertAttendance(db, activeOccurrenceId, cfg.padelGroupId, item.playerId, 'declined', 'admin', messageId);
      const roster = await buildRoster(db, activeOccurrenceId);
      await wacliSendGroupText(cfg.groupJid, `✅ Invite ${item.name}: no viene\n\n${formatRoster(roster, 4)}`);
      return;
    }

    // Menu form: !invite
    if (text === '!invite') {
      const invites = await getInvitesSorted(cfg.padelGroupId, 20);
      if (!invites.length) {
        await wacliSendGroupText(cfg.groupJid, '📨 Invitados: no hay jugadores con status invite.');
        return;
      }

      const items = invites.map((p, idx) => ({ n: idx + 1, playerId: p.player_id, name: p.name }));
      state.inviteMenu = { createdAtTs: Date.now(), items };
      saveState(state);

      const lines = invites.map((p, idx) => `${idx + 1}) ${p.name} — ${p.matches_played} partidos`);
      await wacliSendGroupText(
        cfg.groupJid,
        `📨 Invitados (ordenados por partidos):\n\n${lines.join('\n')}\n\nResponder: !invite <n> in|out`
      );
      return;
    }

    // fallback usage
    await wacliSendGroupText(cfg.groupJid, 'Uso: !invite  (o)  !invite <n> in|out');
    return;
  }

  if (text === '!status') {
    const roster = await buildRoster(db, activeOccurrenceId);
    await wacliSendGroupText(cfg.groupJid, `📋 Estado\n\n${formatRoster(roster, 4)}`);
    return;
  }

  async function getOccurrenceMeta(occId) {
    const { rows } = await db.query(
      `select starts_at, status from event_occurrences where id = $1 limit 1`,
      [occId]
    );
    return rows[0] || null;
  }

  function cutoffAt(startsAt) {
    // Tuesday 14:00 before the Thursday occurrence (UTC-based for now).
    const d = new Date(startsAt);
    const day = d.getUTCDay();
    // target Thursday(4) -> cutoff Tuesday(2) is -2 days
    const deltaDays = -2;
    const c = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 14, 0, 0));
    c.setUTCDate(c.getUTCDate() + deltaDays);
    return c;
  }

  async function maybeAutoLock(occId) {
    const meta = await getOccurrenceMeta(occId);
    if (!meta) return { locked: false, meta: null };
    if (meta.status !== 'open') return { locked: meta.status === 'locked', meta };
    const now = new Date();
    const cut = cutoffAt(meta.starts_at);
    if (now >= cut) {
      await db.query(`update event_occurrences set status = 'locked', updated_at = now() where id = $1`, [occId]);

      // Notify the group once it becomes locked (first interaction after cutoff)
      const roster = await buildRoster(db, occId);
      const confirmed = await getConfirmedPlayers(db, occId);
      let pairBlock = '';
      if (confirmed.length === 4) {
        const eloByPlayer = await getLatestEloByPlayer(db, cfg.padelGroupId, confirmed.map((p) => p.player_id));
        const withElo = confirmed
          .map((p) => ({ ...p, elo: eloByPlayer.get(p.player_id) }))
          .filter((p) => typeof p.elo === 'number' && Number.isFinite(p.elo));
        if (withElo.length === 4) pairBlock = `\n\n${formatPairSuggestion(withElo)}`;
        else pairBlock = `\n\n🎾 Parejas sugeridas: No hay suficientes datos todavía (faltan partidos para calcular ELO).`;
      }
      await wacliSendGroupText(cfg.groupJid, `🔒 Lista cerrada\n\n${formatRoster(roster, 4)}${pairBlock}`);

      return { locked: true, meta: { ...meta, status: 'locked' } };
    }
    return { locked: false, meta };
  }

  if (text === '!lock' || text === '!unlock' || text === '!reset' || text === '!suggest') {
    if (!isAdmin) return;

    if (text === '!lock') {
      await db.query(`update event_occurrences set status = 'locked', updated_at = now() where id = $1`, [activeOccurrenceId]);

      const roster = await buildRoster(db, activeOccurrenceId);

      // Pair suggestions (only when exactly 4 confirmed and ELO exists for all 4)
      const confirmed = await getConfirmedPlayers(db, activeOccurrenceId);
      let pairBlock = '';
      if (confirmed.length === 4) {
        const eloByPlayer = await getLatestEloByPlayer(db, cfg.padelGroupId, confirmed.map((p) => p.player_id));
        const withElo = confirmed
          .map((p) => ({ ...p, elo: eloByPlayer.get(p.player_id) }))
          .filter((p) => typeof p.elo === 'number' && Number.isFinite(p.elo));
        if (withElo.length === 4) pairBlock = `\n\n${formatPairSuggestion(withElo)}`;
        else pairBlock = `\n\n🎾 Parejas sugeridas: No hay suficientes datos todavía (faltan partidos para calcular ELO).`;
      }

      await wacliSendGroupText(cfg.groupJid, `🔒 Lista cerrada\n\n${formatRoster(roster, 4)}${pairBlock}`);
      return;
    }

    if (text === '!unlock') {
      await db.query(`update event_occurrences set status = 'open', updated_at = now() where id = $1`, [activeOccurrenceId]);
      await wacliSendGroupText(cfg.groupJid, `🔓 Lista reabierta\n\nUsá: !in / !out / !status`);
      return;
    }

    if (text === '!reset') {
      await db.query(`delete from attendance where occurrence_id = $1`, [activeOccurrenceId]);
      await wacliSendGroupText(cfg.groupJid, `🧹 Lista reiniciada\n\nUsá: !in / !out / !status`);
      return;
    }

    if (text === '!suggest') {
      // Suggest usual players not confirmed/declined/maybe/waitlist.
      const { rows } = await db.query(
        `with taken as (
           select player_id from attendance where occurrence_id = $1
         )
         select p.name
           from players p
          where p.group_id = $2
            and p.status = 'usual'
            and p.id not in (select player_id from taken)
          order by p.name asc
          limit 6`,
        [activeOccurrenceId, cfg.padelGroupId]
      );
      const names = rows.map((r) => r.name);
      await wacliSendGroupText(
        cfg.groupJid,
        `💡 Sugerencias para invitar:\n${names.length ? names.map((n) => `- ${n}`).join('\n') : '- (sin sugerencias)'}`
      );
      return;
    }
  }

  if (text === '!status') {
    const { locked } = await maybeAutoLock(activeOccurrenceId);
    const roster = await buildRoster(db, activeOccurrenceId);
    await wacliSendGroupText(
      cfg.groupJid,
      `📋 Estado${locked ? ' (cerrado)' : ''}\n\n${formatRoster(roster, 4)}`
    );
    return;
  }

  if (text === '!in' || text === '!out') {
    const lockCheck = await maybeAutoLock(activeOccurrenceId);
    const isLocked = lockCheck.locked;
    if (isLocked && !isAdmin) {
      // strict: no changes after lock
      return;
    }

    // Resolve player:
    // 1) Prefer senderJid mapping (works for @lid)
    // 2) Fall back to phone mapping when sender includes phone digits
    let playerId = await getPlayerIdForSenderJid(db, cfg.padelGroupId, senderJidStr);
    if (!playerId) playerId = await getPlayerIdForPhone(db, cfg.padelGroupId, fromPhone);
    if (!playerId) {
      // Help debugging / onboarding
      await wacliSendGroupText(cfg.groupJid, `⚠️ No tengo tu identidad registrada. Enviá !whoami y pedile al admin que te vincule.`);
      return;
    }

    if (text === '!in') {
      // Capacity enforcement
      const { rows: counts } = await db.query(
        `select status, count(*)::int as n
           from attendance
          where occurrence_id = $1
          group by status`,
        [activeOccurrenceId]
      );
      const confirmedCount = counts.find((r) => r.status === 'confirmed')?.n ?? 0;
      const status = confirmedCount < 4 ? 'confirmed' : 'waitlist';
      await upsertAttendance(db, activeOccurrenceId, cfg.padelGroupId, playerId, status, 'whatsapp', messageId);

      const roster = await buildRoster(db, activeOccurrenceId);
      await wacliSendGroupText(
        cfg.groupJid,
        `${status === 'confirmed' ? '✅ Confirmado' : '⏳ Lista de espera'}\n\n${formatRoster(roster, 4)}`
      );
      return;
    }

    // !out
    await upsertAttendance(db, activeOccurrenceId, cfg.padelGroupId, playerId, 'declined', 'whatsapp', messageId);

    // Auto-promote earliest waitlisted if there is space.
    const { rows: confirmedRows } = await db.query(
      `select count(*)::int as n from attendance where occurrence_id = $1 and status = 'confirmed'`,
      [activeOccurrenceId]
    );
    const confirmedCount = confirmedRows[0]?.n ?? 0;
    if (confirmedCount < 4) {
      const { rows: nextWait } = await db.query(
        `select player_id
           from attendance
          where occurrence_id = $1 and status = 'waitlist'
          order by created_at asc
          limit 1`,
        [activeOccurrenceId]
      );
      if (nextWait[0]?.player_id) {
        await db.query(
          `update attendance set status = 'confirmed', updated_at = now() where occurrence_id = $1 and player_id = $2`,
          [activeOccurrenceId, nextWait[0].player_id]
        );
      }
    }

    const roster = await buildRoster(db, activeOccurrenceId);
    await wacliSendGroupText(cfg.groupJid, `❌ No viene\n\n${formatRoster(roster, 4)}`);
    return;
  }
}

async function main() {
  const cfg = loadConfig();
  const databaseUrl = process.env.BOT_DATABASE_URL;
  if (!databaseUrl) die('Missing BOT_DATABASE_URL. Provide a Postgres connection string for bot service access.');

  const db = new Client({ connectionString: databaseUrl });
  await db.connect();

  // IMPORTANT: wacli uses a single-store lock. A long-running `wacli sync --follow` prevents
  // concurrent `wacli send` calls (needed to reply). For MVP, we poll the local wacli message DB
  // and send replies between polls.

  // Persisted cursor so restarts do NOT re-process old commands and spam the group.
  const state = loadState();

  // In-process dedupe (within a single run)
  const seen = new Set();

  async function run(cmd, args) {
    return new Promise((resolve, reject) => {
      const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      let err = '';
      p.stdout.on('data', (d) => (out += d.toString('utf8')));
      p.stderr.on('data', (d) => (err += d.toString('utf8')));
      p.on('close', (code) => {
        if (code !== 0) return reject(new Error(err || `${cmd} ${args.join(' ')} failed (code ${code})`));
        resolve(out);
      });
    });
  }

  async function syncOnce() {
    // Pull new messages from WhatsApp into the local store.
    // This holds the store lock briefly, then exits.
    await run('wacli', ['sync', '--once', '--idle-exit', '2s', '--json']);
  }

  async function listMessages() {
    return run('wacli', ['messages', 'list', '--limit', '40', '--json']);
  }

  async function loop() {
    while (true) {
      try {
        await syncOnce();
        const raw = await listMessages();
        const parsed = JSON.parse(raw);
        const msgs = parsed?.data?.messages || parsed?.data || parsed?.messages || [];

        // wacli returns newest first; process oldest->newest.
        const ordered = [...msgs].reverse();
        for (const m of ordered) {
          const id = m?.MsgID || m?.id;
          if (!id) continue;

          const ts = m?.Timestamp ? Date.parse(m.Timestamp) : NaN;
          if (!Number.isNaN(ts) && ts <= state.lastProcessedTs) continue;

          if (seen.has(id)) continue;
          seen.add(id);

          await handleMessage({ cfg, db, msg: m, state });

          // Advance cursor even if the message was ignored inside handleMessage.
          // This prevents replay-spam after restarts.
          if (!Number.isNaN(ts) && ts > state.lastProcessedTs) {
            state.lastProcessedTs = ts;
            saveState(state);
          }
        }
      } catch (e) {
        process.stderr.write(String(e?.stack || e) + '\n');
      }

      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  await loop();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
