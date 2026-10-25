/**
 * The contact page's behaviour: counters, the searchable project picker kept in sync with the contract's native
 * select (including `?product=` preselection), Turnstile, accessible validation feedback and the three truthful
 * outcomes in Works words. The Worker owns every decision; this script only presents what it returned.
 *
 * Adapted from the moved service's src/scripts/contact-form.ts (Wolfsblvt/wolfsblvt.com 98a85f8).
 */
import { FIELDS, LIMITS, OUTCOMES, TURNSTILE_ACTION } from '../../../shared/contact-contract';
import { mountSpot } from '../yoru/client/spot';

type FieldError = { field: string; message: string };

interface SubmitResponse {
  ok: boolean;
  outcome: string;
  reference?: string;
  message: string;
  errors?: FieldError[];
  retryable?: boolean;
  renewForm?: boolean;
}

declare global {
  interface Window {
    turnstile?: {
      render(container: HTMLElement, options: Record<string, unknown>): string;
      reset(widgetId?: string): void;
    };
    onTurnstileLoaded?: () => void;
  }
}

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoaded';
const CONTACT_FORM = '[data-contact-form]';
const numberFormat = new Intl.NumberFormat('en');
const RENEWAL_TIMEOUT_MS = 15_000;

const form = document.querySelector<HTMLFormElement>(CONTACT_FORM);
if (form) setupContactForm(form);

function must<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Contact form markup is missing an expected element.');
  return value;
}

