# Phase 01: Post-load summary (ranking + ELO deltas + optional screenshot)

## User request
When a match is loaded through the WhatsApp bot (`!load ...` flow), the bot's completion reply should include:
- Updated ranking table (ELO leaderboard)
- ELO gained/lost by each player in the loaded match
- If possible, an attached screenshot of the updated Ranking chart

## Constraints / notes
- ELO must match the same source used by the ranking page: `elo_ratings` joined to `matches` filtered by group.
- For fresh groups with no ELO history: say "Not enough data".
- `!load` is available to any member; `matches.created_by` should indicate who performed the load.
- Bot runs 24/7 under systemd; keep operations fast and avoid long locks.
- Screenshot should be best-effort; if not feasible (no web server, auth), skip without failing the load.

## Current implementation touchpoints
- Bot script: `scripts/wacli-thursday-bot.mjs`
  - `!load score ...` creates match rows and replies "✅ Partido cargado".
- Web UI canonical match creation: `src/app/matches/new/actions.ts`.

## Deliverables
- Extend bot post-load response with ranking + ELO deltas.
- Add optional image send if `RANKING_SCREENSHOT_URL` configured and screenshot generation succeeds.
