#!/bin/bash
# Helper script to update builder cron job with E2E test instructions

echo "Builder Cron Job ID: 5dad283e-5c3f-44c3-afb4-9234078274f8"
echo ""
echo "This script will update the builder cron job to include E2E test creation instructions."
echo ""
echo "The E2E test instructions are in:"
echo "  /home/ubuntu/clawd/padelapp/.daily-features/BUILDER-E2E-TEST-INSTRUCTIONS.md"
echo ""
echo "After running this script:"
echo "1. Restart the gateway to reload cron configuration"
echo "2. The builder will now include E2E test instructions"
echo ""
echo "⚠️  IMPORTANT: The cron.update tool has limitations with large messages."
echo "   For complex message updates like adding E2E test instructions,"
echo "   the script may fail due to schema validation."
echo ""
echo "If that happens, you'll need to manually update the cron job."
echo ""

read -p "Press Enter to continue, or Ctrl+C to cancel..."
