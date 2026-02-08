import { defineConfig, devices } from '@playwright/test';

const useWebServer = process.env.PW_NO_WEB_SERVER !== '1';
const useSystemChrome = process.env.PW_USE_SYSTEM_CHROME === '1';
const port = Number(process.env.PW_PORT ?? '8787');
const baseURL = process.env.PW_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-gpu'],
        },
        ...(useSystemChrome ? { channel: 'chrome' } : {}),
      },
    },
  ],
  ...(useWebServer ? {
    webServer: {
      // NOTE: do not use --no-bundle; this Worker relies on bundling for module resolution.
      command: `npm run build && wrangler dev --local --no-live-reload --ip 127.0.0.1 --port ${port} --inspector-port 0 --log-level none`,
      url: baseURL,
      env: {
        WRANGLER_LOG_PATH: '.wrangler/logs'
      },
      reuseExistingServer: !process.env.CI,
      timeout: 600000,
    }
  } : {}),
});
