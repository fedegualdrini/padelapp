# Testing Standards

## Test Types

### Unit Tests (Vitest)
```typescript
// tests/unit/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/src/lib/myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    // Edge case test
  });
});
```

### E2E Tests (Playwright)
```typescript
// tests/e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete action', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="button"]');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## Test Organization

### Directory Structure
```
tests/
├── e2e/
│   ├── auth/           # Authentication flows
│   ├── groups/         # Group management
│   └── matches/        # Match creation/editing
├── unit/
│   ├── components/     # Component tests
│   └── lib/           # Utility function tests
└── e2e/.auth/         # Authenticated test state
```

## Testing Patterns

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('component renders correctly', () => {
  render(<Component />);
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});

test('interaction works', async () => {
  render(<Component />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByText('Result')).toBeInTheDocument();
});
```

### API Testing
```typescript
test('API returns correct data', async () => {
  const response = await request.get('/api/endpoint');
  expect(response.status()).toBe(200);
  
  const data = await response.json();
  expect(data).toHaveProperty('expectedField');
});
```

### E2E Authentication
```typescript
test('authenticated user flow', async ({ page }) => {
  // Use pre-authenticated state
  await page.goto('/g/test-group');
  await page.context().addCookies([{
    name: 'sb-session',
    value: authToken,
    domain: 'localhost'
  }]);
  // Proceed with test
});
```

## Test Commands

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit          # Vitest unit tests
npm run test:e2e           # Playwright E2E tests
npm run test:db            # Database tests
npm run test:e2e:full      # Full E2E suite

# Check before committing
npm run typecheck          # TypeScript checking
npm run lint              # ESLint
```

## Test Data

### Fixtures
Store test data in `tests/e2e/.auth/` for authenticated state.

### Test Groups/Matches
Use specific test groups in database separated from production data.

## E2E Best Practices

### Page Object Model
```typescript
// Create reusable page interactions
export class MatchPage {
  constructor(private page: Page) {}
  
  async createMatch(data: MatchData) {
    await this.page.fill('[name="team1"]', data.team1);
    await this.page.fill('[name="team2"]', data.team2);
    await this.page.click('button[type="submit"]');
  }
}
```

### Test Selectors
```typescript
// Prefer semantic selectors
await page.click('text=Create Match');
await page.fill('input[name="playerName"]');

// Use data-testid for specific elements
await page.click('[data-testid="submit-button"]');
```

## Conventions

### Test Naming
```typescript
// Descriptive test names
describe('MatchService', () => {
  describe('createMatch', () => {
    it('should create a valid match', () => {
      // test
    });
  });
});

// E2E test names
test('user can create a match with valid data', async () => {
  // test
});
```

### Test Cleanup
```typescript
test.afterEach(async () => {
  await supabase.from('test_matches').delete().match({ test_id });
});
```

## Anti-patterns (Avoid)
- Don't test implementation details
- Don't skip tests without TODO comment
- Don't hardcode test data that's likely to change
- Don't forget to cleanup test data
- Don't access real production data in tests
