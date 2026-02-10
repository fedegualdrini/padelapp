# Padelapp Test Suite Improvement Plan

**Date**: 2026-01-30
**Goal**: Create comprehensive E2E test suite that prevents breakage when implementing new features

## Current State

**Builder Cron**: Re-enabled with `testGateEnabled: true`

**Problems Identified**:
1. No automated E2E test running before commits
2. Missing test data for new features
3. No test coverage for core app flows
4. Core features break when new features added

## Proposed Test Suite Architecture

### 1. Core User Flows Tests
**File**: `tests/e2e/core-flows.spec.ts` (NEW)

Tests to cover:
```
✅ Create Group Flow
  - Join with passphrase
  - Verify group created
  - Navigate to dashboard

✅ Add Player Flow
  - Add new player to group
  - Verify player appears in ranking

✅ Create Match Flow
  - Navigate to "Nuevo partido"
  - Select players (if doubles)
  - Set match details (date, time, court)
  - Create match
  - Verify match appears in match list
  - Check ELO updates in ranking

✅ Add Event Flow
  - Navigate to "Nuevo evento"
  - Select event type (match, tournament, social)
  - Set date/time and invite players
  - Create event
  - Verify event appears in events list
  - Check RSVP functionality

✅ Edit Match Flow
  - Open existing match from list
  - Change players/score
  - Save changes
  - Verify updates reflected in list and ranking
```

### 2. Ranking & ELO System Tests
**File**: `tests/e2e/ranking-elo.spec.ts` (NEW)

Tests to cover:
```
✅ ELO Calculations
  - Verify ELO increases after win
  - Verify ELO decreases after loss
  - Check ELO doesn't change after cancelled match
  - Verify ELO margin calculations correct

✅ Ranking Display
  - Verify ranking order is correct
  - Check player names display
  - Verify ELO and points visible
  - Check pagination works

✅ Ranking Share
  - Generate share link
  - Verify share URL is accessible
  - Check shared ranking shows public data (no private info)

✅ Player Stats
  - Navigate to player profile
  - Verify win rate calculation
  - Check ELO movement chart
  - Verify matches played count
```

### 3. Authentication & Access Tests
**File**: `tests/e2e/auth.spec.ts` (NEW)

Tests to cover:
```
✅ Group Join
  - Valid passphrase works
  - Invalid passphrase shows error
  - Anonymous user can join
  - Session persists after refresh

✅ Logout
  - Click logout button
  - Verify redirected to home
  - Check session cleared

✅ Protected Routes
  - Try to access protected route without joining
  - Verify 404 or redirect to join page
```

### 4. Venues System Tests
**File**: `tests/e2e/venues.spec.ts` (EXISTS - expand)

Add tests for:
```
✅ Venue Creation Flow
  - Admin clicks "Agregar cancha"
  - Fill all required fields
  - Submit and verify venue created
  - Check venue appears in list

✅ Venue Management
  - Edit venue details
  - Verify updates saved
  - Delete venue (with confirmation)
  - Check cascade delete works

✅ Rating System
  - Submit rating with all 6 dimensions
  - Verify overall rating calculated correctly
  - Update existing rating
  - Verify review text display
  - Check rating appears in analytics
```

### 5. Challenges System Tests
**File**: `tests/e2e/challenges.spec.ts` (EXISTS - expand)

Add tests for:
```
✅ Challenge Progress Tracking
  - Complete a challenge (e.g., play 3 matches)
  - Verify progress updates immediately
  - Check challenge status changes to "Completado"

✅ Weekly Reset
  - Verify challenges reset at week start
  - Check old progress archived
  - Verify new challenges created

✅ Badge System
  - Earn a badge for first time
  - Verify badge appears in profile
  - Check badge count increases

✅ Streak Tracking
  - Complete challenges multiple weeks in a row
  - Verify streak count increases
  - Check streak badge awarded
  - Verify longest streak updates

✅ Weekly Leaderboard
  - Verify leaderboard displays correct order
  - Check points calculation
  - Verify ties handled correctly
```

### 6. API & Data Integrity Tests
**File**: `tests/e2e/api-integrity.spec.ts` (NEW)

Tests to cover:
```
✅ Database Migrations
  - Verify new tables created after migration
  - Check indexes are present
  - Verify RLS policies are active

✅ CRUD Operations
  - Create operation succeeds
  - Read operation returns correct data
  - Update operation modifies data
  - Delete operation removes records
  - Verify foreign key constraints

✅ Concurrent Operations
  - Multiple users creating matches simultaneously
  - Verify no race conditions
  - Check data integrity maintained

✅ Data Seeding
  - Verify seed.sql data loads correctly
  - Check test fixtures are consistent
  - Verify relationships are valid
```

