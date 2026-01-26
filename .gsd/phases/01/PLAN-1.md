# PLAN-1: ELO deltas + updated ranking in post-load reply

## Goal
After `!load score ...` successfully creates a match, send a WhatsApp message that includes:
- Per-player ELO delta for the match
- Updated ELO leaderboard table

## Files to change
- `scripts/wacli-thursday-bot.mjs`

## Steps
1) Add DB helpers:
   - `getMatchEloDeltas(db, matchId, groupId)`:
     - fetch new ratings for the match: `elo_ratings where as_of_match_id = matchId`
     - for each player_id, compute previous rating via `get_player_elo_before(player_id, matchId)`
     - delta = new - old
   - `getEloLeaderboard(db, groupId, limit)`:
     - query latest rating per player in group (same as ranking source)
     - join to players for names
     - sort desc
2) Extend `createMatchFromLoadSession`:
   - after commit succeeds, query deltas + leaderboard
   - format as text block appended to the existing "✅ Partido cargado" message
3) Ensure behavior on missing ELO history:
   - if no elo_ratings rows exist (or missing for some players), print "Not enough data" for deltas/leaderboard.

## Verification
- `node -c scripts/wacli-thursday-bot.mjs`
- Run unit tests: `npm run test:unit`
- Manual: Load a match in test DB and verify message includes deltas + leaderboard.

## Risks / rollbacks
- If ELO triggers lag, deltas might not be immediately available; implement a short retry (e.g. 3 attempts with 0.5s).
