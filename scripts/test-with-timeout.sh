#!/usr/bin/env bash
set -euo pipefail

echo "Starting test run with 5-minute timeout..."
echo "=========================================="

# Run tests with 5-minute timeout
timeout 300 npm test
EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
  # Standard timeout exit code from 'timeout' command
  echo ""
  echo "=========================================="
  echo "ERROR: Tests timed out after 5 minutes"
  echo "This usually means a test is hanging or stuck"
  echo ""
  exit 124
elif [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "=========================================="
  echo "ERROR: Tests failed with exit code $EXIT_CODE"
  echo ""
  exit $EXIT_CODE
else
  echo ""
  echo "=========================================="
  echo "SUCCESS: All tests passed"
  echo ""
  exit 0
fi