function setupContactForm(form: HTMLFormElement): void {
  const submitButton = must(form.querySelector<HTMLButtonElement>('[data-submit]'));
  const submitLabel = must(form.querySelector<HTMLElement>('[data-submit-label]'));
  const submitNote = must(form.querySelector<HTMLElement>('[data-submit-note]'));
  const summary = must(form.querySelector<HTMLElement>('[data-error-summary]'));
  const summaryList = must(form.querySelector<HTMLUListElement>('[data-error-summary-list]'));
  const summaryTitle = must(form.querySelector<HTMLElement>('[data-error-summary-title]'));
  const tokenInput = must(form.querySelector<HTMLInputElement>('[data-form-token]'));
  const submissionInput = must(form.querySelector<HTMLInputElement>('[data-submission-id]'));
  const attemptInput = must(form.querySelector<HTMLInputElement>('[data-attempt]'));
  const turnstileSlot = must(form.querySelector<HTMLElement>('[data-turnstile]'));
  const outcome = must(document.querySelector<HTMLElement>('[data-outcome]'));
  const yoruSpot = document.querySelector<HTMLElement>('[data-contact-yoru]');
  const card = document.querySelector<HTMLElement>('.ct-card');
  // He sits on the card's top edge, along the stretch his still frame takes up.
  const yoru = yoruSpot && card ? mountSpot({
    memory: 'none',
    spot: yoruSpot,
    ground: () => {
      const spot = yoruSpot.getBoundingClientRect();
      return { left: spot.left + scrollX, right: spot.right + scrollX, y: card.getBoundingClientRect().top + scrollY };
    },
    label: 'Yoru, the resident. Poke him.',
  }) : null;
  const products = JSON.parse(form.dataset.products ?? '{}') as Record<string, { label: string; home: string }>;

  let turnstileToken = '';
  let turnstileWidgetId: string | null = null;
  // One submission is one pending interaction: the POST and any form refresh it triggers. While it is pending nothing
  // else may start a submission or re-enable Send, so no older answer can arrive after, and replace, a newer outcome.
  let pending = false;
  // A refreshed form's token is brand new and the Worker refuses one younger than its minimum interaction time, so
  // Send waits until then rather than asking the visitor to be slower (performance.now() time; 0 means no wait).
  let freshTokenReadyAt = 0;
  let readyTimer: ReturnType<typeof setTimeout> | undefined;

  submissionInput.value = crypto.randomUUID();
  const counters = setupCounters(form);
  const picker = setupPicker(form);
  setupArrival(products, picker);
  setupLiveErrorClearing(form);

  const sitekey = form.dataset.turnstileSitekey ?? '';
  const issuedToken = form.dataset.formToken ?? '';
  tokenInput.value = issuedToken;

  if (!sitekey || !issuedToken) {
    // The Worker did not prepare this page (for example, the static build opened directly). Say so instead of
    // pretending a submission could succeed.
    submitNote.textContent = 'This page wasn’t served by the contact service, so the form can’t send from here. Email me directly instead.';
    return;
  }

  const renderTurnstile = () => {
    if (!window.turnstile || turnstileWidgetId !== null) return;
    turnstileWidgetId = window.turnstile.render(turnstileSlot, {
      sitekey,
      action: TURNSTILE_ACTION,
      theme: 'dark',
      appearance: 'interaction-only',
      callback: (token: string) => { turnstileToken = token; updateSubmit(); },
      'expired-callback': () => { turnstileToken = ''; updateSubmit('The bot check expired; it’s refreshing.'); },
      'error-callback': () => { turnstileToken = ''; updateSubmit('The bot check couldn’t run. Reload the page or email me directly.'); },
    });
  };
  // Turnstile loads only on the prepared contact page: the one third-party script on the site.
  window.onTurnstileLoaded = renderTurnstile;
  if (window.turnstile) renderTurnstile();
  else {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    document.head.append(script);
  }

  function enableSubmit(): void {
    submitButton.disabled = false;
    submitNote.textContent = '';
  }
  function disableSubmit(reason: string): void {
    submitButton.disabled = true;
    submitNote.textContent = reason;
  }
  /**
   * Sets Send from the current state. A pending submission owns the button until its outcome is shown, so a widget
   * answering meanwhile only records its token. Otherwise Send waits for the bot check and for a refreshed form token
   * to be old enough; `reason` explains a missing bot check.
   */
  function updateSubmit(reason = 'Waiting for the bot check to finish…'): void {
    if (pending) return;
    clearTimeout(readyTimer);
    if (!turnstileToken) { disableSubmit(reason); return; }
    const wait = freshTokenReadyAt - performance.now();
    if (wait > 0) {
      disableSubmit('Getting the fresh form ready…');
      readyTimer = setTimeout(() => updateSubmit(), wait);
      return;
    }
    enableSubmit();
  }

  /**
   * Fetches the contact page again for its freshly issued form token and puts it into this form, leaving everything
   * the visitor typed where it is. Nothing is stored and nothing is sent; the visitor sends again themselves.
   */
  async function renewFormToken(): Promise<boolean> {
    try {
      // Bounded, so a stalled request ends the pending submission with its honest "couldn't be fetched" outcome.
      const page = await fetch(window.location.href, { headers: { Accept: 'text/html' }, credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(RENEWAL_TIMEOUT_MS) });
      if (!page.ok) return false;
      const fresh = new DOMParser().parseFromString(await page.text(), 'text/html').querySelector<HTMLFormElement>(CONTACT_FORM)?.dataset.formToken;
      if (!fresh) return false;
      tokenInput.value = fresh;
      // The token was issued before it arrived here, so waiting the minimum from now always satisfies the Worker.
      freshTokenReadyAt = performance.now() + LIMITS.minimumInteractionMs;
      return true;
    } catch {
      return false;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Send is disabled whenever this is true; the guard also covers Enter and programmatic submission.
    if (pending || submitButton.disabled) return;
    const localErrors = validateLocally(form);
    if (localErrors.length > 0) { presentErrors(localErrors); return; }
    if (!turnstileToken) { updateSubmit(); return; }

    clearErrors();
    pending = true;
    clearTimeout(readyTimer);
    submitButton.disabled = true;
    submitLabel.textContent = 'Sending…';
    submitNote.textContent = 'Sending…';
    attemptInput.value = String(Number(attemptInput.value || '0') + 1);

    const body = new FormData(form);
    body.set(FIELDS.turnstile, turnstileToken);
    let response: SubmitResponse;
    try {
      const raw = await fetch(window.location.href, { method: 'POST', body, headers: { Accept: 'application/json' }, credentials: 'omit' });
      response = (await raw.json()) as SubmitResponse;
    } catch {
      response = { ok: false, outcome: OUTCOMES.failed, message: 'The message could not be sent because the contact service did not answer. Your text is kept in the form.', retryable: true };
    }
    // Tokens are single-use; whatever happened, the next attempt needs a fresh one. The widget may answer while this
    // submission is still pending; updateSubmit() keeps that answer until the outcome is shown.
    turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    if (response.renewForm) {
      submitNote.textContent = 'Refreshing the form…';
      const renewed = await renewFormToken();
      endPending();
      showRenewal(renewed);
      return;
    }
    endPending();
    handleResponse(response);
  });

  function endPending(): void {
    pending = false;
    submitLabel.textContent = 'Send it';
    submitNote.textContent = '';
  }

  outcome.querySelector<HTMLButtonElement>('[data-retry]')?.addEventListener('click', () => {
    outcome.hidden = true;
    form.hidden = false;
    const context = document.querySelector<HTMLElement>('[data-product-context]');
    if (context?.dataset.wasShown === 'true') context.hidden = false;
    yoruSits();
    updateSubmit();
    form.querySelector<HTMLElement>('#message')?.focus();
  });
  outcome.querySelector<HTMLButtonElement>('[data-another]')?.addEventListener('click', () => {
    form.reset();
    picker.select('');
    counters.update();
    submissionInput.value = crypto.randomUUID();
    attemptInput.value = '0';
    outcome.hidden = true;
    form.hidden = false;
    yoruSits();
    // The widget has usually answered again since the last send's reset; waiting for another answer would never end.
    updateSubmit();
    form.querySelector<HTMLInputElement>('#category')?.focus();
  });

  function handleResponse(response: SubmitResponse): void {
    if (response.errors && response.errors.length > 0) {
      presentErrors(response.errors);
      updateSubmit();
      return;
    }
    switch (response.outcome) {
      case OUTCOMES.sent:
        form.hidden = true;
        yoruRunsOff();
        showOutcome({ kicker: 'Sent', title: 'Thanks. Your message is on its way.', text: response.message, reference: response.reference, scribble: 'Yoru’s delivering it. mostly reliable.', home: true, another: true });
        return;
      case OUTCOMES.sentCopyFailed:
        form.hidden = true;
        yoruRunsOff();
        showOutcome({ kicker: 'Sent, mostly', title: 'It reached me. Your copy didn’t.', text: response.message, reference: response.reference, scribble: 'the part that matters made it.', home: true, another: true });
        return;
      default:
        // Failed, rate-limited, disabled, rejected: the text stays in the form so nothing is lost.
        form.hidden = true;
        showOutcome({ kicker: 'Not sent', bad: true, title: 'Your message was not sent.', text: response.message || 'Nothing reached the inbox. Email me directly instead.', reference: response.reference, retry: response.retryable !== false, fallback: true });
    }
  }

  // The token outlived its 12 hours, or the service's signing secret changed: the copy covers both without guessing
  // which. Nothing was sent; the text stays put. If the fresh form couldn't be fetched, sending again asks for one
  // again, so "Try again" stays honest either way.
  function showRenewal(renewed: boolean): void {
    form.hidden = true;
    const text = renewed
      ? 'This form needed refreshing before it could send. It’s fresh now and your text is still in it, so send it once more.'
      : 'This form needed refreshing before it could send, and a fresh one couldn’t be fetched just now. Your text is still in the form: try again, or copy it somewhere safe before you reload the page.';
    showOutcome({ kicker: 'Not sent', bad: true, title: 'Your message was not sent.', text, retry: true, fallback: true });
  }

  function showOutcome(options: { kicker: string; title: string; text: string; bad?: boolean; reference?: string; scribble?: string; retry?: boolean; fallback?: boolean; home?: boolean; another?: boolean }): void {
    const kicker = must(outcome.querySelector<HTMLElement>('[data-outcome-kicker]'));
    kicker.textContent = options.kicker;
    kicker.classList.toggle('bad', !!options.bad);
    must(outcome.querySelector<HTMLElement>('[data-outcome-title]')).textContent = options.title;
    must(outcome.querySelector<HTMLElement>('[data-outcome-text]')).textContent = options.text;
    const referenceRow = must(outcome.querySelector<HTMLElement>('[data-outcome-reference]'));
    referenceRow.hidden = !options.reference;
    must(outcome.querySelector<HTMLElement>('[data-outcome-reference-value]')).textContent = options.reference ?? '';
    const scribble = must(outcome.querySelector<HTMLElement>('[data-outcome-scribble]'));
    scribble.hidden = !options.scribble;
    scribble.textContent = options.scribble ?? '';
    must(outcome.querySelector<HTMLElement>('[data-retry]')).hidden = !options.retry;
    must(outcome.querySelector<HTMLElement>('[data-fallback-email]')).hidden = !options.fallback;
    must(outcome.querySelector<HTMLElement>('[data-outcome-home]')).hidden = !options.home;
    must(outcome.querySelector<HTMLElement>('[data-another]')).hidden = !options.another;
    outcome.hidden = false;
    // The arrival note belongs to the form; an outcome replaces both.
    const context = document.querySelector<HTMLElement>('[data-product-context]');
    if (context) { context.dataset.wasShown = String(!context.hidden); context.hidden = true; }
    outcome.focus();
  }

  // Yoru runs off with a sent message and isn't there afterwards; he stays put when it failed, and comes back when the
  // form is back.
  function yoruRunsOff(): void {
    yoru?.leave();
  }
  function yoruSits(): void {
    yoru?.comeBack();
  }

  function presentErrors(errors: FieldError[]): void {
    clearErrors();
    summaryTitle.textContent = errors.length === 1 ? 'Please check one field.' : `Please check ${errors.length} fields.`;
    for (const error of errors) {
      // Category is a radio group; the first radio carries id="category" so the summary can focus it.
      const control = error.field === FIELDS.category ? form.querySelector<HTMLElement>('#category') : form.querySelector<HTMLElement>(`[name="${error.field}"]`);
      const focusTarget = error.field === FIELDS.product ? form.querySelector<HTMLElement>('#product-search') : control;
      const item = document.createElement('li');
      if (control && focusTarget) {
        const link = document.createElement('a');
        link.href = `#${focusTarget.id}`;
        link.textContent = error.message;
        link.addEventListener('click', (event) => { event.preventDefault(); focusTarget.focus(); });
        item.append(link);
        const field = control.closest<HTMLElement>('.field');
        field?.classList.add('field-invalid');
        const inline = document.createElement('p');
        inline.className = 'field-error';
        inline.id = `${error.field}-error`;
        inline.textContent = error.message;
        field?.append(inline);
        const described = focusTarget.getAttribute('aria-describedby') ?? '';
        focusTarget.setAttribute('aria-describedby', `${described} ${inline.id}`.trim());
        focusTarget.setAttribute('aria-invalid', 'true');
      } else {
        item.textContent = error.message;
      }
      summaryList.append(item);
    }
    summary.hidden = false;
    summary.focus();
  }

  function clearErrors(): void {
    summary.hidden = true;
    summaryList.replaceChildren();
    form.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach((control) => clearControl(control));
    form.querySelectorAll('.field-invalid').forEach((field) => field.classList.remove('field-invalid'));
    form.querySelectorAll('.field-error').forEach((inline) => inline.remove());
  }
}

