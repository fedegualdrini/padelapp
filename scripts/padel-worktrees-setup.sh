#!/usr/bin/env bash
# Padel agent worktrees setup
# Run once on EC2 to create git worktrees for each agent
# Usage: ./scripts/padel-worktrees-setup.sh
# Prereq: padelapp repo cloned at /home/ubuntu/.openclaw/workspace/padelapp

set -e

WORKSPACE_ROOT="${WORKSPACE_ROOT:-/home/ubuntu/.openclaw/workspace}"
MAIN_REPO="$WORKSPACE_ROOT/padelapp"
MAIN_BRANCH="${MAIN_BRANCH:-claudio}"

WORKTREES=(
  "padel-backend:chris/work"
  "padel-frontend:jordan/work"
  "padel-qa:taylor/work"
  "padel-product:maya/work"
  "padel-growth:sam/work"
)

echo "=== Padel worktrees setup ==="
echo "Main repo: $MAIN_REPO"
echo "Base branch: $MAIN_BRANCH"
echo ""

cd "$MAIN_REPO"
git fetch origin

for entry in "${WORKTREES[@]}"; do
  dir="${entry%%:*}"
  branch="${entry##*:}"
  path="$WORKSPACE_ROOT/$dir"

  if [ -d "$path" ]; then
    echo "[SKIP] $dir already exists at $path"
    continue
  fi

  echo "[ADD] Creating worktree $dir -> branch $branch"
  git worktree add "$path" -b "$branch" "origin/$MAIN_BRANCH" 2>/dev/null || \
  git worktree add "$path" -b "$branch" "$MAIN_BRANCH" 2>/dev/null || \
  git worktree add "$path" "$branch"
done

echo ""
echo "=== Done ==="
echo "Worktrees:"
git worktree list
