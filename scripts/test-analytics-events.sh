#!/bin/bash

# Analytics Event Testing Script
# Tests that analytics events fire correctly in development mode

echo "🔍 Analytics Event Testing Script"
echo "==================================="
echo ""
echo "This script tests that analytics events fire correctly."
echo "Run this while the dev server is running (npm run dev)"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if dev server is running
echo "📋 Checking dev server status..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Dev server not running. Please run 'npm run dev' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dev server is running${NC}"
echo ""

# Test 1: Check if analytics.ts exists
echo "📄 Test 1: Checking analytics module..."
if [ -f "src/lib/analytics.ts" ]; then
    echo -e "${GREEN}✅ src/lib/analytics.ts exists${NC}"
else
    echo -e "${RED}❌ src/lib/analytics.ts not found${NC}"
    exit 1
fi
echo ""

# Test 2: Check if AnalyticsProvider is in layout
echo "📄 Test 2: Checking AnalyticsProvider integration..."
if grep -q "AnalyticsProvider" src/app/layout.tsx; then
    echo -e "${GREEN}✅ AnalyticsProvider is integrated in layout${NC}"
else
    echo -e "${RED}❌ AnalyticsProvider not found in layout${NC}"
    exit 1
fi
echo ""

# Test 3: Check if events are defined
echo "📊 Test 3: Checking event definitions..."
if grep -q "match_share_generated" src/lib/analytics.ts && \
   grep -q "match_share_viewed" src/lib/analytics.ts; then
    echo -e "${GREEN}✅ match_share_generated and match_share_viewed events are defined${NC}"
else
    echo -e "${RED}❌ Required events not found${NC}"
    exit 1
fi
echo ""

# Test 4: Check if ShareMatchButton uses trackEvent
echo "📄 Test 4: Checking ShareMatchButton tracking..."
if grep -q "match_share_generated" "src/app/g/[slug]/(protected)/matches/[id]/ShareMatchButton.tsx"; then
    echo -e "${GREEN}✅ ShareMatchButton tracks match_share_generated event${NC}"
else
    echo -e "${YELLOW}⚠️  ShareMatchButton may not be tracking events (file may not exist yet)${NC}"
fi
echo ""

# Test 5: Check if ShareMatchTracker uses trackEvent
echo "📄 Test 5: Checking ShareMatchTracker tracking..."
if grep -q "match_share_viewed" "src/app/g/[slug]/match-share/[token]/ShareMatchTracker.tsx" 2>/dev/null; then
    echo -e "${GREEN}✅ ShareMatchTracker tracks match_share_viewed event${NC}"
else
    echo -e "${YELLOW}⚠️  ShareMatchTracker may not be tracking events (file may not exist yet)${NC}"
fi
echo ""

# Test 6: Check environment variable documentation
echo "📋 Test 6: Checking environment variable documentation..."
if grep -q "NEXT_PUBLIC_GA4_MEASUREMENT_ID" .env.example 2>/dev/null; then
    echo -e "${GREEN}✅ GA4 measurement ID documented in .env.example${NC}"
else
    echo -e "${YELLOW}⚠️  GA4 measurement ID not documented in .env.example${NC}"
fi
echo ""

echo "==================================="
echo "🎉 Automated tests completed!"
echo ""
echo -e "${YELLOW}⚠️  Manual Testing Required:${NC}"
echo ""
echo "To manually test analytics events:"
echo ""
echo "1. Open http://localhost:3000 in your browser"
echo "2. Open Developer Tools (F12) → Console tab"
echo "3. Navigate to a group and match page"
echo "4. Click 'Share Match' button"
echo "5. Look for console log: [Analytics] match_share_generated"
echo "6. Generate and open a share link"
echo "7. Look for console log: [Analytics] match_share_viewed"
echo ""
echo "Expected console output:"
echo "  [Analytics] Initialized with GA4: <measurement_id> or console-only mode"
echo "  [Analytics] match_share_generated { match_id: '...', group_slug: '...' }"
echo "  [Analytics] match_share_viewed { match_id: '...', group_slug: '...' }"
echo ""
echo "For production testing:"
echo "- Set NEXT_PUBLIC_GA4_MEASUREMENT_ID in environment"
echo "- Enable DebugView in GA4 (Configure → DebugView)"
echo "- Use ?debug_mode=1 query param for detailed event data"
echo ""