function clearControl(control: HTMLElement): void {
  control.removeAttribute('aria-invalid');
  const described = (control.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id && !id.endsWith('-error')).join(' ');
  if (described) control.setAttribute('aria-describedby', described);
  else control.removeAttribute('aria-describedby');
}

/** Fixing a field clears its own error straight away; the summary stays until the next attempt. */
function setupLiveErrorClearing(form: HTMLFormElement): void {
  form.addEventListener('input', (event) => {
    const field = (event.target as Element).closest<HTMLElement>('.field');
    if (!field?.classList.contains('field-invalid')) return;
    field.classList.remove('field-invalid');
    field.querySelectorAll('.field-error').forEach((inline) => inline.remove());
    field.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach(clearControl);
  });
}

function setupCounters(form: HTMLFormElement): { update(): void } {
  const subject = must(form.querySelector<HTMLInputElement>('#subject'));
  const subjectCount = must(form.querySelector<HTMLElement>('[data-subject-count]'));
  const message = must(form.querySelector<HTMLTextAreaElement>('#message'));
  const messageCount = must(form.querySelector<HTMLElement>('[data-message-count]'));
  const max = Number(form.dataset.subjectMax ?? LIMITS.subjectMax);
  const update = () => {
    const subjectLength = [...subject.value].length;
    subjectCount.textContent = `${numberFormat.format(subjectLength)} / ${max}`;
    subjectCount.classList.toggle('over', subjectLength > max);
    const count = [...message.value].length;
    messageCount.textContent = `${numberFormat.format(count)} ${count === 1 ? 'character' : 'characters'}`;
  };
  subject.addEventListener('input', update);
  message.addEventListener('input', update);
  update();
  return { update };
}

