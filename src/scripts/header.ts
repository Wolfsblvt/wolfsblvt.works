/**
 * The header's behaviour: the lockup easing from full to compact with the header background, the filling path, the
 * handwritten plain names on hover and focus, and the menu and community panels.
 */
import { markFrame } from '../lib/mark-ease';
import { clamp } from '../lib/shape';
import { reducedMotion } from './runtime';

export interface HeaderController {
  /** 0 at the top of the page, 1 once the header has settled. */
  setSettle(t: number): void;
  /** Reading progress along the path, 0..1. */
  setProgress(p: number): void;
  /** Mark one nav word as current (home page section spy). */
  setCurrent(id: string | null): void;
}

export function mountHeader(): HeaderController | null {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return null;
  const mark = header.querySelector<SVGSVGElement>('[data-mark]');
  const progress = header.querySelector<SVGPathElement>('[data-progress]');
  const progressMobile = header.querySelector<SVGRectElement>('[data-progress-m]');
  const still = mark?.classList.contains('mark-still') ?? true;
  let lastT = -1;
  let lastP = -1;

  const setSettle = (t: number) => {
    t = clamp(t, 0, 1);
    if (Math.abs(t - lastT) < 0.005 && t !== 0 && t !== 1) return;
    if (t === lastT) return;
    lastT = t;
    const blur = Math.round((2 + 8 * t) * 10) / 10;
    header.style.background = `rgb(16 11 17 / ${Math.round((0.24 + 0.58 * t) * 100) / 100})`;
    header.style.backdropFilter = `blur(${blur}px)`;
    header.style.setProperty('-webkit-backdrop-filter', `blur(${blur}px)`);
    header.style.borderBottomColor = `rgb(243 232 220 / ${Math.round((0.025 + 0.045 * t) * 1000) / 1000})`;
    if (!mark) return;
    const frame = markFrame(t, 60, innerWidth < 640, still);
    mark.setAttribute('viewBox', frame.viewBox);
    mark.style.width = `${frame.width}px`;
    mark.style.height = `${frame.height}px`;
    mark.style.marginTop = `${frame.marginTop}px`;
    mark.querySelector('[data-mark-orange]')?.setAttribute('transform', frame.orange);
    mark.querySelector('[data-mark-magenta]')?.setAttribute('transform', frame.magenta);
    mark.querySelectorAll('[data-mark-works]').forEach((g) => g.setAttribute('transform', frame.works));
    mark.querySelector('[data-mark-hand]')?.setAttribute('stroke-width', String(frame.worksStroke));
    mark.querySelector('[data-mark-knockout]')?.setAttribute('stroke-width', String(frame.knockoutStroke));
  };

  const setProgress = (p: number) => {
    p = clamp(p, 0, 1);
    if (Math.abs(p - lastP) < 0.002) return;
    lastP = p;
    progress?.setAttribute('stroke-dashoffset', String(Math.round((100 - p * 100) * 10) / 10));
    progressMobile?.setAttribute('width', String(Math.round(p * 1000) / 10));
  };

  const setCurrent = (id: string | null) => {
    header.querySelectorAll<HTMLAnchorElement>('.nav-a').forEach((a) => {
      const on = a.closest<HTMLElement>('[data-nav-item]')?.dataset.navItem === id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  };

  mountScribbles(header);
  mountPanels(header);
  return { setSettle, setProgress, setCurrent };
}

/** On hover or focus a word draws `...`, then writes its plain name underneath; it lingers, then wipes away. */
function mountScribbles(header: HTMLElement): void {
  header.querySelectorAll<HTMLElement>('[data-nav-item]').forEach((item) => {
    const link = item.querySelector<HTMLAnchorElement>('.nav-a');
    const slot = item.querySelector<HTMLElement>('[data-nav-scribble]');
    if (!link || !slot) return;
    const plain = slot.dataset.plain ?? '';
    const dots = document.createElement('span');
    dots.className = 'nav-x nav-dots';
    dots.setAttribute('aria-hidden', 'true');
    dots.textContent = '...';
    const name = slot;
    let state: 'idle' | 'dots' | 'name' | 'wipe' = 'idle';
    let timer = 0;
    const show = (el: HTMLElement, cls: string) => {
      el.className = `nav-x ${cls}`;
      if (!el.isConnected) item.append(el);
    };
    const clear = () => {
      dots.remove();
      name.textContent = '';
      name.className = 'nav-x';
      state = 'idle';
    };
    const enter = () => {
      clearTimeout(timer);
      if (state === 'dots' || state === 'name') return;
      if (reducedMotion()) {
        name.textContent = plain;
        show(name, '');
        state = 'name';
        return;
      }
      timer = window.setTimeout(() => {
        show(dots, 'nav-dots writing');
        state = 'dots';
        timer = window.setTimeout(() => {
          dots.className = 'nav-x nav-dots gone';
          name.textContent = plain;
          show(name, 'writing-slow');
          state = 'name';
        }, 650);
      }, 260);
    };
    const leave = () => {
      clearTimeout(timer);
      if (state === 'idle') return;
      timer = window.setTimeout(() => {
        dots.remove();
        name.className = 'nav-x wiping';
        state = 'wipe';
        timer = window.setTimeout(clear, 650);
      }, 1300);
    };
    link.addEventListener('mouseenter', enter);
    link.addEventListener('focus', enter);
    link.addEventListener('mouseleave', leave);
    link.addEventListener('blur', leave);
  });
}

/** The mobile menu and the community panel: one open at a time, closed by Escape or a click elsewhere. */
function mountPanels(header: HTMLElement): void {
  const toggles = [...header.querySelectorAll<HTMLButtonElement>('[data-panel-toggle]')];
  const panelOf = (button: HTMLButtonElement) => document.getElementById(button.dataset.panelToggle!);
  const close = (button: HTMLButtonElement, focus = false) => {
    const panel = panelOf(button);
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (focus) button.focus();
  };
  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const panel = panelOf(button);
      if (!panel) return;
      const opening = panel.hidden;
      toggles.forEach((other) => close(other));
      if (opening) {
        panel.hidden = false;
        button.setAttribute('aria-expanded', 'true');
      }
    });
    panelOf(button)?.addEventListener('click', (event) => {
      if ((event.target as Element).closest('a')) close(button);
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    toggles.forEach((button) => {
      const panel = panelOf(button);
      if (panel && !panel.hidden) close(button, panel.contains(document.activeElement) || document.activeElement === button);
    });
  });
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    toggles.forEach((button) => {
      if (!button.contains(target) && !panelOf(button)?.contains(target)) close(button);
    });
  });
}