## Builder Workflow Improvements

### Before Implementation (Current State)
```
Feature Complete → No tests → Commit → Push to claudio
```

### Proposed New Workflow
```
1. Create/Update Feature Spec
       ↓
2. Generate/Update Test Data (seed.sql)
       ↓
3. Write/Update E2E Tests
       ↓
4. Run E2E Tests (automated)
       ↓
5. If Tests FAIL → Fix → Re-run Tests
       ↓
6. If Tests PASS → Commit → Push to claudio
       ↓
7. Verify with manual smoke test
```

### Implementation Steps

#### Step 1: Update Test Data Management
**File**: `scripts/manage-test-data.sh` (NEW)

Create a script to:
```bash
# Add test data for specific feature
./scripts/manage-test-data.sh add venue --name "Test Club" --address "Test Address"
./scripts/manage-test-data.sh add challenge --type "volume" --target 5
./scripts/manage-test-data.sh add player --name "Test Player"
./scripts/manage-test-data.sh cleanup --keep-venues
```

#### Step 2: Create Test Generator
**File**: `scripts/generate-test-fixtures.js` (NEW)

Utility to generate test fixtures:
- Create test groups
- Generate test players with ELO ratings
- Create test match scenarios (wins, losses, cancellations)
- Generate test events
- Create test venues with ratings
- Setup test data for edge cases

#### Step 3: Update Builder with Test Gate
**Modify**: `cron/` configuration
- Add flag: `alwaysCreateTestFixtures: true/false`
- When true, builder automatically runs test generator before starting
- When false, builder uses existing test data

#### Step 4: Run E2E Tests as Part of Build
**Modify**: Builder workflow
- After feature implementation, run E2E tests automatically
- If tests fail, block commit
- Show test results summary
- Only allow commit if all E2E tests pass

#### Step 5: Create Test Data Validator
**File**: `scripts/validate-test-data.js` (NEW)

Validates:
- All test players exist
- Venues have required relationships
- Matches have valid players
- ELO calculations are consistent
- RLS policies are working

## Test Suite Organization

```
tests/e2e/
├── core-flows.spec.ts          # Basic user journeys
├── auth.spec.ts                # Authentication
├── ranking-elo.spec.ts         # Ranking & ELO
├── venues.spec.ts              # Venues (expand)
├── challenges.spec.ts          # Challenges (expand)
├── api-integrity.spec.ts      # API & data
├── fixtures/
│   ├── players.json          # Test players data
│   ├── matches.json          # Test matches
│   ├── events.json           # Test events
│   └── venues.json           # Test venues
└── utils/
    ├── test-helpers.ts    # Reusable test utilities
    └── data-generator.ts  # Test data generator
```

## Priority Implementation

### Phase 1: Foundation (Week 1)
- [ ] Create `core-flows.spec.ts`
- [ ] Create `auth.spec.ts`
- [ ] Create `test-helpers.ts`
- [ ] Create `data-generator.js`
- [ ] Create `manage-test-data.sh`
- [ ] Update builder with test gate configuration

### Phase 2: Core Features (Week 1-2)
- [ ] Expand `venues.spec.ts` (add creation/management tests)
- [ ] Expand `challenges.spec.ts` (add progress/award tests)
- [ ] Create `ranking-elo.spec.ts`
- [ ] Add fixtures for players and matches

### Phase 3: Advanced Features (Week 3-4)
- [ ] Create `api-integrity.spec.ts`
- [ ] Create event management tests
- [ ] Create tournament system tests
- [ ] Add venue/challenges fixtures

## Test Gate Configuration

### Option 1: Pre-Commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:e2e:quick"
    }
  }
}
```

### Option 2: Builder Flag
Update builder cron job config to enforce:
```yaml
testGateEnabled: true
testGateCommands:
  - npm run test:e2e:quick
  - npm run test:e2e:full
alwaysCreateTestFixtures: false
```

## Questions for Implementation

1. **Test Data Strategy**: Should we use a separate test database schema with only tables we're testing, or share the main schema with comprehensive fixtures?

2. **Test Cleanup**: Should tests clean up after themselves? (Delete test groups/players, reset ELOs, etc.)

3. **Test Isolation**: Should each test run in a fresh database, or can tests share state? (Currently they share - might be causing issues)

4. **Test Execution**: Should builder run E2E tests after each feature, or should you manually run tests before committing?

5. **Test Scope**: What test coverage percentage is acceptable? (Aim for 70-80% of user-facing features)

6. **Automation Level**: Should builder automatically create test data, or should you create it manually via spec?

---

**Status**: Plan ready for review and implementation feedback