interface Picker {
  select(slug: string): void;
  iconFor(slug: string): HTMLElement | null;
}

/** A searchable listbox in front of the contract's native select. The select carries the value; both stay in sync. */
function setupPicker(form: HTMLFormElement): Picker {
  const select = must(form.querySelector<HTMLSelectElement>('#product'));
  const input = must(form.querySelector<HTMLInputElement>('[data-combo-input]'));
  const list = must(form.querySelector<HTMLUListElement>('[data-combo-list]'));
  const clear = must(form.querySelector<HTMLButtonElement>('[data-combo-clear]'));
  const iconSlot = must(form.querySelector<HTMLElement>('[data-combo-icon]'));
  const empty = must(form.querySelector<HTMLElement>('[data-combo-empty]'));
  const options = [...list.querySelectorAll<HTMLLIElement>('[role=option]')];
  const searchIcon = iconSlot.innerHTML;
  let active = 0;
  let open = false;

  const visible = () => options.filter((o) => !o.hidden);
  const current = () => select.value;
  const iconFor = (slug: string) => options.find((o) => o.dataset.slug === slug)?.querySelector<HTMLElement>('.pico') ?? null;

  const renderValue = () => {
    const slug = current();
    const option = options.find((o) => o.dataset.slug === slug);
    options.forEach((o) => o.setAttribute('aria-selected', String(o === option)));
    if (!open) input.value = option?.dataset.label ?? '';
    clear.hidden = !option || open;
    const icon = option ? iconFor(slug) : null;
    iconSlot.innerHTML = icon && !open ? icon.outerHTML : searchIcon;
  };
  const renderList = () => {
    const shown = visible();
    active = Math.max(0, Math.min(active, shown.length - 1));
    options.forEach((o) => o.classList.toggle('active', open && o === shown[active]));
    const activeOption = shown[active];
    if (open && activeOption) input.setAttribute('aria-activedescendant', activeOption.id);
    else input.removeAttribute('aria-activedescendant');
    empty.hidden = shown.length > 0;
    list.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
  };
  const filter = (query: string) => {
    const q = query.trim().toLowerCase();
    options.forEach((o) => { o.hidden = !!q && !o.dataset.label!.toLowerCase().includes(q) && !o.dataset.slug!.includes(q); });
  };
  const select_ = (slug: string) => {
    select.value = slug;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    open = false;
    filter('');
    renderValue();
    renderList();
  };
  const openList = () => {
    if (open) return;
    open = true;
    input.value = '';
    filter('');
    const shown = visible();
    active = Math.max(0, shown.findIndex((o) => o.dataset.slug === current()));
    renderValue();
    renderList();
  };
  const closeList = () => {
    if (!open) return;
    open = false;
    filter('');
    renderValue();
    renderList();
  };

  input.addEventListener('focus', openList);
  input.addEventListener('click', openList);
  input.addEventListener('input', () => { if (!open) openList(); filter(input.value); active = 0; renderList(); });
  input.addEventListener('blur', () => setTimeout(closeList, 120));
  input.addEventListener('keydown', (event) => {
    const shown = visible();
    if (event.key === 'ArrowDown') { event.preventDefault(); if (!open) openList(); else { active = Math.min(shown.length - 1, active + 1); renderList(); } }
    else if (event.key === 'ArrowUp') { event.preventDefault(); active = Math.max(0, active - 1); renderList(); }
    else if (event.key === 'Enter') { if (open && shown[active]) { event.preventDefault(); select_(shown[active]!.dataset.slug!); } }
    else if (event.key === 'Escape') { if (open) { event.preventDefault(); closeList(); } }
  });
  // mousedown keeps focus in the input while choosing.
  list.addEventListener('mousedown', (event) => {
    const option = (event.target as Element).closest<HTMLLIElement>('[role=option]');
    if (!option) return;
    event.preventDefault();
    select_(option.dataset.slug!);
  });
  clear.addEventListener('click', () => { select_(''); input.focus(); });
  form.addEventListener('reset', () => setTimeout(() => select_(''), 0));
  renderValue();
  renderList();
  return { select: select_, iconFor };
}

