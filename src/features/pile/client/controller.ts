/**
 * The Pile's single mutation boundary: today's pile, its packing, opening Endless (the pieces scatter down, the
 * document gains its real height), closing it (travel back to the threshold first, then retract and gather), the
 * journeys to entries, browser history, and the cold shared-link bootstrap. Entry code never scrolls the page or
 * touches this state; it asks through navigateToEntry. The pile's public address is #whoa whether it is open or
 * closed (the nav's own word); entries are #pile-<id>; #endless and #pile are internal and still understood.
 *
 * Built to docs/pile/pile-technical-plan.md, adapted to the canvas's in-place scatter (no flight layer).
 */
import { berlinDateKey, hashString, mulberry32, round1 } from '../../../lib/shape';
import { documentTop, headerOffset, isPlainClick, reducedMotion, travelTo, cancelTravel, type TravelResult } from '../../../scripts/runtime';
import { mountInteractions } from './interactions';
import { dealPile, packPile, type ManifestEntry, type Placement } from './selection';

type Mode = 'closed' | 'opening' | 'open' | 'closing';
type Target = { kind: 'intro' } | { kind: 'entry'; id: string } | null;

interface PileHistory {
  open: boolean;
  target: string | null;
}

export interface BootState {
  hash: string | null;
  url?: string;
  state?: unknown;
  restoration?: ScrollRestoration;
  failed?: boolean;
}

declare global {
  interface Window {
    __pileBoot?: BootState;
    __pileReady?: boolean;
  }
}

