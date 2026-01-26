# WhatsApp Thursday Attendance Bot — Plan (wacli-based)

> **Status:** Plan only (no implementation yet)

## Goal
Automate weekly Thursday 20:00 match attendance for a Padelapp group using an existing WhatsApp group chat:
- Track confirmations (4 slots)
- Enforce cutoff/lock (Tuesday 14:00)
- Maintain waitlist + auto-promotion
- Post roster/status updates back into the WhatsApp group
- Suggest who to invite when slots are missing

## Key decisions (locked)
- **WhatsApp ingestion:** use `wacli` (WhatsApp Web session) and **relax** “official API only”.
- **Identity:** map participants by **phone number (E.164)**.
- **Schedule:** Thursday 20:00; capacity 4; cutoff Tuesday 14:00.
- **Command style:** **Option A** (explicit commands with `!` prefix).
- **Kickoff rule (strict):** ignore all commands until the admin sends `!jueves`.
- **Admin-only kickoff:** `!jueves` can only be triggered by admin.

## Constraints / security posture
- `wacli` uses a WhatsApp Web session for **Fede’s personal number**.
- Least privilege at WhatsApp layer is imperfect; enforce in software:
  - process **only one configured group JID** (ignore all other chats)
  - avoid backfilling other chats

## Components

### 1) One-time setup
1. `wacli auth` on the server (QR scan).
2. Discover target group JID:
   - `wacli chats list --query "<group name>" --limit 20 --json`
3. Store config (local-only file), e.g. `.wacli-bot.json`:
   ```json
   {
     "groupJid": "<id>@g.us",
     "padelGroupId": "<uuid>",
     "adminPhone": "+<e164>"
   }
   ```

### 2) Ingestion daemon
- Run continuously:
  - `wacli sync --follow --json`
- For each inbound message:
  - If `chat.jid !== groupJid` → **ignore**
  - Else parse command intents
- Keep a dedupe cursor:
  - last processed message id and/or timestamp

### 3) Data model (Padelapp)
Add planning entities separate from played matches.

Suggested tables:
- `weekly_events` (group schedule config)
- `event_occurrences` (specific Thursday date)
- `attendance` (player status per occurrence)
- `whatsapp_identities` (group_id, player_id, phone_e164)
- `group_admins` (group_id + admin identity)

Attendance statuses:
- `confirmed | declined | maybe | waitlist`

### 4) Commands (group chat)
All commands are strict and must start with `!`.

**Admin-only**
- `!jueves` — start week (set active occurrence) + post roster + instructions
- `!lock` / `!unlock`
- `!reset`
- `!suggest`

**Anyone (only after !jueves)**
- `!in`
- `!out`
- `!status`

**Before `!jueves`**
- Ignore all commands (no DB writes). Optionally post a single guidance message.

### 5) Attendance engine rules
- Capacity 4.
- Before cutoff: `!in` fills confirmed slots; overflow → waitlist.
- `!out` frees slot; auto-promote first waitlisted.
- Cutoff Tuesday 14:00:
  - auto-lock the active occurrence
  - after lock: only admin overrides

### 6) Bot outputs (group messages)
- On `!jueves`: roster + instructions.
- On `!in/!out`: short ack + roster summary.
- On `!status`: full roster.
- On lock (Tue 14:00 or `!lock`): final roster.

### 7) Suggestions (`!suggest`)
If confirmed < 4:
- suggest candidates from usuals not confirmed/declined
- optionally rank by availability / ELO balance

## Next questions before implementation
- WhatsApp group name (to find JID)
- Which Padelapp group (slug/id)
- Confirm admin phone number (E.164)
- Whether the bot should post on every `!in/!out` or keep replies minimal
