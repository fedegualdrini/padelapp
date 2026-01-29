#!/usr/bin/env bash
# Safe Cron Job Update Script
# Updates cron job configuration by editing JSON directly and restarting Gateway
# Usage: ./scripts/safe-cron-update.sh <job-id> <jq-filter>
# Example: ./scripts/safe-cron-update.sh 5dad283e '.[0].payload.message |= "new message"'

set -eo pipefail

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paths
CRON_JOBS_FILE="/home/ubuntu/.clawdbot/cron/jobs.json"
TEMP_DIR="/tmp/safe-cron-update-$$"
BACKUP_FILE="${TEMP_DIR}/jobs.json.backup"

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check arguments
if [ $# -lt 2 ]; then
  log_error "Usage: $0 <job-id> <jq-filter>"
  log_error "Example: $0 5dad283e '.[0].payload.message |= \"new message\"'"
  exit 1
fi

JOB_ID="$1"
JQ_FILTER="$2"

log_info "Updating cron job: $JOB_ID"
log_info "JQ filter: $JQ_FILTER"

# Create temp directory
mkdir -p "$TEMP_DIR"

# Backup current config
log_info "Backing up current config..."
cp "$CRON_JOBS_FILE" "$BACKUP_FILE"

if [ ! -f "$BACKUP_FILE" ]; then
  log_error "Failed to create backup"
  exit 1
fi

log_info "Backup created: $BACKUP_FILE"

# Apply changes using jq
log_info "Applying changes to cron jobs..."
if ! jq "$JQ_FILTER" "$CRON_JOBS_FILE" > "${TEMP_DIR}/jobs.json.new"; then
  log_error "JQ filter failed"
  log_info "Restoring backup..."
  cp "$BACKUP_FILE" "$CRON_JOBS_FILE"
  exit 1
fi

# Validate JSON
log_info "Validating new JSON..."
if ! jq '.' "${TEMP_DIR}/jobs.json.new" > /dev/null 2>&1; then
  log_error "Invalid JSON after applying changes"
  log_info "Restoring backup..."
  cp "$BACKUP_FILE" "$CRON_JOBS_FILE"
  exit 1
fi

# Update timestamp
NOW=$(date +%s%3N)
UPDATED_JSON=$(jq --arg ts "$NOW" '.jobs[0].updatedAtMs = $ts' "${TEMP_DIR}/jobs.json.new")
echo "$UPDATED_JSON" > "${TEMP_DIR}/jobs.json.new"

# Validate again after timestamp update
if ! jq '.' "${TEMP_DIR}/jobs.json.new" > /dev/null 2>&1; then
  log_error "Invalid JSON after timestamp update"
  log_info "Restoring backup..."
  cp "$BACKUP_FILE" "$CRON_JOBS_FILE"
  exit 1
fi

# Compare to see if anything actually changed
log_info "Checking if configuration changed..."
if cmp -s "$CRON_JOBS_FILE" "${TEMP_DIR}/jobs.json.new"; then
  log_warn "No changes detected in configuration"
  log_info "Skipping Gateway restart"
  # Cleanup temp files
  rm -rf "$TEMP_DIR"
  exit 0
fi

# Apply changes
log_info "Applying new configuration..."
cp "${TEMP_DIR}/jobs.json.new" "$CRON_JOBS_FILE"

# Check if Gateway is running
if pgrep -f "clawdbot-gateway" > /dev/null 2>&1; then
  log_info "Gateway process is running, restarting..."

  # Restart Gateway
  if ! clawdbot gateway restart > /dev/null 2>&1; then
    log_error "Failed to restart Gateway"
    log_info "Restoring backup..."
    cp "$BACKUP_FILE" "$CRON_JOBS_FILE"

    # Try to restart Gateway again with old config
    log_warn "Attempting to restart Gateway with old configuration..."
    clawdbot gateway restart > /dev/null 2>&1 || true

    exit 1
  fi

  log_info "Gateway restarted successfully"
else
  log_warn "Gateway process not running, skipping restart"
fi

# Cleanup temp files
rm -rf "$TEMP_DIR"

log_info "Cron job update completed successfully"
exit 0
