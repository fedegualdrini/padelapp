**CRITICAL: E2E TEST CREATION FOR NEW FEATURES**

For EVERY feature you implement, you MUST create or update E2E tests:

1. **Read the spec** thoroughly to understand what needs to be tested

2. **Create/update E2E test file** at `tests/e2e/[feature-name].spec.ts`:
   - Test all happy paths (success scenarios)
   - Test error paths (edge cases, invalid input)
   - Test data integrity (CRUD operations work correctly)
   - Test user flows (complete user journeys)

3. **Update test fixtures** if needed:
   - `tests/e2e/fixtures/players.json` - if feature involves players
   - `tests/e2e/fixtures/matches.json` - if feature involves matches
   - `tests/e2e/fixtures/events.json` - if feature involves events
   - `tests/e2e/fixtures/venues.json` - if feature involves venues
   - `tests/e2e/fixtures/badges.json` - if feature involves badges

4. **Use test helpers** from `tests/e2e/test-helpers.ts`:
   - Import and use reusable test utilities
   - Follow existing test patterns
   - Keep tests deterministic and isolated

5. **Run E2E tests** before committing:
   ```bash
   set -a; source .env.test; set +a; npx playwright test tests/e2e/[feature-name].spec.ts
   ```

6. **If tests fail**:
   - Fix the implementation or the test
   - Re-run tests until they pass
   - Do NOT commit until tests pass

**TEST CREATION WORKFLOW:**

After implementing the feature, before running tests:

1. **Create test file** if doesn't exist:
   ```bash
   touch tests/e2e/[feature-name].spec.ts
   ```

2. **Add test imports and setup**:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('[Feature Name]', () => {
     test.beforeEach(async ({ page }) => {
       // Navigate to relevant page
       await page.goto('/g/padel/[route]');
       await page.waitForLoadState('networkidle');
     });
   ```

3. **Add tests for user flows**:
   - User can [action]
   - User can [action] successfully
   - User sees error when [invalid action]

4. **Add tests for data operations**:
   - Create [entity] works
   - Read [entity] works
   - Update [entity] works
   - Delete [entity] works

5. **Add tests for edge cases**:
   - Handles empty state
   - Handles invalid input
   - Handles network errors

6. **Run tests**:
   ```bash
   npx playwright test tests/e2e/[feature-name].spec.ts
   ```

**PROGRESS TRACKING UPDATE:**

Add these checkpoints to your progress tracking:
  - 40%: Creating E2E tests for the feature
  - 50%: Running E2E tests
  - 60%: Fixing test failures (if any)

**CONSTRAINTS UPDATE:**

- **CRITICAL**: Must create/update E2E tests for every feature implemented
- **CRITICAL**: Tests must pass before committing
- **CRITICAL**: Use test helpers from `tests/e2e/test-helpers.ts`
- **CRITICAL**: Update test fixtures if feature adds new data types

**EXAMPLE TEST CREATION:**

If implementing "Tournament Management" feature:

1. Create `tests/e2e/tournaments.spec.ts`
2. Add tests:
   - User can create a new tournament
   - Tournament appears in tournaments list
   - User can edit tournament details
   - User can register for tournament
   - Tournament bracket displays correctly
3. Update `tests/e2e/fixtures/events.json` with tournament events
4. Run tests and verify pass

---

**Copy this section and paste it into the builder prompt before the "PRE-CHECK" section.**
