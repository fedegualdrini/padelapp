#!/bin/bash
# Run E2E tests with test database
# This script ensures test environment is properly loaded

# Get script directory and change to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

set -e

echo "🧪 Running E2E Tests with Test Database"
echo "=========================================="
echo ""

# Load test environment
if [ -f .env.test ]; then
  echo "✅ Loading .env.test environment"
  export $(cat .env.test | grep -v '^#' | xargs)
else
  echo "❌ .env.test not found!"
  exit 1
fi

# Check database URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set after loading .env.test"
  exit 1
fi

echo ""
echo "📊 Step 1: Reset test database with seed data"
echo "----------------------------------------------"
npm run test:db

if [ $? -ne 0 ]; then
  echo "❌ Database reset failed!"
  exit 1
fi

echo ""
echo "✅ Test database reset complete"
echo ""

echo "🧪 Step 2: Run E2E tests"
echo "----------------------------------------------"
npm run test:e2e

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ E2E tests failed!"
  echo ""
  echo "💡 To debug:"
  echo "   1. Check test-results/ directory for screenshots and videos"
  echo "   2. Run 'npx playwright show-report' to view HTML report"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
echo "🎉 Feature is ready!"
