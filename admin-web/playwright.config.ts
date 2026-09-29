import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.E2E_WEB_PORT || '3001');
if (!Number.isInteger(webPort) || webPort < 1024 || webPort > 65535) {
  throw new Error('E2E_WEB_PORT must be an integer between 1024 and 65535.');
}

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  /*
    One retry on the build server and none here. A browser on a shared runner
    stalls for reasons that have nothing to do with the application, and a
    suite that cries wolf stops being read; a test that only passes on the
    retry is still reported as flaky, so nothing is hidden.
  */
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || `http://127.0.0.1:${webPort}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${webPort} --strictPort`,
    url: `http://127.0.0.1:${webPort}`,
    reuseExistingServer: process.env.E2E_REUSE_SERVER !== 'false',
    timeout: 120_000,
  },
});
