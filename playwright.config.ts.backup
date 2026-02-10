import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    // Persist auth/session across tests to avoid flaky join flows.
    storageState: './tests/e2e/.auth/state.json',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
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

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    // Avoid reusing a stale dev server that may have started without the right env.
    reuseExistingServer: false,
    timeout: 120000,
  },
});
