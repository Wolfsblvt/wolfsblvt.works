import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

// Secrets the contact service expects in tests; the test-key pair is Turnstile's documented always-pass pair.
const testSecrets = {
  TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
  CONTACT_FORM_SECRET: 'test-form-secret-not-a-real-value',
};

// Three projects: pure modules and the contact handler with fakes run in Node; the contact seam and the site Worker
// run inside workerd through test-only configurations, so page preparation, routing and submissions meet the real
// runtime.
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] } },
      {
        plugins: [cloudflareTest({ wrangler: { configPath: './tests/fixtures/wrangler.test.jsonc' }, miniflare: { bindings: testSecrets } })],
        test: { name: 'contact-worker', include: ['tests/worker/contact.test.ts'] },
      },
      {
        plugins: [cloudflareTest({ wrangler: { configPath: './tests/fixtures/wrangler.site.test.jsonc' }, miniflare: { bindings: testSecrets } })],
        test: { name: 'site-worker', include: ['tests/worker/site.test.ts'] },
      },
    ],
  },
});