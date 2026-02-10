#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/daily-feature-builder.sh <spec-file>
SPEC_FILE=${1:-}
if [ -z "$SPEC_FILE" ]; then
  echo "Usage: $0 <spec-file>" >&2
  exit 2
fi

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$REPO_ROOT"

if [ ! -f "$SPEC_FILE" ]; then
  echo "Spec file not found: $SPEC_FILE" >&2
  exit 2
fi

# Safety checks
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty; aborting." >&2
  git status -sb >&2
  exit 3
fi

git fetch origin --prune

git checkout claudio
# normal push policy (no force). Ensure we're up-to-date.
git pull --ff-only

# Run the full test suite as the gate.
# The actual implementation is performed by the calling agent; this script is a helper
# for consistent verification + commit.

echo "Ready. Implement changes now, then run: npm test && git commit && git push"
