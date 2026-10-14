/**
 * The home page walk: where-am-I (current word and the slowly filling path), the What arrow, eased travel along the
 * nav, Yoru's day (hero, following along, napping on the footer), the chat, the sponsor section's one play, and the
 * Discord buttons.
 */
import { clamp, round1 } from '../lib/shape';
import { documentTop, headerOffset, isPlainClick, reducedMotion, showToast, travelTo, whenInView } from './runtime';
import { header } from './site';

const SECTIONS = ['hi', 'what', 'why', 'what2', 'who', 'help', 'whoa', 'hello'] as const;

function mountWalkSpy(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const threshold = document.querySelector<HTMLElement>('[data-pile-threshold]');
  const arrow = document.querySelector<SVGSVGElement>('[data-what-arrow]');
  let current = '';
  let arrowState: 'none' | 'draw' | 'wipe' = 'none';
  let arrowTimer = 0;

  const tops = () => {
    const out: Record<string, number> = {};
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el) out[id] = documentTop(el);
    }
    return out;
  };

  const drawArrow = () => {
    const nav = document.querySelector<HTMLElement>('[data-nav]');
    if (!arrow || !nav) return;
    const item = (id: string) => nav.querySelector<HTMLElement>(`[data-nav-item="${id}"]`);
    const what = item('what');
    const why = item('why');
    if (!what || !why) return;
    // A shallow arc from What to the gap between Why and Who, inside the header; the head follows the tangent.
    const x0 = what.offsetLeft + what.offsetWidth / 2;
    const x1 = why.offsetLeft + why.offsetWidth + 10;
    const w = Math.max(40, x1 - x0 + 12);
    const sx = 14, sy = 9, ex = w - 6, ey = 11, c1x = w * 0.25, c1y = -1, c2x = w * 0.72, c2y = -2;
    const tx = ex - c2x, ty = ey - c2y, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, L = 7, a = 0.5;
    const hx1 = ex - L * (ux * Math.cos(a) - uy * Math.sin(a)), hy1 = ey - L * (uy * Math.cos(a) + ux * Math.sin(a));
    const hx2 = ex - L * (ux * Math.cos(-a) - uy * Math.sin(-a)), hy2 = ey - L * (uy * Math.cos(-a) + ux * Math.sin(-a));
    arrow.style.left = `${x0 - 6}px`;
    arrow.style.width = `${w}px`;
    arrow.setAttribute('viewBox', `0 -2 ${w} 16`);
    arrow.querySelector('.wa-line')!.setAttribute('d', `M${sx} ${sy} C ${round1(c1x)} ${c1y}, ${round1(c2x)} ${c2y}, ${round1(ex)} ${ey}`);
    arrow.querySelector('.wa-head')!.setAttribute('d', `M${round1(hx1)} ${round1(hy1)} L${round1(ex)} ${ey} L${round1(hx2)} ${round1(hy2)}`);
  };

  const setArrow = (state: 'none' | 'draw' | 'wipe') => {
    if (!arrow || state === arrowState) return;
    arrowState = state;
    clearTimeout(arrowTimer);
    if (state === 'draw') {
      drawArrow();
      arrow.style.display = '';
      arrow.classList.remove('wiping');
      arrow.classList.add('draw');
    } else if (state === 'wipe') {
      arrow.classList.remove('draw');
      arrow.classList.add('wiping');
      arrowTimer = window.setTimeout(() => setArrow('none'), 700);
    } else {
      arrow.style.display = 'none';
      arrow.classList.remove('wiping', 'draw');
    }
  };

  const update = () => {
    const t = tops();
    const vh = innerHeight;
    const docH = document.documentElement.scrollHeight;
    const y = scrollY + vh * 0.35;
    let now = 'hi';
    for (const id of SECTIONS) if (t[id] !== undefined && t[id]! <= y) now = id;
    if (scrollY + vh >= docH - 4) now = 'hello';
    // Progress: before the pile 0..0.84, the pile and its continuation 0.84..0.95 (slow when open), closing to 1.
    const pileTop = threshold ? documentTop(threshold) : t.whoa ?? docH;
    const a = Math.max(1, pileTop - vh * 0.3);
    const b = Math.max(a + 1, (t.hello ?? docH) - vh * 0.4);
    const maxY = Math.max(1, docH - vh);
    const s = scrollY;
    const p = s <= a ? (s / a) * 0.84 : s <= b ? 0.84 + ((s - a) / (b - a)) * 0.11 : 0.95 + ((s - b) / Math.max(1, maxY - b)) * 0.05;
    header?.setProgress(clamp(p, 0, 1));
    header?.setSettle(clamp(scrollY / Math.max(1, (hero?.offsetHeight ?? 700) * 0.75), 0, 1));
    const navId = now === 'what2' ? 'what' : now;
    if (navId !== current) {
      current = navId;
      header?.setCurrent(navId);
    }
    if (now === 'what2') setArrow('draw');
    else if (arrowState === 'draw') setArrow('wipe');
  };

  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();
}

