#!/usr/bin/env bash
# Gateway Health Check Script
# Checks if Gateway is healthy and responsive
# Usage: ./scripts/check-gateway-health.sh [--timeout <seconds>]

set -euo pipefail

# Default timeout: 5 seconds
TIMEOUT_SEC=5

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      TIMEOUT_SEC="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--timeout <seconds>]"
      echo "Checks if Gateway is healthy and responsive."
      echo ""
      echo "Options:"
      echo "  --timeout <seconds>  Timeout in seconds (default: 5)"
      echo "  -h, --help           Show this help message"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Calculate timeout in milliseconds
TIMEOUT_MS=$((TIMEOUT_SEC * 1000))

echo "Checking Gateway health (timeout: ${TIMEOUT_SEC}s)..."

# Check if Gateway process is running
if ! pgrep -f "clawdbot-gateway" > /dev/null 2>&1; then
  echo "ERROR: Gateway process not running"
  echo "  Run: clawdbot gateway start"
  exit 1
fi

echo "✓ Gateway process is running (PID: $(pgrep -f 'clawdbot-gateway' | head -1))"

# Run health check command
HEALTH_OUTPUT=$(clawdbot health --json --timeout "${TIMEOUT_MS}" 2>&1)
HEALTH_EXIT_CODE=$?

if [ $HEALTH_EXIT_CODE -ne 0 ]; then
  # Check if it's a timeout (clawdbot health returns specific error for timeout)
  if echo "$HEALTH_OUTPUT" | grep -qi "timeout\|unreachable\|non-zero"; then
    echo "ERROR: Gateway health check timed out after ${TIMEOUT_SEC}s"
    echo "  Gateway is unresponsive (likely busy with heavy operations)"
  else
    echo "ERROR: Gateway health check failed (exit code: ${HEALTH_EXIT_CODE})"
    echo "  Output: $HEALTH_OUTPUT"
  fi
  exit 1
fi

echo "✓ Gateway health check passed"

# Parse JSON output to verify fields
if ! echo "$HEALTH_OUTPUT" | jq '.' > /dev/null 2>&1; then
  echo "WARNING: Gateway health check returned invalid JSON"
  echo "  Output: $HEALTH_OUTPUT"
  # Don't fail, just warn
fi

echo "✓ Gateway is healthy and responsive"

# Exit successfully
exit 0
