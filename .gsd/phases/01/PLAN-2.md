# PLAN-2: Best-effort screenshot of updated ranking chart

## Goal
Optionally send a screenshot image after match load.

## Approach
- If env `RANKING_SCREENSHOT_URL` is set, attempt to:
  1) Launch headless Chromium via Playwright
  2) Navigate to `RANKING_SCREENSHOT_URL` (should be a shareable ranking URL)
  3) Take a screenshot to a temp file
  4) Send it to the WhatsApp group with `wacli send file --caption ...`
- If anything fails (no Playwright, login required, timeout), skip silently.

## Files to change
- `scripts/wacli-thursday-bot.mjs`

## Steps
1) Add helper `maybeSendRankingScreenshot({ groupJid, caption })`:
   - Guard: require `process.env.RANKING_SCREENSHOT_URL`
   - Use `import('playwright')` dynamically; if fails, skip
   - Take screenshot into `/tmp/ranking-<matchId>.png`
   - Use new helper `wacliSendGroupFile(groupJid, filePath, caption)`
2) Invoke helper after sending the text completion message.

## Verification
- `node -c scripts/wacli-thursday-bot.mjs`
- Manual: set `RANKING_SCREENSHOT_URL` to a reachable URL and verify bot sends an image.

## Risks
- Auth required for ranking page; might not be automatable.
- Extra CPU/disk for Playwright.
