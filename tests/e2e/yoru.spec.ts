import { expect, test } from '@playwright/test';

// Yoru remembering a visitor: nothing is stored until they say so, and "Forget me" deletes it. Reduced motion makes his
// trips instant, so the journeys don't wait on his running.
test.use({ reducedMotion: 'reduce' });

const stored = (page: import('@playwright/test').Page) => page.evaluate(() => localStorage.getItem('yoru.acquaintance'));

test('in his nook he asks to remember the visitor; a yes stores his record, and Forget me deletes it', async ({ page }) => {
  await page.goto('/');
  expect(await stored(page)).toBeNull();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const note = page.locator('.yoru-note');
  await expect(note).toContainText('want me to remember you?', { timeout: 15000 });
  await note.getByRole('button', { name: 'remember me' }).click();
  await expect(note).toContainText('Yoru remembers you.');
  await expect(note.getByRole('button', { name: 'Forget me' })).toBeVisible();
  expect(JSON.parse((await stored(page)) ?? '{}')).toMatchObject({ version: 1, familiarity: 0, discovered: [] });

  await page.goto('/privacy/');
  const memory = page.locator('[data-yoru-memory]');
  await expect(memory).toContainText('Yoru remembers you on this browser.');
  await memory.getByRole('button', { name: 'Forget me' }).click();
  await expect(memory).toContainText('Forgotten.');
  expect(await stored(page)).toBeNull();
  // Leaving the page, where he was asleep with the old record in mind, must not bring it back.
  await page.goto('/impressum/');
  expect(await stored(page)).toBeNull();
});

test('not now closes his note and stores nothing', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const note = page.locator('.yoru-note');
  await expect(note).toBeVisible({ timeout: 15000 });
  await expect(note).toContainText('only in this browser.');
  await expect(note.getByRole('link', { name: 'what gets kept?' })).toHaveAttribute('href', '/privacy/#storage');
  const choices = await note.locator('button').evaluateAll(buttons => buttons.map(button => {
    const style = getComputedStyle(button);
    return { background: style.backgroundColor, border: style.border, color: style.color, font: style.font };
  }));
  expect(choices[0]).toEqual(choices[1]);
  await note.getByRole('button', { name: 'not now' }).click();
  await expect(note).toHaveCount(0);
  expect(await stored(page)).toBeNull();
});

test('a visitor he remembers, back on another day, is greeted and finds his keepsake', async ({ page }) => {
  await page.goto('/503.html');
  await page.evaluate(() => localStorage.setItem('yoru.acquaintance', JSON.stringify({
    version: 1, familiarity: 0.4, wariness: 0, favouritePlace: 'nook', discovered: ['coast'], lastSeen: '2020-01-01',
  })));
  await page.goto('/');
  await expect(page.locator('[data-yoru-cap] span')).toHaveText('oh. you again.');
  await expect(page.locator('.yoru-prop')).toHaveCount(2); // his cushion and the sea chart from Borrowed Coast
});

test('the stable nook forget control clears keepsakes and greeting without reload or later recreation', async ({ page }) => {
  await page.goto('/503.html');
  await page.evaluate(() => localStorage.setItem('yoru.acquaintance', JSON.stringify({
    version: 1, familiarity: 0.8, wariness: 0, favouritePlace: 'nook', discovered: ['coast'], lastSeen: '2020-01-01',
  })));
  await page.goto('/');
  await expect(page.locator('[data-yoru-cap] span')).toHaveText('oh. you again.');
  await page.keyboard.press('End');
  const note = page.locator('.yoru-note');
  await expect(note.getByRole('button', { name: 'Forget me' })).toBeVisible({ timeout: 15000 });
  await note.getByRole('button', { name: 'Forget me' }).click();
  expect(await stored(page)).toBeNull();
  await expect(page.locator('.yoru-prop')).toHaveCount(1);
  await expect(page.locator('[data-yoru-cap] span')).not.toHaveText('oh. you again.');
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide')));
  expect(await stored(page)).toBeNull();
});

for (const failure of ['blocked', 'full', 'discarded'] as const) {
  test(`${failure} storage leaves remembering off and never reports success`, async ({ page }) => {
    await page.addInitScript(mode => {
      Storage.prototype.setItem = function () {
        if (mode === 'discarded') return;
        throw new DOMException(mode, mode === 'full' ? 'QuotaExceededError' : 'SecurityError');
      };
    }, failure);
    await page.goto('/');
    await page.keyboard.press('End');
    const note = page.locator('.yoru-note');
    await expect(note.getByRole('button', { name: 'remember me' })).toBeVisible({ timeout: 15000 });
    await note.getByRole('button', { name: 'remember me' }).click();
    await expect(note).toContainText('couldn’t keep that');
    await expect(note).toContainText('Remembering is off.');
    expect(await stored(page)).toBeNull();
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide')));
    expect(await stored(page)).toBeNull();
    await expect(note.getByRole('button', { name: 'Forget me' })).toHaveCount(0);
  });
}