const OWNED_HASH = /^#(endless|pile|pile-[a-z0-9]+(?:-[a-z0-9]+)*)$/;
/** `#noreplyyet`, `#no-reply-yet` and `#pile-no-reply-yet` all mean the same entry. */
const loose = (value: string) => value.toLowerCase().replace(/^#?(pile-)?/, '').replace(/[^a-z0-9]/g, '');

export function mountPile(): void {
  const section = document.querySelector<HTMLElement>('[data-pile]');
  const manifestEl = document.getElementById('pile-manifest');
  if (!section || !manifestEl) return;

  const boot: BootState = window.__pileBoot ?? { hash: null };
  // If the bootstrap's escape already exposed the content, a late controller must not collapse what is being read.
  if (boot.failed) return;

  try {
    start(section, JSON.parse(manifestEl.textContent ?? '[]') as ManifestEntry[], boot);
  } catch (error) {
    // Degrade only this feature: show the readable collection with ordinary links.
    document.documentElement.classList.remove('pile-boot', 'pile-on');
    window.__pileReady = true;
    console.error('The Pile could not start; showing the plain collection.', error);
  }
}

function start(section: HTMLElement, manifest: ManifestEntry[], boot: BootState): void {
  const html = document.documentElement;
  const q = <T extends Element>(selector: string) => section.querySelector<T>(selector);
  const stage = q<HTMLElement>('[data-pile-stage]')!;
  const threshold = q<HTMLElement>('[data-pile-threshold]')!;
  const toggle = q<HTMLButtonElement>('[data-pile-toggle]')!;
  const staticOpen = q<HTMLAnchorElement>('[data-pile-static-open]')!;
  const actionLabel = q<HTMLElement>('[data-pile-action]')!;
  const outer = q<HTMLElement>('[data-endless-outer]')!;
  const inner = q<HTMLElement>('[data-endless-inner]')!;
  const closeButton = q<HTMLButtonElement>('[data-pile-close]')!;
  const unknownNote = q<HTMLElement>('[data-pile-unknown]')!;
  const introHeading = q<HTMLElement>('.end-h')!;
  const back = document.querySelector<HTMLAnchorElement>('[data-pile-back]');
  const known = new Set(manifest.map((entry) => entry.id));
  const byLoose = new Map(manifest.map((entry) => [loose(entry.id), entry.id]));
  const resolve = (id: string) => (known.has(id) ? id : byLoose.get(loose(id)) ?? id);

  // ---------- today's pile, frozen for this visit ----------
  const dateKey = berlinDateKey();
  const seed = section.dataset.pileSeed || undefined;
  const deal = dealPile(manifest, dateKey, seed);
  const pieces = new Map<string, HTMLElement>();
  stage.querySelectorAll<HTMLElement>('.pi[data-pid]').forEach((el) => pieces.set(el.dataset.pid!, el));
  const selected = deal.pile.map((entry) => entry.id).filter((id) => pieces.has(id));
  pieces.forEach((el, id) => {
    const chosen = selected.includes(id);
    el.hidden = !chosen;
    el.classList.toggle('featured', id === deal.featured?.id);
  });
  selected.forEach((id, order) => pieces.get(id)!.querySelector('.pi-breathe')?.classList.toggle('breathe', order % 3 === 1));

  const today = section.querySelector<HTMLElement>('[data-pile-today]');
  const dateEl = section.querySelector<HTMLElement>('[data-pile-date]');
  if (today && dateEl) {
    dateEl.textContent = new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
    today.hidden = false;
  }

  // ---------- packing ----------
  const heights = new Map<string, number>();
  let placements: Placement[] = [];
  let built = reducedMotion();
  let settled = built;

  const measure = (width: number, id: string) => {
    const el = pieces.get(id)!;
    const box = el.querySelector<HTMLElement>('.pi-in')!;
    box.style.width = `${width}px`;
    const height = box.offsetHeight;
    heights.set(`${id}@${width}`, height);
    return height;
  };
  const layout = () => {
    if (stageScattered) return;
    const width = stage.clientWidth;
    // Measure first (reads), then place (writes).
    const first = packPile({ ...deal, pile: deal.pile.filter((e) => pieces.has(e.id)) }, width, (id, w) => heights.get(`${id}@${w}`) ?? measure(w, id));
    placements = first.placements;
    stage.style.height = `${first.height}px`;
    placements.forEach((p) => {
      const el = pieces.get(p.id)!;
      const delay = settled ? 0 : p.order * 85;
      el.style.zIndex = String(10 + p.order);
      el.style.width = `${p.width}px`;
      el.querySelector<HTMLElement>('.pi-in')!.style.width = `${p.width}px`;
      el.style.transition = `transform .95s cubic-bezier(.2,1.2,.35,1) ${delay}ms,opacity .45s ease ${delay}ms`;
      el.style.transform = built ? `translate(${p.x}px,${p.y}px) rotate(${p.rotate}deg)` : `translate(${p.x}px,${p.y - 90}px) rotate(${p.rotate + 10}deg)`;
      el.style.opacity = built ? '1' : '0';
    });
  };

  // ---------- enhancement starts here ----------
  html.classList.add('pile-on');
  html.classList.remove('pile-boot');
  window.__pileReady = true;
  staticOpen.hidden = true;
  toggle.hidden = false;
  closeButton.hidden = false;
  let stageScattered = false;
  layout();
  new ResizeObserver(() => layout()).observe(stage);
  document.fonts?.ready.then(() => { heights.clear(); layout(); });

  // The pile settles with a small, uneven drop once its top has come well into view (past the lower 28 % of the
  // viewport). A share of the stage would not do: on a phone the stage is several screens tall.
  if (!built && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      setTimeout(() => { built = true; layout(); }, 80);
      setTimeout(() => { settled = true; }, 2600);
    }, { threshold: 0, rootMargin: '0px 0px -28% 0px' });
    io.observe(stage);
  } else {
    built = settled = true;
    layout();
  }

  // ---------- mode ----------
  let mode: Mode = 'closed';
  let intent = 0;
  let heightAnimation: Animation | null = null;
  let flights: { el: HTMLElement; animation: Animation; dx: number; dy: number; rot: number }[] = [];
  let opening: Promise<void> | null = null;

  const setInert = (el: HTMLElement, value: boolean) => { (el as HTMLElement & { inert: boolean }).inert = value; };
  const renderControls = () => {
    const open = mode === 'open' || mode === 'opening';
    toggle.textContent = open ? 'Gather the pile' : 'There’s more. A lot more.';
    toggle.classList.toggle('btn-cyan', !open);
    toggle.classList.toggle('btn-line', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) toggle.setAttribute('aria-label', 'Gather the pile and close Endless');
    else toggle.removeAttribute('aria-label');
    updateBack();
  };
  const setEmpty = (empty: boolean) => stage.classList.toggle('empty', empty);
  const setScattered = (value: boolean) => {
    stageScattered = value;
    stage.classList.toggle('scattered', value);
    pieces.forEach((el) => setInert(el, value));
  };
  const showClosed = () => {
    outer.style.height = '0px';
    outer.style.overflow = 'hidden';
    outer.style.visibility = 'hidden';
    setInert(outer, true);
  };
  const showOpen = () => {
    outer.style.height = 'auto';
    outer.style.overflow = '';
    outer.style.visibility = '';
    setInert(outer, false);
  };
  showClosed();
  renderControls();

  const cancelFlights = () => {
    flights.forEach((f) => f.animation.cancel());
    flights = [];
  };

  const scatter = () => {
    const rnd = mulberry32(hashString(`scatter|${deal.key}`));
    cancelFlights();
    for (const id of selected) {
      const el = pieces.get(id)!.querySelector<HTMLElement>('[data-fly]')!;
      const r = el.getBoundingClientRect();
      const dy = innerHeight - r.top + 160 + rnd() * 260;
      const dx = (rnd() - 0.5) * 2 * (60 + rnd() * 200);
      const rot = (rnd() - 0.5) * 56;
      const animation = el.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)' },
          { transform: `translate(${round1(dx * 0.18)}px,-16px) rotate(${round1(rot * 0.12)}deg)`, offset: 0.16 },
          { transform: `translate(${round1(dx * 0.7)}px,${round1(dy * 0.42)}px) rotate(${round1(rot * 0.6)}deg)`, offset: 0.62 },
          { transform: `translate(${round1(dx)}px,${round1(dy)}px) rotate(${round1(rot)}deg)` },
        ],
        { duration: 800, delay: rnd() * 160, easing: 'cubic-bezier(.55,0,.75,.35)', fill: 'forwards' },
      );
      animation.finished.catch(() => {});
      flights.push({ el, animation, dx, dy, rot });
    }
  };

  const gather = () => {
    const rnd = mulberry32(hashString(`gather|${deal.key}`));
    const previous = flights;
    flights = [];
    selected.forEach((id, i) => {
      const el = pieces.get(id)!.querySelector<HTMLElement>('[data-fly]')!;
      const old = previous[i];
      const dx = old?.dx ?? (rnd() - 0.5) * 300;
      const dy = old?.dy ?? innerHeight;
      const rot = old?.rot ?? 20;
      old?.animation.cancel();
      const animation = el.animate(
        [
          { transform: `translate(${round1(dx * 0.8)}px,${round1(Math.max(dy, innerHeight * 0.8))}px) rotate(${round1(rot)}deg)` },
          { transform: `translate(${round1(dx * 0.25)}px,${round1(dy * 0.2)}px) rotate(${round1(rot * 0.25)}deg)`, offset: 0.6 },
          { transform: 'translate(0,0) rotate(0deg)' },
        ],
        { duration: 850, delay: rnd() * 160, easing: 'cubic-bezier(.2,.7,.25,1)' },
      );
      animation.finished.catch(() => {});
    });
  };

  /** Settle to a mode immediately: reduced motion, history restoration, recovery. */
  const settle = (open: boolean) => {
    intent++;
    heightAnimation?.cancel();
    heightAnimation = null;
    cancelFlights();
    opening = null;
    mode = open ? 'open' : 'closed';
    setEmpty(open);
    setScattered(open);
    if (open) showOpen();
    else { showClosed(); layout(); }
    if (open) interactions.activate();
    renderControls();
  };

  const open = (): Promise<void> => {
    if (mode === 'open') return Promise.resolve();
    if (mode === 'opening' && opening) return opening;
    if (reducedMotion()) { settle(true); return Promise.resolve(); }
    const id = ++intent;
    const from = outer.getBoundingClientRect().height;
    heightAnimation?.cancel();
    mode = 'opening';
    actionLabel.classList.remove('on');
    renderControls();
    scatter();
    setTimeout(() => { if (intent === id) setEmpty(true); }, 420);
    setTimeout(() => { if (intent === id) setScattered(true); }, 1000);
    outer.style.visibility = '';
    outer.style.height = `${from}px`;
    opening = new Promise<void>((resolve) => {
      setTimeout(() => {
        if (intent !== id) { resolve(); return; }
        const target = inner.offsetHeight;
        const animation = outer.animate([{ height: `${from}px` }, { height: `${target}px` }], { duration: 1200, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
        heightAnimation = animation;
        animation.finished.then(() => {
          if (intent !== id) { resolve(); return; }
          mode = 'open';
          showOpen();
          animation.cancel();
          heightAnimation = null;
          opening = null;
          interactions.activate();
          renderControls();
          resolve();
        }, () => resolve());
      }, from > 0 ? 0 : 160);
    });
    return opening;
  };

  const collapse = () => {
    if (reducedMotion()) { settle(false); return; }
    const id = ++intent;
    const h = outer.getBoundingClientRect().height;
    heightAnimation?.cancel();
    mode = 'closing';
    opening = null;
    setEmpty(false);
    setScattered(false);
    setInert(outer, true);
    outer.style.overflow = 'hidden';
    outer.style.height = `${h}px`;
    layout();
    gather();
    renderControls();
    const animation = outer.animate([{ height: `${h}px` }, { height: '0px' }], { duration: 1100, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
    heightAnimation = animation;
    animation.finished.then(() => {
      if (intent !== id) return;
      mode = 'closed';
      showClosed();
      animation.cancel();
      heightAnimation = null;
      renderControls();
    }, () => {});
  };

  // ---------- history ----------
  const readState = (): PileHistory | null => {
    const s = history.state as { worksPile?: PileHistory } | null;
    return s && typeof s === 'object' && s.worksPile ? s.worksPile : null;
  };
  const writeState = (entry: PileHistory, hash: string, replace = false) => {
    const base = history.state && typeof history.state === 'object' ? history.state : {};
    const url = location.pathname + location.search + hash;
    try {
      if (replace) history.replaceState({ ...base, worksPile: entry }, '', url);
      else history.pushState({ ...base, worksPile: entry }, '', url);
    } catch { /* history may be unavailable; the journey still works */ }
  };

  // ---------- journeys ----------
  const flash = (article: HTMLElement) => {
    article.classList.remove('flash');
    void article.offsetWidth;
    article.classList.add('flash');
    setTimeout(() => article.classList.remove('flash'), 1600);
  };
  const arrive = (heading: HTMLElement | null, result: TravelResult) => {
    if (result !== 'arrived' || !heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  };
  let pendingTarget: Target = null;

  const openToIntro = async (push: boolean) => {
    if (push) writeState({ open: true, target: null }, '#whoa');
    pendingTarget = { kind: 'intro' };
    await open();
    if (pendingTarget?.kind !== 'intro') return;
    pendingTarget = null;
    arrive(introHeading, await travelTo(() => documentTop(introHeading) - headerOffset()));
  };

  const openToEntry = async (requested: string, push: boolean) => {
    const id = resolve(requested);
    if (!known.has(id)) {
      unknownNote.hidden = false;
      if (push) writeState({ open: true, target: id }, `#pile-${id}`);
      await openToIntro(false);
      return;
    }
    const article = document.getElementById(`pile-${id}`);
    if (!article) return;
    const atTarget = location.hash === `#pile-${id}` && mode === 'open';
    if (push && !atTarget) writeState({ open: true, target: id }, `#pile-${id}`);
    pendingTarget = { kind: 'entry', id };
    await open();
    if (pendingTarget?.kind !== 'entry' || pendingTarget.id !== id) return;
    pendingTarget = null;
    const result = await travelTo(() => documentTop(article) - headerOffset());
    if (result === 'arrived') {
      arrive(article.querySelector('h3'), result);
      flash(article);
    }
  };

  const close = async () => {
    writeState({ open: false, target: null }, '#whoa');
    pendingTarget = null;
    if (scrollY > documentTop(threshold) + innerHeight * 0.5) {
      const result = await travelTo(() => documentTop(threshold) - headerOffset());
      if (result === 'cancelled') {
        // The visitor took over: leave Endless open and say so in the address.
        writeState({ open: true, target: null }, '#whoa', true);
        return;
      }
    }
    collapse();
    if (document.activeElement === closeButton || !section.contains(document.activeElement)) toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', () => {
    if (mode === 'open' || mode === 'opening') void close();
    else {
      writeState({ open: true, target: null }, '#whoa');
      void open();
    }
  });
  closeButton.addEventListener('click', () => void close());

  // Owned links: compact objects, permalinks, related entries, the unknown-entry route. Plain clicks only.
  section.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('[data-pile-link]');
    if (!link || !isPlainClick(event)) return;
    event.preventDefault();
    const id = link.dataset.pileLink!;
    if (id === 'endless') void openToIntro(true);
    else void openToEntry(id, true);
  });

  back?.addEventListener('click', (event) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    void travelTo(() => documentTop(threshold) - headerOffset());
  });

  // The action label beside the main button says what a click would do for whatever is pointed at.
  let labelTimer = 0;
  const setAction = (text: string) => {
    clearTimeout(labelTimer);
    if (text) { actionLabel.textContent = text; actionLabel.classList.add('on'); }
    else labelTimer = window.setTimeout(() => actionLabel.classList.remove('on'), 180);
  };
  pieces.forEach((el, id) => {
    const title = el.querySelector('a')?.getAttribute('aria-label')?.replace(/ — take a closer look$/, '') ?? id;
    const link = el.querySelector('a');
    const on = () => setAction(`Take a closer look: “${title}”`);
    link?.addEventListener('mouseenter', on);
    link?.addEventListener('focus', on);
    link?.addEventListener('mouseleave', () => setAction(''));
    link?.addEventListener('blur', () => setAction(''));
  });
  const toggleHint = () => setAction(mode === 'open' || mode === 'opening' ? 'everything goes back on the pile.' : 'A little more about each thing, and places to follow it next.');
  toggle.addEventListener('mouseenter', toggleHint);
  toggle.addEventListener('focus', toggleHint);
  toggle.addEventListener('mouseleave', () => setAction(''));
  toggle.addEventListener('blur', () => setAction(''));

  // "Back to the pile" appears while you read deep inside Endless.
  function updateBack() {
    if (!back) return;
    const end = outer.getBoundingClientRect().bottom + scrollY;
    const show = mode === 'open' && scrollY > documentTop(threshold) + innerHeight * 0.6 && scrollY + innerHeight * 0.5 < end;
    back.classList.toggle('hide', !show);
  }
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; updateBack(); }); }, { passive: true });

  // Back and Forward restore the historical view without replaying the entrance or a competing scroll.
  addEventListener('popstate', () => {
    const s = readState();
    cancelTravel();
    pendingTarget = null;
    if (s) { settle(s.open); return; }
    // An entry recorded before the Pile was ever opened: it was closed then, unless its address says otherwise.
    const match = OWNED_HASH.exec(location.hash);
    settle(match ? match[1] !== 'pile' : false);
  });
  // An address typed or edited by hand: open hidden content and complete the journey.
  addEventListener('hashchange', () => {
    if (readState()) return;
    const match = OWNED_HASH.exec(location.hash);
    if (!match) {
      // A loosely written entry address typed in place: open it and settle on the canonical one.
      const aliased = location.hash ? byLoose.get(loose(location.hash)) : undefined;
      if (aliased) { writeState({ open: true, target: aliased }, `#pile-${aliased}`, true); void openToEntry(aliased, false); }
      return;
    }
    const target = match[1]!;
    if (target === 'pile') return;
    if (target === 'endless') void openToIntro(false);
    else void openToEntry(target.slice('pile-'.length), false);
  });

  // Returning through the back-forward cache: the page is as it was; only transient decoration resets.
  addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    document.querySelectorAll('.tk-stub.torn').forEach((stub) => stub.classList.remove('torn'));
  });
  addEventListener('pagehide', () => cancelTravel());

  // Reduced motion changing mid-animation settles the selected state rather than finishing a long animation.
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
    if (event.matches && (mode === 'opening' || mode === 'closing')) settle(mode === 'opening');
  });

  // ---------- ticket stubs tear before an ordinary same-tab visit ----------
  section.addEventListener('click', (event) => {
    const stub = (event.target as Element).closest<HTMLAnchorElement>('[data-tear]');
    if (!stub || !isPlainClick(event) || stub.target === '_blank' || reducedMotion()) return;
    event.preventDefault();
    const href = stub.href;
    let gone = false;
    const go = () => { if (!gone) { gone = true; location.assign(href); } };
    stub.classList.add('torn');
    stub.addEventListener('transitionend', go, { once: true });
    setTimeout(go, 600);
  });

  // ---------- entry interactions ----------
  const interactions = mountInteractions(section, {
    navigateToEntry: async (id) => {
      await openToEntry(id, true);
      return 'arrived';
    },
  });

  // ---------- arrival ----------
  const initial = readState();
  const held = boot.hash && OWNED_HASH.test(boot.hash) ? boot.hash : null;
  const alias = !boot.hash && location.hash && !OWNED_HASH.test(location.hash) ? byLoose.get(loose(location.hash)) : undefined;
  if (held) {
    // A cold shared link: restore the exact address, then open and travel once the board is ready.
    try {
      history.replaceState(boot.state ?? null, '', boot.url);
    } catch { /* keep going */ }
    const restore = () => { try { if (boot.restoration) history.scrollRestoration = boot.restoration; } catch { /* ignore */ } };
    const target = held.slice(1);
    const journey = target === 'endless' ? openToIntro(false) : openToEntry(target.slice('pile-'.length), false);
    void journey.finally(restore);
  } else if (alias) {
    // A loosely written entry address: open it and settle on the canonical one.
    writeState({ open: true, target: alias }, `#pile-${alias}`, true);
    void openToEntry(alias, false);
  } else if (initial?.open) {
    // A reload or full-document return to an open state: restore it without a fresh entrance.
    settle(true);
  }
}
