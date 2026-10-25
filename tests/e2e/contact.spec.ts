import { expect, test, type Page } from '@playwright/test';

// Turnstile is replaced by a local stand-in that passes at once; submissions are answered by route mocks, so the
// page's states are exercised without mail or provider traffic. The pipeline itself is proven in workerd by Vitest.
// The few submissions that reach the local Worker are built to stop at its token or validation stage, before the
// Turnstile check and before any send.
async function stubTurnstile(page: Page) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      // Like the real widget, a reset answers again on its own a moment later.
      body: `window.turnstile={render:(el,o)=>{window.__ts=o;setTimeout(()=>o.callback('stub-token'),10);return 'w1'},reset(){setTimeout(()=>window.__ts.callback('stub-token'),10)}};window.onTurnstileLoaded&&window.onTurnstileLoaded();`,
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

const RENEWAL = { ok: false, outcome: 'rejected', message: 'This form needs refreshing before it can send, so nothing was sent. Get a fresh form and send again.', retryable: false, renewForm: true };
const formToken = (post: string | null) => /name="form-token"\r\n\r\n([^\r]+)/.exec(post ?? '')?.[1] ?? '';

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

test('failed: Try again is ready to send once the bot check has answered again', async ({ page }) => {
  await page.goto('/contact/');
  await answer(page, { ok: false, outcome: 'failed', message: 'The message was not sent; nothing reached the inbox. Your text is kept in the form.', retryable: true }, 503);
  await fill(page);
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-outcome]')).toContainText('Your message was not sent.');
  await page.locator('[data-retry]').click();
  await expect(page.locator('[data-submit]')).toBeEnabled();
});

test('expired form: renews its token in place, keeps the draft and sends with the fresh token', async ({ page }) => {
  await page.goto('/contact/');
  const tokens: string[] = [];
  await page.route('**/contact/', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    tokens.push(formToken(route.request().postData()));
    if (tokens.length === 1) {
      return route.fulfill({ status: 400, json: RENEWAL });
    }
    return route.fulfill({ json: { ok: true, outcome: 'sent', reference: 'WW-20261025-RENEW', message: 'Your message reached the inbox and a copy was emailed to ada@example.org.', retryable: false } });
  });
  await fill(page);
  await page.locator('[data-submit]').click();
  const outcome = page.locator('[data-outcome]');
  await expect(outcome).toContainText('Form refreshed. Your text is still here. Please send again.');
  await outcome.locator('[data-retry]').click();
  await expect(page.locator('#message')).toHaveValue('Hi Wolf, is that on purpose?');
  await expect(page.getByLabel('Subject')).toHaveValue('diffdevil counted my rename');
  await page.locator('[data-submit]').click();
  await expect(outcome).toContainText('Thanks. Your message is on its way.');
  expect(tokens).toHaveLength(2);
  expect(tokens[0]).toMatch(/^\d+\.[0-9a-f]{64}$/);
  expect(tokens[1]).toMatch(/^\d+\.[0-9a-f]{64}$/);
  expect(tokens[1]).not.toBe(tokens[0]);
});

test('expired form: when no fresh form can be fetched, the draft stays and nothing claims a safe reload', async ({ page }) => {
  await page.goto('/contact/');
  await page.route('**/contact/', (route) => route.request().method() === 'POST'
    ? route.fulfill({ status: 400, json: RENEWAL })
    : route.abort());
  await fill(page);
  await page.locator('[data-submit]').click();
  const outcome = page.locator('[data-outcome]');
  await expect(outcome).toContainText('a fresh one couldn’t be fetched just now');
  await expect(outcome.locator('[data-fallback-email]')).toBeVisible();
  await outcome.locator('[data-retry]').click();
  await expect(page.locator('#message')).toHaveValue('Hi Wolf, is that on purpose?');
});

test('server field errors land on their fields', async ({ page }) => {
  await page.goto('/contact/');
  await answer(page, { ok: false, outcome: 'invalid', message: 'Some fields need attention.', errors: [{ field: 'email', message: 'Enter a valid email address.' }], retryable: false }, 422);
  await fill(page);
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-error-summary]')).toContainText('Enter a valid email address.');
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
});

