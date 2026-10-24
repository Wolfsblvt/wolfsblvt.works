/**
 * Yoru on the Works home page: the host that gives the resident his places and tells him what the page is doing.
 *
 * One actor in clipped, click-through layers. The page stage (the hero perch, the section bands, the footer nook,
 * Borrowed Coast's window) spans the document; the reader's lane and the bottom-edge peek live in a fixed layer over
 * the viewport, so there he rides along with their scrolling. Running out of view never makes the page scroll
 * sideways. He is in one place at a time, and once he has left the perch it stays empty (DECISIONS, 2026-10-24).
 *
 * How he keeps the reader company depends on the room beside the content. Where the screen leaves a real margin, he
 * follows in it. Where it does not (phones, most laptops), he never covers a reading line: he sits in the empty band
 * at the top of the section being read, on the edge of its first content, and runs ahead into the next one as its
 * start arrives. Partway through a long stretch with no section start in view, he peeks up over the bottom edge for a
 * moment, then goes on ahead (Wolf, 2026-10-24: "We do A", the section bands, with the peek for very long
 * sections).
 *
 * The page's own signals become invitations, never commands. Nothing is stored and nothing leaves the page.
 * Remembered acquaintance is built but not offered here until the site's storage account changes (Wolf, 2026-10-24:
 * "Build it, opt-in only").
 */
import { YORU_FAMILIES } from '../../../generated/yoru-families';
import { reducedMotion } from '../../../scripts/runtime';
import { ClipLibrary } from '../clips';
import { SpritePlayer } from '../player';
import { Resident } from '../resident';
import type { Link, Place, Surface, World } from '../world';

const SHEETS = '/yoru/resident';

/**
 * His margin lane, v1's follower spot: how far in from the viewport's right edge and above its bottom it sits, its
 * width, and the space it keeps from the content (Borrowed Coast's hand steps out to the right clear of it).
 */
const LANE = { right: 0.035, bottom: 0.13, width: 90, gutter: 16 };
/** Standing Yoru's height on the page (198 master pixels at half size), and how much of it shows when he peeks. */
const STANDING = 99;
const PEEK_SHOWS = 44;
/** How long he peeks before going on ahead. */
const PEEK_MS = 5000;
/** The same place is not asked for again within this (longer than any trip), so scrolling never interrupts him. */
const ASK_AGAIN_MS = 10000;

type Mode = 'lane' | 'bands';

