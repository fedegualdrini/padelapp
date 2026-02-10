import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 300000, // 5 minutes - prevent infinite hangs
  reporter: [
    ['list'], // Console output during test run
    ['html', { open: 'never' }], // HTML report for debugging
    ['json', { outputFile: 'test-results/results.json' }], // Programmatic parsing
  ],
  use: {
    baseURL: 'http://localhost:3000',
    // Persist auth/session across tests to avoid flaky join flows.
    storageState: './tests/e2e/.auth/state.json',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 30000, // 30 seconds for clicks, fills, etc.
    navigationTimeout: 60000, // 60 seconds for page loads
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // More stable on small Linux hosts/CI where /dev/shm is tiny
          args: ['--disable-dev-shm-usage', '--no-sandbox'],
        },
      },
    },
  ],

  // Conditionally start dev server only in local development (not CI/Vercel)
  // In CI (Vercel, GitHub Actions), the build system handles the server
  ...(process.env.CI ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      // Avoid reusing a stale dev server that may have started without the right env.
      reuseExistingServer: false,
      timeout: 180000, // 3 minutes - give dev server more time to start
    },
  }),
});
