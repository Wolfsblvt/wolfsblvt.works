import { expect, test, type Page } from '@playwright/test';

// Turnstile is replaced by a local stand-in that passes at once; submissions are answered by route mocks, so the
// page's states are exercised without mail or provider traffic. The pipeline itself is proven in workerd by Vitest.
async function stubTurnstile(page: Page) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.turnstile={render:(el,o)=>{setTimeout(()=>o.callback('stub-token'),10);return 'w1'},reset(){}};window.onTurnstileLoaded&&window.onTurnstileLoaded();`,
    }),
  );
}

async function fill(page: Page) {
  await page.getByRole('radio', { name: 'A project' }).check();
  await page.getByLabel('Your email').fill('ada@example.org');
  await page.getByLabel('Subject').fill('diffdevil counted my rename');
  await page.getByLabel('Your message').fill('Hi Wolf, is that on purpose?');
}

function answer(page: Page, body: Record<string, unknown>, status = 200) {
  return page.route('**/contact/', (route) => (route.request().method() === 'POST' ? route.fulfill({ status, json: body }) : route.continue()));
}

test.beforeEach(async ({ page }) => stubTurnstile(page));

test('the Worker prepares the form and the button waits for the bot check', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('[data-contact-form]')).toHaveAttribute('data-form-token', /^\d+\.[0-9a-f]{64}$/);
  await expect(page.locator('[data-submit]')).toBeEnabled();
});

test('missing fields are summarised, linked and focused', async ({ page }) => {
  await page.goto('/contact/');
  await page.locator('[data-submit]').click();
  const summary = page.locator('[data-error-summary]');
  await expect(summary).toBeFocused();
  await expect(summary).toContainText('Please check 4 fields.');
  await summary.getByText('Choose what the message is about.').click();
  await expect(page.locator('#category')).toBeFocused();
  await expect(page.locator('#subject')).toHaveAttribute('aria-invalid', 'true');
});

test('arriving from a product preselects it and links back', async ({ page }) => {
  await page.goto('/contact/?product=diffdevil');
  await expect(page.locator('#product')).toHaveValue('diffdevil');
  await expect(page.locator('#product-search')).toHaveValue('diffdevil');
  await expect(page.locator('[data-product-context]')).toContainText('You came from diffdevil');
  await expect(page.locator('[data-from-back]')).toHaveAttribute('href', 'https://diffdevil.dev/');
});

test('an unknown product is ignored, never reflected', async ({ page }) => {
  await page.goto('/contact/?product=<b>nope</b>');
  await expect(page.locator('#product')).toHaveValue('');
  await expect(page.locator('[data-product-context]')).toBeHidden();
  await expect(page.locator('body')).not.toContainText('nope');
});

test('the picker is a searchable list kept in sync with the native select', async ({ page }) => {
  await page.goto('/contact/');
  const search = page.locator('#product-search');
  await search.click();
  await search.fill('dev');
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.locator('#product')).toHaveValue('diffdevil');
  await page.locator('[data-combo-clear]').click();
  await expect(page.locator('#product')).toHaveValue('');
});

test('sent: the Works words, the reference, and Yoru runs off with it', async ({ page }) => {
  await page.goto('/contact/');
  await answer(page, { ok: true, outcome: 'sent', reference: 'WW-20261014-ABCDE', message: 'Your message reached the inbox and a copy was emailed to ada@example.org. Nobody has necessarily read it yet, and there is no promised response time.', retryable: false });
  await fill(page);
  await page.locator('[data-submit]').click();
  const outcome = page.locator('[data-outcome]');
  await expect(outcome).toBeFocused();
  await expect(outcome).toContainText('Thanks. Your message is on its way.');
  await expect(outcome).toContainText('WW-20261014-ABCDE');
  await expect(outcome).toContainText('Yoru’s delivering it. mostly reliable.');
  await expect(page.locator('[data-contact-form]')).toBeHidden();
  // He runs off out of view with the message and isn't there afterwards; the next message brings him back.
  await expect(page.locator('.yoru-resident')).toBeHidden({ timeout: 15000 });
  await outcome.getByText('Write another').click();
  await expect(page.locator('[data-contact-form]')).toBeVisible();
  await expect(page.locator('.yoru-resident')).toBeVisible();
  await expect(page.locator('#subject')).toHaveValue('');
});

test('Contact on its own origin never opens acquaintance storage, including poking and a sent message', async ({ page }) => {
  // Serve the local Worker through Contact's real origin in the isolated browser; no public host is contacted.
  await page.route('https://contact.wolfsblvt.works/**', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ json: { ok: true, outcome: 'sent', reference: 'WW-20261024-ABCDE' } });
      return;
    }
    const url = new URL(route.request().url());
    const path = url.pathname === '/' ? '/contact/' : url.pathname;
    const response = await route.fetch({ url: `http://127.0.0.1:8788${path}${url.search}` });
    await route.fulfill({ response });
  });
  await page.addInitScript(() => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    let accesses = 0;
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { accesses++; return original.get!.call(window); } });
    Object.defineProperty(window, 'storageAccesses', { get: () => accesses });
  });
  await page.goto('https://contact.wolfsblvt.works/');
  await expect(page.locator('[data-submit]')).toBeEnabled();
  await page.locator('.yoru-resident').click();
  await page.waitForTimeout(2800);
  await expect(page.locator('.yoru-note')).toHaveCount(0);
  await fill(page);
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-outcome]')).toContainText('Thanks.');
  await expect(page.locator('.yoru-resident')).toBeHidden({ timeout: 15000 });
  expect(await page.evaluate(() => Reflect.get(window, 'storageAccesses'))).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('yoru.acquaintance'))).toBeNull();
});

test('sent, copy failed: says exactly that', async ({ page }) => {
  await page.goto('/contact/');
  await answer(page, { ok: true, outcome: 'sent-copy-failed', reference: 'WW-20261014-FGHJK', message: 'Your message reached the inbox, but the copy to ada@example.org could not be emailed. Keep the reference WW-20261014-FGHJK for your records.', retryable: false });
  await fill(page);
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-outcome]')).toContainText('It reached me. Your copy didn’t.');
});

test('failed: keeps the text, offers retry and the email address', async ({ page }) => {
  await page.goto('/contact/');
  await answer(page, { ok: false, outcome: 'failed', reference: 'WW-20261014-LMNPQ', message: 'The message was not sent; nothing reached the inbox. Your text is kept in the form.', retryable: true }, 503);
  await fill(page);
  await page.locator('[data-submit]').click();
  const outcome = page.locator('[data-outcome]');
  await expect(outcome).toContainText('Your message was not sent.');
  await expect(outcome.locator('[data-fallback-email]')).toBeVisible();
  await outcome.locator('[data-retry]').click();
  await expect(page.locator('#message')).toHaveValue('Hi Wolf, is that on purpose?');
  await expect(page.locator('#message')).toBeFocused();
});

test('server field errors land on their fields', async ({ page }) => {
  await page.goto('/contact/');
  await answer(page, { ok: false, outcome: 'invalid', message: 'Some fields need attention.', errors: [{ field: 'email', message: 'Enter a valid email address.' }], retryable: false }, 422);
  await fill(page);
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-error-summary]')).toContainText('Enter a valid email address.');
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
});