export function mountResident(): void {
  const perchLine = document.querySelector<HTMLElement>('[data-yoru-perch]');
  const heroSpot = document.querySelector<HTMLElement>('[data-yoru-hero]');
  const caption = document.querySelector<HTMLElement>('[data-yoru-cap]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const footer = document.querySelector<HTMLElement>('[data-footer]');
  const header = document.querySelector<HTMLElement>('header');
  const coast = document.querySelector<HTMLElement>('.bc-stage');
  if (!perchLine || !hero || !footer) return;
  const frames = [...document.querySelectorAll<HTMLElement>('main section.frame')];

  // ---------- layers ----------
  const stage = layer('yoru-stage');
  const lane = layer('yoru-lane');
  const coastLayer = coast ? layer('yoru-scene', coast) : null;

  const yoru = document.createElement('button');
  yoru.type = 'button';
  yoru.className = 'yoru-resident';
  yoru.setAttribute('aria-label', 'Yoru, the resident. Poke him.');
  yoru.title = 'Yoru';
  stage.append(yoru);

  const clips = new ClipLibrary(Object.entries(YORU_FAMILIES).map(([family, manifest]) => ({
    manifest, sheetUrl: `${SHEETS}/${family}-1x.webp`, sheetUrl2x: `${SHEETS}/${family}-2x.webp`,
  })));

  // ---------- the room beside the content ----------
  let contentRight = 0;
  let mode: Mode = 'lane';
  const measure = () => {
    stage.style.height = `${document.documentElement.scrollHeight}px`;
    contentRight = Math.max(0, ...frames.map((f) => f.getBoundingClientRect().right));
    mode = innerWidth * (1 - LANE.right) - LANE.width >= contentRight + LANE.gutter ? 'lane' : 'bands';
  };
  measure();

  // ---------- places ----------
  const docRect = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, bottom: r.bottom + scrollY, width: r.width, height: r.height };
  };
  const nookCentre = () => {
    const r = docRect(footer);
    return { x: r.right - r.width * 0.08 - 60, y: r.top };
  };
  const fixedLayer = () => ({ element: lane, origin: { x: scrollX, y: scrollY } });

  // One band per section: the empty space at its top, where he stands on the top edge of its first content (a
  // project's window, or the heading block) at the right, above whatever is drawn in the corner below.
  const bands = frames
    .filter((frame) => frame !== hero)
    .map((frame) => ({
      id: `band-${frame.id || frames.indexOf(frame)}`,
      start: () => [...frame.children].find((child) => child.getBoundingClientRect().height > 0) ?? frame,
    }));

  const places: Place[] = [
    {
      id: 'perch', kind: 'perch',
      surface: (): Surface => { const r = docRect(perchLine); return { left: r.left + 30, right: r.right - 30, y: r.top }; },
    },
    {
      id: 'lane', kind: 'ground',
      surface: (): Surface | null => {
        if (mode !== 'lane') return null;
        const right = scrollX + innerWidth * (1 - LANE.right);
        return { left: right - LANE.width, right, y: scrollY + innerHeight * (1 - LANE.bottom) };
      },
      layer: fixedLayer,
    },
    ...bands.map(({ id, start }): Place => ({
      id, kind: 'ground',
      surface: (): Surface | null => {
        if (mode !== 'bands') return null;
        const s = docRect(start());
        return { left: s.right - 100, right: s.right - 20, y: s.top };
      },
    })),
    {
      // Sunk below the bottom edge at the right, so only his ears and eyes show.
      id: 'peek', kind: 'peek',
      surface: (): Surface | null => {
        if (mode !== 'bands') return null;
        const right = scrollX + innerWidth - LANE.gutter;
        return { left: right - 60, right, y: scrollY + innerHeight + STANDING - PEEK_SHOWS };
      },
      layer: fixedLayer,
    },
    {
      id: 'nook', kind: 'nook', restful: true,
      surface: (): Surface => { const c = nookCentre(); return { left: c.x - 28, right: c.x + 28, y: c.y - 26 }; },
    },
  ];

  // Out of view and back in, from the right: the way between places too far apart to be joined in view.
  const offscreen = (from: string, to: string, arrive = 0.5): Link => ({ from, to, way: 'offscreen', at: 'right', enter: 'right', arrive });
  const bandIds = bands.map((b) => b.id);
  const links: Link[] = [
    offscreen('perch', 'lane'),
    offscreen('lane', 'nook'),
    offscreen('nook', 'lane'),
    ...['perch', 'peek', 'nook', ...bandIds].flatMap((from) => bandIds.filter((to) => to !== from).map((to) => offscreen(from, to, 0.6))),
    ...bandIds.flatMap((id) => [offscreen(id, 'peek'), offscreen(id, 'nook')]),
    offscreen('peek', 'nook'),
  ];

  // The section stretch each band starts: -1 is the hero's, from the perch down to the first band.
  const stretchOf = (id: string): number => bandIds.indexOf(id);
  const stretchTop = (stretch: number): number =>
    stretch < 0 ? docRect(perchLine).top : docRect(bands[stretch]!.start()).top;

  let coastStretch = -2;
  if (coast && coastLayer) {
    places.push({
      // Inside Borrowed Coast's window, behind its lower edge, clear of the mode nav in its bottom right corner.
      id: 'coast', kind: 'guest',
      surface: (): Surface | null => {
        const r = docRect(coast);
        return r.width ? { left: r.left + r.width * 0.08, right: r.left + r.width * 0.55, y: r.bottom + 2 } : null;
      },
      layer: () => { const r = docRect(coast); return { element: coastLayer, origin: { x: r.left, y: r.top } }; },
    });
    links.push(
      { from: 'lane', to: 'coast', way: 'hop', at: 'left', leave: 0, arrive: 0.85 },
      { from: 'coast', to: 'lane', way: 'hop', at: 'right', arrive: 0.3 },
    );
    // Without a margin he comes into the window from its side, from the band of the stretch it sits in.
    const top = docRect(coast).top;
    coastStretch = bands.reduce((found, band, i) => (docRect(band.start()).top <= top ? i : found), -1);
    const home = bandIds[coastStretch];
    if (home) links.push(offscreen(home, 'coast', 0.7), offscreen('coast', home));
  }
  const world: World = { places, links };

  // ---------- his nook ----------
  const cushion = document.createElement('div');
  cushion.className = 'yoru-prop';
  stage.append(cushion);
  const cushionPlayer = new SpritePlayer(cushion);
  cushion.style.pointerEvents = 'none';
  const placeCushion = () => { const c = nookCentre(); cushionPlayer.hold(clips.get('nook/cushion'), 0); cushionPlayer.moveTo(c.x, c.y + 4); };
  placeCushion();

  // ---------- the resident ----------
  let heroGone = false;
  let footerVisible = false;
  let peekStretch = -2;
  const peeked = new Set<number>();
  let peekTimer = 0;

  const resident = new Resident({
    player: new SpritePlayer(yoru),
    clips,
    world,
    start: { place: 'perch', at: 0.5 },
    seed: (Date.now() / 86400000) | 0,
    reducedMotion: reducedMotion(),
    onPlace: (id) => {
      if (id !== 'perch' && caption && !caption.hidden) {
        caption.classList.add('wiping');
        setTimeout(() => { caption.hidden = true; }, 700);
      }
      clearTimeout(peekTimer);
      // A peek is a moment: then he goes on ahead, to the next band or, after the last, his nook.
      if (id === 'peek') peekTimer = window.setTimeout(() => ask(bandIds[peekStretch + 1] ?? 'nook'), PEEK_MS);
    },
  });
  yoru.addEventListener('click', () => resident.poke());
  // The resident draws him from now on; the hero's own still frame was only for pages without JavaScript.
  heroSpot?.setAttribute('hidden', '');
  resident.start();

  let asked = { id: '', at: 0 };
  function ask(id: string): void {
    if (resident.state.place === id || (asked.id === id && performance.now() - asked.at < ASK_AGAIN_MS)) return;
    asked = { id, at: performance.now() };
    resident.invite(id);
  }

  /** The stretch of page he is keeping company with, wherever he is in it. */
  const stretchHere = (): number | null => {
    const here = resident.state.place;
    if (here === 'perch') return heroGone ? -1 : null;
    if (here === 'peek') return peekStretch;
    if (here === 'coast') return coastStretch;
    if (here === 'nook') return footerVisible ? null : bands.length - 1;
    const stretch = stretchOf(here);
    return stretch < 0 ? null : stretch;
  };

  /** In band mode, the reader's position decides where he would like to be. */
  function follow(): void {
    if (mode !== 'bands' || footerVisible) return;
    const stretch = stretchHere();
    if (stretch === null) return;
    const top = (header?.getBoundingClientRect().bottom ?? 0) + 8;
    // The lowest section start in view: as the next one arrives at the bottom, he runs ahead to it.
    let inView = -1;
    bands.forEach((band, i) => {
      const y = band.start().getBoundingClientRect().top;
      if (y >= top && y <= innerHeight * 0.85) inView = i;
    });
    if (inView >= 0) {
      if (inView !== stretch || resident.state.place === 'peek') ask(bandIds[inView]!);
      return;
    }
    // A long stretch: a screen into the one being read with nothing new in view, he peeks up once.
    const reading = bands.reduce((found, band, i) => (band.start().getBoundingClientRect().top <= innerHeight / 2 ? i : found), -1);
    if (resident.state.place !== 'peek' && !peeked.has(reading) && scrollY + top - stretchTop(reading) > innerHeight) {
      peeked.add(reading);
      peekStretch = reading;
      ask('peek');
    }
  }

  // ---------- what the page tells him ----------
  new IntersectionObserver(([entry]) => {
    // The first report can arrive before a real scroll; only a real scroll away counts.
    heroGone = !entry!.isIntersecting && scrollY > 80;
    if (!heroGone || resident.state.place !== 'perch') return;
    if (mode === 'lane') ask('lane'); else follow();
  }, { threshold: 0.05 }).observe(hero);
  new IntersectionObserver(([entry]) => {
    footerVisible = entry!.isIntersecting;
    if (footerVisible && resident.state.place !== 'perch') ask('nook');
    if (!footerVisible && resident.state.place === 'nook') {
      if (mode === 'lane') ask('lane'); else follow();
    }
  }, { threshold: 0.2 }).observe(footer);

  let scheduled = false;
  addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; follow(); });
  }, { passive: true });

  if (coast) {
    for (const radio of document.querySelectorAll<HTMLInputElement>('.bc-radio')) {
      radio.addEventListener('change', () => {
        if (resident.state.place === 'coast') { resident.sceneChanged('coast'); return; }
        // The window has the reader's attention; he comes to look only if he is right beside it.
        if (mode === 'bands') {
          if (stretchHere() === coastStretch && resident.state.place !== 'peek') ask('coast');
          return;
        }
        const scene = places.find((p) => p.id === 'coast')!.surface();
        const here = places.find((p) => p.id === 'lane')!.surface();
        if (scene && here && resident.state.place === 'lane' && Math.abs(scene.y - here.y) < 160 && here.left - scene.right < 420) ask('coast');
      });
    }
  }

  const relayout = () => {
    const before = mode;
    measure();
    placeCushion();
    resident.layoutChanged();
    // Crossing between margin and bands moves him to where the new layout keeps him.
    if (mode !== before && heroGone) { if (mode === 'lane') ask('lane'); else follow(); }
  };
  new ResizeObserver(relayout).observe(document.body);
  addEventListener('resize', relayout);
  // A hidden tab does no visual work; he picks up where he was when it is seen again.
  document.addEventListener('visibilitychange', () => (document.hidden ? resident.stop() : resident.start()));
}

/** A clipped, click-through layer for him to live in, on the page or inside a scene. */
function layer(className: string, parent: HTMLElement = document.body): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  parent.append(el);
  return el;
}