/** Nav words travel along the walk with the eased curve; the address follows without a native jump. */
function mountNavTravel(): void {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('[data-nav-link]');
    if (!link || !isPlainClick(event)) return;
    const id = link.dataset.navLink!;
    const target = id === 'whoa' ? document.querySelector('[data-pile-threshold]') : document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    void travelTo(() => (id === 'hi' ? 0 : documentTop(target) - headerOffset()));
    try {
      history.pushState(history.state, '', `#${id}`);
    } catch { /* keep the journey */ }
  });
}

/**
 * Yoru: on the hero until it scrolls away, then he follows along at the edge, sits, dozes, runs off when clicked and
 * comes back, and naps on the footer. Caption wipes away the first time he leaves, writes back when the hero returns.
 */
function mountYoru(): void {
  const heroSpot = document.querySelector<HTMLElement>('[data-yoru-hero]');
  const heroSprite = document.querySelector<HTMLElement>('[data-yoru-hero-sprite]');
  const cap = document.querySelector<HTMLElement>('[data-yoru-cap]');
  const follower = document.querySelector<HTMLElement>('[data-yoru-follower]');
  const followerButton = follower?.querySelector<HTMLButtonElement>('button');
  const followerSprite = follower?.querySelector<HTMLElement>('.sprite');
  const nap = document.querySelector<HTMLElement>('[data-yoru-nap]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const footer = document.querySelector<HTMLElement>('[data-footer]');
  if (!heroSpot || !heroSprite || !follower || !followerButton || !followerSprite || !nap || !hero || !footer) return;
  const reduce = reducedMotion();

  type State = 'hero' | 'pre' | 'in' | 'sit' | 'doze' | 'flee' | 'away' | 'leave' | 'nap';
  let state: State = 'hero';
  let timer = 0;
  let footerVisible = false;
  const ANIM: Partial<Record<State, string>> = { pre: 's-runL', in: 's-runL', sit: 's-sit', doze: 's-doze', flee: 's-runR', leave: 's-runR' };

  const render = () => {
    heroSpot.style.visibility = state === 'hero' ? '' : 'hidden';
    const following = ['pre', 'in', 'sit', 'doze', 'flee', 'leave'].includes(state);
    follower.hidden = !following;
    follower.classList.toggle('out', state === 'pre' || state === 'flee' || state === 'leave');
    followerSprite.className = `sprite ${ANIM[state] ?? 's-idle'}`;
    nap.hidden = state !== 'nap';
  };
  const set = (next: State) => { state = next; render(); };

  const enter = () => {
    clearTimeout(timer);
    if (reduce) { set('sit'); return; }
    set('pre');
    timer = window.setTimeout(() => {
      set('in');
      timer = window.setTimeout(() => {
        set('sit');
        timer = window.setTimeout(() => { if (state === 'sit') set('doze'); }, 14000);
      }, 1650);
    }, 40);
  };

  let capGone = false;
  new IntersectionObserver((entries) => {
    const visible = entries[0]!.isIntersecting;
    // The first report can arrive before a real scroll; only a real scroll away counts.
    if (!visible && scrollY < 80) return;
    if (visible && capGone && cap) {
      capGone = false;
      cap.hidden = false;
      cap.classList.remove('wiping');
      cap.classList.add('back');
    }
    if (!visible && state === 'hero') {
      if (cap && !capGone) {
        cap.classList.add('wiping');
        setTimeout(() => { capGone = true; cap.hidden = true; }, 700);
      }
      enter();
    }
    if (visible && ['sit', 'in', 'doze', 'pre'].includes(state)) { clearTimeout(timer); set('hero'); }
  }, { threshold: 0.05 }).observe(hero);

  new IntersectionObserver((entries) => {
    footerVisible = entries[0]!.isIntersecting;
    if (footerVisible && ['sit', 'doze', 'in'].includes(state)) {
      clearTimeout(timer);
      set('leave');
      timer = window.setTimeout(() => set('nap'), reduce ? 0 : 1600);
    }
    if (!footerVisible && state === 'nap') enter();
  }, { threshold: 0.2 }).observe(footer);

  followerButton.addEventListener('click', () => {
    if (state !== 'sit' && state !== 'doze') return;
    clearTimeout(timer);
    set('flee');
    timer = window.setTimeout(() => {
      set('away');
      timer = window.setTimeout(() => { if (!footerVisible && state === 'away') enter(); }, 9000);
    }, 1650);
  });

  // Now and then he looks around.
  if (!reduce) {
    setInterval(() => {
      if (state !== 'hero') return;
      heroSprite.className = 'sprite s-look';
      setTimeout(() => { heroSprite.className = 'sprite s-idle'; }, 1700);
    }, 9000);
  }
  render();
}

/** The chat plays at a sped-up, uneven pace once the section is properly in view. */
function mountChat(): void {
  const body = document.querySelector<HTMLElement>('[data-chat]');
  const who = document.querySelector<HTMLElement>('[data-who]');
  if (!body || !who) return;
  const pace = JSON.parse(body.dataset.pace ?? '[]') as [number, number, number][];
  const show = (m: number, l: number) => {
    body.querySelector(`[data-msg="${m}"]`)?.classList.add('on');
    body.querySelector(`[data-line="${m}.${l}"]`)?.classList.add('on');
  };
  if (reducedMotion()) { pace.forEach(([m, l]) => show(m, l)); return; }
  whenInView(who, () => {
    let t = 0;
    pace.forEach(([m, l, delay]) => { t += delay; setTimeout(() => show(m, l), t); });
  }, { threshold: 0.4, rootMargin: '0px 0px -15% 0px' });
}

/** The shared sponsor component plays its motion once, the first time it is properly in view. */
function mountSponsor(): void {
  const sponsor = document.querySelector<HTMLElement>('[data-sponsor]');
  if (!sponsor || reducedMotion() || !('IntersectionObserver' in window)) return;
  sponsor.classList.add('will-play');
  whenInView(sponsor, () => sponsor.classList.add('is-playing'));
}

/** Discord: try the app first, fall back to the web profile if nothing took focus. Copy handle copies the handle. */
function mountDiscord(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-discord-app]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!isPlainClick(event)) return;
      event.preventDefault();
      const web = link.href;
      let launched = false;
      const mark = () => { launched = true; };
      const visibility = () => { if (document.hidden) mark(); };
      addEventListener('blur', mark, { once: true });
      document.addEventListener('visibilitychange', visibility);
      try { location.href = link.dataset.discordApp!; } catch { /* no handler */ }
      setTimeout(() => {
        removeEventListener('blur', mark);
        document.removeEventListener('visibilitychange', visibility);
        if (launched || document.hidden) return;
        const opened = window.open(web, '_blank', 'noopener');
        if (!opened) location.href = web;
      }, 1500);
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-copy-handle]').forEach((button) => {
    button.addEventListener('click', async () => {
      const handle = button.dataset.copyHandle!;
      let ok = false;
      try { await navigator.clipboard.writeText(handle); ok = true; } catch { /* clipboard refused */ }
      showToast(ok ? `Copied @${handle}` : `Discord: @${handle}`);
    });
  });
}

mountWalkSpy();
mountNavTravel();
mountYoru();
mountChat();
mountSponsor();
mountDiscord();
