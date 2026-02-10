#!/bin/bash
# Verify test database has required data for venues and challenges

echo "🔍 Verifying test database setup..."
echo ""

# Check if we can connect to the test database
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql not found. Please install PostgreSQL client."
    exit 1
fi

# Test database connection
echo "Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database. Check DATABASE_URL."
    exit 1
fi

echo ""
echo "Checking required tables..."

# Check venues table
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM venues" > /dev/null 2>&1; then
    VENUE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM venues" | xargs)
    echo "✅ venues table exists ($VENUE_COUNT venues)"
else
    echo "❌ venues table missing - run migrations"
fi

# Check venue_ratings table
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM venue_ratings" > /dev/null 2>&1; then
    RATING_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM venue_ratings" | xargs)
    echo "✅ venue_ratings table exists ($RATING_COUNT ratings)"
else
    echo "❌ venue_ratings table missing - run migrations"
fi

# Check venue_analytics materialized view
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM venue_analytics" > /dev/null 2>&1; then
    echo "✅ venue_analytics materialized view exists"
else
    echo "❌ venue_analytics view missing - run migrations"
fi

# Check challenges tables
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM weekly_challenges" > /dev/null 2>&1; then
    CHALLENGE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM weekly_challenges" | xargs)
    echo "✅ weekly_challenges table exists ($CHALLENGE_COUNT challenges)"
else
    echo "❌ weekly_challenges table missing - run migrations"
fi

# Check badges table
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM badges" > /dev/null 2>&1; then
    BADGE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM badges" | xargs)
    echo "✅ badges table exists ($BADGE_COUNT badges)"
else
    echo "❌ badges table missing - run migrations"
fi

# Check streaks table
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM streaks" > /dev/null 2>&1; then
    STREAK_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM streaks" | xargs)
    echo "✅ streaks table exists ($STREAK_COUNT streaks)"
else
    echo "❌ streaks table missing - run migrations"
fi

echo ""
echo "Checking seed data..."

# Check if test group exists
if psql "$DATABASE_URL" -c "SELECT EXISTS(SELECT 1 FROM groups WHERE slug = 'padel')" | grep -q "t"; then
    echo "✅ Test group 'padel' exists"
else
    echo "❌ Test group 'padel' missing - run test:db"
fi

# Check if test players exist
PLAYER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM players WHERE group_id IN (SELECT id FROM groups WHERE slug = 'padel')" | xargs)
if [ "$PLAYER_COUNT" -gt 0 ]; then
    echo "✅ Test players exist ($PLAYER_COUNT players)"
else
    echo "❌ Test players missing - run test:db"
fi

# Check if test venues exist
TEST_VENUES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM venues WHERE group_id IN (SELECT id FROM groups WHERE slug = 'padel')" | xargs)
if [ "$TEST_VENUES" -gt 0 ]; then
    echo "✅ Test venues exist ($TEST_VENUES venues)"
else
    echo "⚠️  Test venues missing - seed.sql needs update"
fi

echo ""
echo "✨ Verification complete!"
echo ""
echo "To reset test database with all data:"
echo "  npm run test:db"
echo ""
echo "To run E2E tests:"
echo "  npm run test:e2e"