/**
 * Arriving from a product with ?product=<slug>: preselect it, say so in the card, and show the product beside
 * "Contact" in the header linking back to where the visitor came from. Unknown slugs are ignored, never reflected.
 */
function setupArrival(products: Record<string, { label: string; home: string }>, picker: Picker): void {
  const requested = new URLSearchParams(window.location.search).get('product') ?? '';
  const product = Object.prototype.hasOwnProperty.call(products, requested) ? products[requested] : null;
  if (!product) return;
  picker.select(requested);
  const icon = picker.iconFor(requested);
  const context = document.querySelector<HTMLElement>('[data-product-context]');
  if (context) {
    must(context.querySelector<HTMLElement>('[data-product-label]')).textContent = product.label;
    const slot = context.querySelector<HTMLElement>('[data-product-context-icon]');
    if (slot && icon) slot.replaceWith(icon.cloneNode(true));
    context.hidden = false;
  }
  const back = document.querySelector<HTMLAnchorElement>('[data-from-back]');
  if (back && requested !== 'wolfsblvt-works') {
    back.href = product.home;
    must(back.querySelector<HTMLElement>('[data-from-back-label]')).textContent = product.label;
    const slot = back.querySelector<HTMLElement>('[data-from-back-icon]');
    if (slot && icon) slot.replaceWith(icon.cloneNode(true));
    back.hidden = false;
  }
}

function validateLocally(form: HTMLFormElement): FieldError[] {
  // Mirrors the Worker's required-field checks so common mistakes get instant feedback. The Worker remains the
  // authority and validates everything again.
  const errors: FieldError[] = [];
  const value = (name: string) => {
    const el = form.elements.namedItem(name) as RadioNodeList | HTMLInputElement | HTMLSelectElement | null;
    return el && 'value' in el ? String(el.value ?? '').trim() : '';
  };
  if (!value(FIELDS.category)) errors.push({ field: FIELDS.category, message: 'Choose what the message is about.' });
  const email = value(FIELDS.email);
  if (!email) errors.push({ field: FIELDS.email, message: 'Enter the email address replies should go to.' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({ field: FIELDS.email, message: 'Enter a valid email address.' });
  const subject = value(FIELDS.subject);
  if (!subject) errors.push({ field: FIELDS.subject, message: 'Enter a subject.' });
  else if ([...subject].length > LIMITS.subjectMax) errors.push({ field: FIELDS.subject, message: `Keep the subject to ${LIMITS.subjectMax} characters.` });
  if (!value(FIELDS.message)) errors.push({ field: FIELDS.message, message: 'Write a message.' });
  return errors;
}
