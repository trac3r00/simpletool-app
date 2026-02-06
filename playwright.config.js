import { defineConfig, devices } from '@playwright/test';

const useWebServer = process.env.PW_NO_WEB_SERVER !== '1';
const useSystemChrome = process.env.PW_USE_SYSTEM_CHROME === '1';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:8787',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(useSystemChrome ? { channel: 'chrome' } : {}),
      },
    },
  ],
  ...(useWebServer ? {
    webServer: {
      command: 'npm run build && wrangler dev --ip 127.0.0.1 --port 8787 --inspector-port 0',
      url: 'http://127.0.0.1:8787',
      env: {
        WRANGLER_LOG_PATH: '.wrangler/logs'
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    }
  } : {}),
});
