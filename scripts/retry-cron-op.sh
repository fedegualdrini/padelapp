#!/usr/bin/env bash
# Retry wrapper for cron operations
# Usage: ./scripts/retry-cron-op.sh <command> [args...]
# Example: ./scripts/retry-cron-op.sh cron --action list

set -o pipefail

# Configuration
MAX_RETRIES=5
INITIAL_DELAY_SEC=1
BACKOFF_MULTIPLIER=2

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
if [ $# -lt 1 ]; then
  echo "ERROR: No command specified"
  echo "Usage: $0 <command> [args...]"
  echo "Example: $0 cron --action list"
  exit 1
fi

COMMAND=("$@")
ATTEMPT=1
DELAY=$INITIAL_DELAY_SEC

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_attempt() {
  local total=$1
  local current=$2
  echo -e "${YELLOW}[RETRY]${NC} Attempt $current of $total (next delay: ${DELAY}s)..."
}

# Retry loop
while [ $ATTEMPT -le $MAX_RETRIES ]; do
  log_attempt $MAX_RETRIES $ATTEMPT

  # Run command and capture exit code
  "${COMMAND[@]}"
  exit_code=$?

  # Check if command succeeded
  if [ $exit_code -eq 0 ]; then
    log_info "Operation succeeded on attempt $ATTEMPT"
    exit 0
  fi

  # Command failed
  log_warn "Operation failed with exit code $exit_code"

  # Check if non-retryable error
  # HTTP 4xx errors (except 429 Too Many Requests) are not retryable
  if echo "$exit_code" | grep -qE '^4[0-9]{2}$'; then
    if [ "$exit_code" -eq 429 ]; then
      log_warn "HTTP 429 (Too Many Requests) - will retry"
    else
      log_error "HTTP $exit_code is not retryable"
      log_error "Failing immediately"
      exit $exit_code
    fi
  fi

  # Check if this was the last attempt
  if [ $ATTEMPT -lt $MAX_RETRIES ]; then
    log_warn "Retrying in ${DELAY}s..."
    sleep $DELAY
    # Exponential backoff
    DELAY=$((DELAY * BACKOFF_MULTIPLIER))
  fi

  ATTEMPT=$((ATTEMPT + 1))
done

# All retries exhausted
log_error "Operation failed after $MAX_RETRIES attempts"
exit 1
