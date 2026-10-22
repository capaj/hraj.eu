import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './screenshots',
  testMatch: '**/*.spec.ts',
  testIgnore: process.env.SCREENSHOT_PATH ? [] : ['**/page.spec.ts'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:5174',
    locale: 'cs-CZ',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1100 } } },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      }
    }
  ],
  webServer: {
    command: 'node screenshots/serve.mjs',
    cwd: import.meta.dirname,
    url: 'http://127.0.0.1:5174/favicon.svg',
    reuseExistingServer: false,
    timeout: 120_000
  }
})
