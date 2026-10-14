import { defineConfig, devices } from '@playwright/test';

// Real-browser journeys against the built site served by the real Worker (wrangler dev, local only). Build first:
// `npm run qa` does both. Contact submissions are answered by route mocks in the specs, so no mail is sent and no
// provider is contacted; the submission pipeline itself is proven by the Vitest workerd projects.
const PORT = 8788;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './artifacts/test-results',
  fullyParallel: true,
  // wrangler dev is a local single process; more parallel pages make the Pile's 2 s bootstrap escape fire by design.
  workers: 2,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `npx wrangler dev --port ${PORT} --ip 127.0.0.1 --var CONTACT_FORM_SECRET:e2e-form-secret-not-real --var TURNSTILE_SECRET_KEY:1x0000000000000000000000000000000AA`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /responsive\.spec\.ts/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec\.ts/ },
    // History, restoration and motion differ by engine. Opt in once their browsers are installed for this Playwright
    // version (npx playwright install firefox webkit): QA_ALL_BROWSERS=1 npm run qa.
    ...(process.env.QA_ALL_BROWSERS
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 860 } }, testMatch: /pile\.spec\.ts/ },
          { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 860 } }, testMatch: /pile\.spec\.ts/ },
        ]
      : []),
  ],
});