test('expired form: a slow refresh keeps the whole submission pending, so nothing sends twice or overwrites the result', async ({ page }) => {
  await page.goto('/contact/');
  const tokens: string[] = [];
  let releaseRefresh!: () => void;
  const refreshHeld = new Promise<void>((resolve) => { releaseRefresh = resolve; });
  let refreshes = 0;
  await page.route('**/contact/', async (route) => {
    if (route.request().method() === 'POST') {
      tokens.push(formToken(route.request().postData()));
      return tokens.length === 1
        ? route.fulfill({ status: 400, json: RENEWAL })
        : route.fulfill({ json: { ok: true, outcome: 'sent', reference: 'WW-20261025-ORDER', message: 'Your message reached the inbox and a copy was emailed to ada@example.org.', retryable: false } });
    }
    if (route.request().resourceType() === 'fetch' && ++refreshes === 1) await refreshHeld;
    return route.continue();
  });
  await fill(page);
  const send = page.locator('[data-submit]');
  await send.click();

  // The refresh is slow. The bot check answers again meanwhile (the stand-in does so 10 ms after its reset), which
  // used to re-enable Send on the still visible form: a second send could then start a second, overtaking refresh.
  await expect.poll(() => refreshes).toBe(1);
  await page.waitForTimeout(300);
  await expect(page.locator('[data-contact-form]')).toBeVisible();
  await expect(send).toBeDisabled();
  await expect(page.locator('[data-submit-note]')).toHaveText('Refreshing the form…');
  await page.locator('[data-contact-form]').evaluate((form: HTMLFormElement) => form.requestSubmit());
  await page.getByLabel('Subject').press('Enter');
  await page.waitForTimeout(300);
  expect(tokens).toHaveLength(1);

  releaseRefresh();
  const outcome = page.locator('[data-outcome]');
  await expect(outcome).toContainText('Form refreshed. Your text is still here. Please send again.');
  await outcome.locator('[data-retry]').click();
  await send.click();
  await expect(outcome).toContainText('Thanks. Your message is on its way.');
  // Nothing still in flight can arrive later and replace the result.
  await page.waitForTimeout(1000);
  await expect(outcome).toContainText('Thanks. Your message is on its way.');
  await expect(outcome.locator('[data-retry]')).toBeHidden();
  expect(refreshes).toBe(1);
  expect(tokens).toHaveLength(2);
  expect(tokens[1]).not.toBe(tokens[0]);
});

test('expired form: a refresh that never answers ends honestly and keeps the draft', async ({ page }) => {
  await page.clock.install();
  await page.goto('/contact/');
  await page.route('**/contact/', (route) => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 400, json: RENEWAL });
    // The refresh hangs; the page's own 15-second bound must end the pending submission.
    if (route.request().resourceType() === 'fetch') return new Promise<void>(() => {});
    return route.continue();
  });
  await fill(page);
  await page.clock.runFor(100);
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-submit-note]')).toHaveText('Refreshing the form…');
  await page.clock.runFor(15_500);
  const outcome = page.locator('[data-outcome]');
  await expect(outcome).toContainText('a fresh one couldn’t be fetched just now');
  await outcome.locator('[data-retry]').click();
  await expect(page.locator('#message')).toHaveValue('Hi Wolf, is that on purpose?');
});

test('the real Worker refuses a freshly issued token that is sent at once', async ({ page }) => {
  // The boundary a refreshed form waits out, observed in this composition rather than assumed.
  const html = await (await page.request.get('/contact/')).text();
  const token = /data-form-token="([^"]+)"/.exec(html)?.[1] ?? '';
  expect(token).toMatch(/^\d+\.[0-9a-f]{64}$/);
  const answer = await page.request.post('/contact/', { headers: { Origin: 'http://127.0.0.1:8788', Accept: 'application/json' }, multipart: { 'form-token': token } });
  expect(answer.status()).toBe(400);
  expect(await answer.json()).toMatchObject({ outcome: 'rejected', message: 'That was quick. Take a moment, then send again.', retryable: true });
});

test('expired form against the real Worker: the refreshed token waits out the minimum age, then passes it', async ({ page }) => {
  await page.goto('/contact/');
  const answers: { status: number; body: Record<string, unknown> }[] = [];
  page.on('response', async (response) => {
    if (response.request().method() === 'POST') answers.push({ status: response.status(), body: await response.json() });
  });
  await fill(page);
  // A signature from another secret: what a secret rotation leaves in an open tab. The real Worker asks for renewal.
  await page.locator('input[data-form-token]').evaluate((input: HTMLInputElement) => { input.value = input.value.replace(/\.[0-9a-f]{64}$/, `.${'0'.repeat(64)}`); });
  await page.locator('[data-submit]').click();
  const outcome = page.locator('[data-outcome]');
  await expect(outcome).toContainText('Form refreshed. Your text is still here. Please send again.');
  expect(answers[0]).toMatchObject({ status: 400, body: { renewForm: true } });

  const refreshedAt = Date.now();
  await outcome.locator('[data-retry]').click();
  const send = page.locator('[data-submit]');
  await expect(send).toBeDisabled();
  await expect(page.locator('[data-submit-note]')).toHaveText('Getting the fresh form ready…');
  // Stop the real submission at validation: after the token stage, before the Turnstile check and any send.
  await page.locator('input[name="category"]:checked').evaluate((radio: HTMLInputElement) => { radio.value = 'not-a-category'; });
  await expect(send).toBeEnabled({ timeout: 6000 });
  expect(Date.now() - refreshedAt).toBeGreaterThan(3000);
  await send.click();
  await expect(page.locator('[data-error-summary]')).toContainText('Choose what the message is about.');
  await expect.poll(() => answers.length).toBe(2);
  expect(answers[1]).toMatchObject({ status: 422, body: { outcome: 'invalid' } });
});

test('sent: Write another is ready to send once the bot check has answered again', async ({ page }) => {
  await page.goto('/contact/');
  await answer(page, { ok: true, outcome: 'sent', reference: 'WW-20261025-AGAIN', message: 'Your message reached the inbox.', retryable: false });
  await fill(page);
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-outcome]')).toContainText('Thanks.');
  await page.locator('[data-another]').click();
  await expect(page.locator('[data-submit]')).toBeEnabled();
});
