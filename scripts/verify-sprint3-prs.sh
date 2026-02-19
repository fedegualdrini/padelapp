#!/bin/bash

# Sprint 3 PR Verification Script
# Tests all 13 PRs (#47-#58) for test suite, typecheck, and lint

set -e

REPO_DIR="/home/ubuntu/.openclaw/workspace/padelapp"
REPORT_FILE="$REPO_DIR/docs/qa/sprint3-verification.md"
LOG_FILE="$REPO_DIR/docs/qa/sprint3-verification.log"

cd "$REPO_DIR"

# Ensure directory exists
mkdir -p "$(dirname "$REPORT_FILE")"

# PR branches in order #47-#58
declare -a PR_BRANCHES=(
  "chris/group-invite-system-20260219"          # PR #47
  "jordan/fix-duplicate-fab-20260219"           # PR #48
  "sam/optimize-share-match-20260219"           # PR #49
  "taylor/expand-e2e-20260219"                  # PR #50
  "chris/verify-invite-rls-20260219"            # PR #51
  "jordan/migrate-nextmatchcard-css-20260219"   # PR #52
  "jordan/migrate-eventsclient-css-20260219"    # PR #53
  "taylor/fix-utils-type-20260219"              # PR #54
  "jordan/invite-modal-20260219-v2"             # PR #55
  "sam/public-ranking-share-page-20260219"      # PR #56
  "jordan/migrate-calendarclient-css-20260219"  # PR #57
  "sam/invite-preview-page-20260219"            # PR #58
)

# Initialize report
cat > "$REPORT_FILE" << 'EOF'
# Sprint 3 PR Verification Report

**Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Verified by:** Taylor (QA)
**Scope:** PRs #47-#58 (13 PRs)

## Summary

| PR # | Branch | Status | Typecheck | Lint | Unit Tests | DB Tests | E2E Tests |
|------|--------|--------|-----------|------|------------|----------|-----------|

## Detailed Results

EOF

echo "=== Sprint 3 PR Verification ===" | tee "$LOG_FILE"
echo "Started: $(date -u)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

for i in "${!PR_BRANCHES[@]}"; do
  PR_NUM=$((47 + i))
  BRANCH="${PR_BRANCHES[$i]}"

  echo "========================================" | tee -a "$LOG_FILE"
  echo "Testing PR #$PR_NUM: $BRANCH" | tee -a "$LOG_FILE"
  echo "========================================" | tee -a "$LOG_FILE"

  echo "" >> "$REPORT_FILE"
  echo "### PR #$PR_NUM: $BRANCH" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"

  # Checkout branch
  echo "Checking out branch..." | tee -a "$LOG_FILE"
  if git checkout "$BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
    STATUS="✅ Checked out"
  else
    STATUS="❌ Checkout failed"
    echo "$STATUS" | tee -a "$LOG_FILE"
    echo "**Status:** $STATUS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    continue
  fi

  # Pull latest changes
  git pull origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE" || true

  # Install dependencies (in case package.json changed)
  echo "Installing dependencies..." | tee -a "$LOG_FILE"
  npm ci --silent 2>&1 | tee -a "$LOG_FILE" || echo "⚠️ npm ci warnings" | tee -a "$LOG_FILE"

  # Run typecheck
  echo "Running typecheck..." | tee -a "$LOG_FILE"
  if npm run typecheck 2>&1 | tee -a "$LOG_FILE"; then
    TYPECHECK="✅ Pass"
  else
    TYPECHECK="❌ Fail"
  fi

  # Run lint
  echo "Running lint..." | tee -a "$LOG_FILE"
  if npm run lint 2>&1 | tee -a "$LOG_FILE"; then
    LINT="✅ Pass"
  else
    LINT="❌ Fail"
  fi

  # Run unit tests
  echo "Running unit tests..." | tee -a "$LOG_FILE"
  if npm run test:unit 2>&1 | tee -a "$LOG_FILE"; then
    UNIT="✅ Pass"
  else
    UNIT="❌ Fail"
  fi

  # Run DB tests
  echo "Running DB tests..." | tee -a "$LOG_FILE"
  if npm run test:db 2>&1 | tee -a "$LOG_FILE"; then
    DB="✅ Pass"
  else
    DB="❌ Fail"
  fi

  # Run E2E tests (may skip if not available)
  echo "Running E2E tests..." | tee -a "$LOG_FILE"
  if npm run test:e2e 2>&1 | tee -a "$LOG_FILE"; then
    E2E="✅ Pass"
  else
    E2E="❌ Fail"
  fi

  # Update summary table
  SUMMARY_LINE="| $PR_NUM | $BRANCH | $STATUS | $TYPECHECK | $LINT | $UNIT | $DB | $E2E |"
  echo "$SUMMARY_LINE" >> "$REPORT_FILE"

  # Add detailed results
  cat >> "$REPORT_FILE" << EOF

**Status:** $STATUS
- **Typecheck:** $TYPECHECK
- **Lint:** $LINT
- **Unit Tests:** $UNIT
- **DB Tests:** $DB
- **E2E Tests:** $E2E

EOF

  echo "Completed PR #$PR_NUM" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
done

echo "=== Verification Complete ===" | tee -a "$LOG_FILE"
echo "Finished: $(date -u)" | tee -a "$LOG_FILE"

cat >> "$REPORT_FILE" << 'EOF'

## Conclusion

EOF

echo "Report saved to: $REPORT_FILE"
echo "Log saved to: $LOG_FILE"
