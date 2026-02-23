#!/usr/bin/env bash
# Pre-cycle sync: fetch and rebase all agent worktrees onto main branch
# Run before each work cycle (e.g. from cron) on EC2
# Usage: ./scripts/padel-pre-cycle-sync.sh

set -e

WORKSPACE_ROOT="${WORKSPACE_ROOT:-/home/ubuntu/.openclaw/workspace}"
MAIN_REPO="$WORKSPACE_ROOT/padelapp"
MAIN_BRANCH="${MAIN_BRANCH:-claudio}"

WORKTREES=("padel-backend" "padel-frontend" "padel-qa" "padel-product" "padel-growth")

echo "=== Pre-cycle sync ==="
cd "$MAIN_REPO"
git fetch origin

for dir in "${WORKTREES[@]}"; do
  path="$WORKSPACE_ROOT/$dir"
  if [ ! -d "$path" ]; then
    echo "[SKIP] $dir not found"
    continue
  fi
  echo "[SYNC] $dir"
  (cd "$path" && git fetch origin && git merge "origin/$MAIN_BRANCH" --no-edit 2>/dev/null || true)
done

echo "=== Sync complete ==="
