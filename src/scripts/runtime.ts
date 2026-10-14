/**
 * Site-wide browser behaviour shared by every page: reduced-motion state, eased travel that the visitor can always
 * interrupt, the toast, and reveals that wait until their content is properly in view.
 */
import { clamp, easeQuint } from '../lib/shape';

export const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Header height plus breathing room; wider screens stop a little earlier so a window doesn't hug the header. */
export const headerOffset = (): number => 62 + (innerWidth >= 720 ? 66 : 22);

export const documentTop = (el: Element): number => el.getBoundingClientRect().top + scrollY;

export type TravelResult = 'arrived' | 'cancelled';

let travel: { cancel: () => void } | null = null;
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

function cancelOnManual(event: Event): void {
  if (event.type === 'keydown' && !SCROLL_KEYS.has((event as KeyboardEvent).key)) return;
  travel?.cancel();
}
addEventListener('wheel', cancelOnManual, { passive: true });
addEventListener('touchstart', cancelOnManual, { passive: true });
addEventListener('keydown', cancelOnManual);

export function cancelTravel(): void {
  travel?.cancel();
}

/**
 * Eased, distance-aware scroll to a document position. Native smooth scrolling can't carry the authored curve or
 * duration. Manual wheel, touch or scrolling keys cancel it; a cancelled journey reports so.
 */
export function travelTo(targetY: number | (() => number), opts: { maxMs?: number } = {}): Promise<TravelResult> {
  travel?.cancel();
  const target = typeof targetY === 'function' ? targetY : () => targetY;
  const startY = scrollY;
  const limit = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const first = clamp(target(), 0, limit());
  if (reducedMotion() || Math.abs(first - startY) < 4) {
    scrollTo({ top: first, behavior: 'instant' });
    return Promise.resolve('arrived');
  }
  const distance = Math.abs(first - startY) / Math.max(1, innerHeight);
  const duration = Math.min(opts.maxMs ?? 2200, Math.max(700, 550 + 260 * Math.sqrt(distance)));
  const t0 = performance.now();
  let raf = 0;
  let done = false;
  return new Promise((resolve) => {
    const finish = (result: TravelResult) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      travel = null;
      resolve(result);
    };
    travel = { cancel: () => finish('cancelled') };
    const step = (now: number) => {
      if (done) return;
      const k = clamp((now - t0) / duration, 0, 1);
      // Rebase towards the current destination, so late layout changes never end in a visible snap.
      const to = clamp(target(), 0, limit());
      scrollTo({ top: startY + (to - startY) * easeQuint(k), behavior: 'instant' });
      if (k < 1) raf = requestAnimationFrame(step);
      else finish('arrived');
    };
    raf = requestAnimationFrame(step);
  });
}

let toastTimer = 0;
export function showToast(text: string): void {
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = text;
  toast.classList.add('on');
  toastTimer = window.setTimeout(() => toast.classList.remove('on'), 2200);
}

/** A plain primary click we may take over; modified clicks and other buttons keep their native behaviour. */
export function isPlainClick(event: MouseEvent): boolean {
  return !(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

/**
 * Reveals play once their content is properly in view: a dead band at the bottom of the viewport, and a higher
 * threshold for the larger demonstrations. Without IntersectionObserver everything is simply shown.
 */
export function observeReveals(root: ParentNode = document): void {
  const els = root.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    els.forEach((el) => el.setAttribute('data-on', ''));
    return;
  }
  const make = (threshold: number, rootMargin: string) =>
    new IntersectionObserver(
      (entries, observer) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-on', '');
          observer.unobserve(entry.target);
        }),
      { threshold, rootMargin },
    );
  const small = make(0.3, '0px 0px -18% 0px');
  const big = make(0.72, '0px 0px -8% 0px');
  els.forEach((el) => {
    const kind = el.dataset.reveal;
    const large = (kind === 'shelf' || kind === 'scene' || kind === 'why') && el.offsetHeight < innerHeight * 0.85;
    (large ? big : small).observe(el);
  });
}

/** Run once a section is properly in view, then stop watching. */
export function whenInView(el: Element, run: () => void, options: IntersectionObserverInit = { threshold: 0.35, rootMargin: '0px 0px -12% 0px' }): void {
  if (!('IntersectionObserver' in window)) {
    run();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      run();
    }
  }, options);
  observer.observe(el);
}