for (const path of ['/404.html', '/privacy/', '/impressum/']) {
  test(`${path} reads acquaintance without writing or consuming Home's new-day greeting`, async ({ page }) => {
    await page.goto('/503.html');
    const record = JSON.stringify({ version: 1, familiarity: 0.8, wariness: 0.2, favouritePlace: 'nook', discovered: ['coast'], lastSeen: '2020-01-01' });
    await page.evaluate(value => localStorage.setItem('yoru.acquaintance', value), record);
    await page.goto(path);
    await expect(page.locator('.yoru-resident')).toHaveCount(1);
    await page.locator('.yoru-resident').click();
    await page.waitForTimeout(2800); // the former room-specific solicitation ran after 2600 ms
    await expect(page.locator('.yoru-note')).toHaveCount(0);
    expect(await stored(page)).toBe(record);
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide')));
    expect(await stored(page)).toBe(record);
    await page.goto('/');
    await expect(page.locator('[data-yoru-cap] span')).toHaveText('oh. you again.');
  });
}

test('deletion on Privacy clears an already-open Home and cannot be undone by its lifecycle', async ({ page, context }) => {
  await page.goto('/');
  await page.keyboard.press('End');
  await page.locator('.yoru-note').getByRole('button', { name: 'remember me' }).click({ timeout: 15000 });
  const privacy = await context.newPage();
  await privacy.goto('/privacy/');
  await privacy.locator('[data-yoru-forget]').click();
  await expect(page.locator('.yoru-note')).toContainText('Forgotten.');
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  expect(await stored(page)).toBeNull();
  await privacy.close();
});

test('without JavaScript every room keeps the new resident still, no offer or storage, and 503 is self-contained', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const path of ['/', '/404.html', '/privacy/', '/impressum/', '/contact/']) {
      await page.goto(`http://127.0.0.1:8788${path}`);
      await expect(page.locator('[data-yoru-still]')).toHaveCount(1);
      await expect(page.locator('[data-yoru-still]')).toBeVisible();
      await expect(page.locator('.yoru-resident, .yoru-note')).toHaveCount(0);
      expect(await stored(page)).toBeNull();
    }
    await page.goto('http://127.0.0.1:8788/503.html');
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('.yoru img')).toHaveAttribute('src', /^data:image\/(?:png|webp);base64,/);
    expect(await stored(page)).toBeNull();
  } finally {
    await context.close();
  }
});

test('a blocked removal keeps the Privacy control available and never claims forgetting', async ({ page }) => {
  await page.goto('/503.html');
  await page.evaluate(() => localStorage.setItem('yoru.acquaintance', JSON.stringify({
    version: 1, familiarity: 0.5, wariness: 0, favouritePlace: 'nook', discovered: [], lastSeen: '2026-10-24',
  })));
  await page.addInitScript(() => { Storage.prototype.removeItem = () => { throw new DOMException('blocked', 'SecurityError'); }; });
  await page.goto('/privacy/');
  await page.locator('[data-yoru-forget]').click();
  await expect(page.locator('[data-yoru-memory]')).toContainText('wouldn’t remove');
  await expect(page.locator('[data-yoru-forget]')).toBeVisible();
  expect(await stored(page)).not.toBeNull();
});

test('a discovery saved in one Home reaches another without replaying the greeting or losing it on pagehide', async ({ page, context }) => {
  await page.goto('/');
  await page.keyboard.press('End');
  await page.locator('.yoru-note').getByRole('button', { name: 'remember me' }).click({ timeout: 15000 });
  const other = await context.newPage();
  await other.goto('/');
  // Save a discovered scene at the other page's storage boundary; this sends the browser's real storage event.
  await other.evaluate(() => {
    const record = JSON.parse(localStorage.getItem('yoru.acquaintance')!);
    localStorage.setItem('yoru.acquaintance', JSON.stringify({ ...record, discovered: ['coast'], favouritePlace: 'nook' }));
  });
  await expect(page.locator('.yoru-prop')).toHaveCount(2);
  await expect(page.locator('[data-yoru-cap] span')).not.toHaveText('oh. you again.');
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide')));
  expect(JSON.parse((await stored(page))!)).toMatchObject({ discovered: ['coast'], favouritePlace: 'nook' });
  await other.close();
});
