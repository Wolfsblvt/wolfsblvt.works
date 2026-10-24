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
 * The page's own signals become invitations, never commands. Nothing leaves the page, and nothing is stored unless the
 * visitor asks him to remember them (remember.ts): he offers when he settles in his nook.
 */
import { YORU_FAMILIES } from '../../../generated/yoru-families';
import { reducedMotion } from '../../../scripts/runtime';
import { ClipLibrary } from '../clips';
import { SpritePlayer } from '../player';
import { Resident } from '../resident';
import { keepWhileVisiting, observeAcquaintance, offerToRemember, recall } from './remember';
import type { Acquaintance } from '../memory';
import type { Link, Place, Surface, World } from '../world';

const SHEETS = '/yoru/resident';

/** The keepsake (a frame of nook/keepsakes) he brings home from each scene. */
const KEEPSAKES: Record<string, number> = { coast: 0 };

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
  const captionOnRight = () => {
    if (!caption || caption.hidden) return false;
    const c = caption.getBoundingClientRect(), p = perchLine.getBoundingClientRect();
    return c.left + c.width / 2 > p.left + p.width / 2;
  };
  const fixedLayer = () => ({ element: lane, origin: { x: scrollX, y: scrollY } });

  // The porch: the top edge of whatever comes right below the hero, a ladder's length under the perch. The first
  // scroll asks him down, by his ladder, where the reader can still see him go.
  const firstContent = (section: Element): Element => [...section.children].find((child) => child.getBoundingClientRect().height > 0) ?? section;
  const belowHero = hero.nextElementSibling;

  // One band per section: the empty space at its top, where he stands on the top edge of its first content (a
  // project's window, or the heading block) at the right, above whatever is drawn in the corner below.
  const bands = frames
    .filter((frame) => frame !== hero)
    .map((frame) => ({
      id: `band-${frame.id || frames.indexOf(frame)}`,
      start: () => firstContent(frame),
    }));

  const places: Place[] = [
    {
      id: 'perch', kind: 'perch',
      surface: (): Surface => { const r = docRect(perchLine); return { left: r.left + 30, right: r.right - 30, y: r.top }; },
    },
    {
      id: 'porch', kind: 'ground',
      surface: (): Surface | null => {
        if (!belowHero) return null;
        const r = docRect(firstContent(belowHero));
        return { left: r.left, right: r.right, y: r.top };
      },
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
    // Down from the end of the perch away from his caption, so the ladder never hangs across the handwriting (it sits
    // to the perch's right on narrow screens and to its left on wide ones).
    {
      from: 'perch', to: 'porch', way: 'ladder-down',
      get at() { return captionOnRight() ? 'left' : 'right'; },
      get arrive() { return captionOnRight() ? 0 : 1; },
    } as Link,
    offscreen('perch', 'lane'),
    offscreen('porch', 'lane'),
    offscreen('porch', 'peek'),
    offscreen('porch', 'nook'),
    offscreen('lane', 'nook'),
    offscreen('nook', 'lane'),
    ...['perch', 'porch', 'peek', 'nook', ...bandIds].flatMap((from) => bandIds.filter((to) => to !== from).map((to) => offscreen(from, to, 0.6))),
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
      // The wide margin is beyond an honest hop into the safe part of the window. Use the same authored travel as bands.
      offscreen('lane', 'coast', 0.85),
      offscreen('coast', 'lane', 0.3),
    );
    // Without a margin he comes into the window from its side, from the band of the stretch it sits in.
    const top = docRect(coast).top;
    coastStretch = bands.reduce((found, band, i) => (docRect(band.start()).top <= top ? i : found), -1);
    const home = bandIds[coastStretch];
    if (home) links.push(offscreen(home, 'coast', 0.7), offscreen('coast', home));
  }
  const world: World = { places, links };

  // ---------- his nook ----------
  const { record, returning } = recall();
  // The cushion, and beside it a keepsake from each scene he has visited with a visitor who asked to be remembered.
  const keepsakes = (memory: Acquaintance | null) => (memory?.discovered ?? [])
    .filter((id) => id in KEEPSAKES && clips.has('nook/keepsakes'))
    .map((id, i) => ({ clip: 'nook/keepsakes', frame: KEEPSAKES[id]!, dx: 80 + i * 26 }));
  const makeProp = (p: { clip: string; frame: number; dx: number }) => {
    const el = document.createElement('div');
    el.className = 'yoru-prop';
    stage.append(el);
    el.style.pointerEvents = 'none';
    return { ...p, el, player: new SpritePlayer(el) };
  };
  const props = [{ clip: 'nook/cushion', frame: 0, dx: 0 }, ...keepsakes(record)].map(makeProp);
  const placeCushion = () => {
    const c = nookCentre();
    for (const p of props) { p.player.hold(clips.get(p.clip), p.frame); p.player.moveTo(c.x + p.dx, c.y + 4); }
  };
  placeCushion();
  // Someone he knows, back on another day: the hero's introduction becomes a greeting.
  const greeting = caption?.querySelector('span');
  const introduction = greeting?.textContent ?? '';
  if (returning && greeting) greeting.textContent = 'oh. you again.';

  /**
   * His note beside him in the nook: above and to his left while there is room on screen; on a narrow screen scrolled
   * to the bottom, where the nook sits right under the header, just below his line instead, beside the footer's logo.
   */
  const noteBesideNook = ({ width, height }: { width: number; height: number }) => {
    const c = nookCentre();
    const headerBottom = (header?.getBoundingClientRect().bottom ?? 0) + 12;
    const above = c.y - 40 - height - scrollY > headerBottom;
    return above ? { left: c.x - 64 - width, top: c.y - 40 - height } : { left: c.x + 70 - width, top: c.y + 14 };
  };

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
    acquaintance: record,
    onPlace: (id) => {
      // Settled in his nook at the end of the page: the moment he asks whether to remember the visitor.
      if (id === 'nook') offerToRemember({ layer: stage, inline: footer.querySelector<HTMLElement>('.foot-frame')!, resident, place: noteBesideNook });
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
  observeAcquaintance(resident, (current) => {
    for (const prop of props.splice(1)) prop.el.remove();
    props.push(...keepsakes(current).map(makeProp));
    placeCushion();
    if (!current && greeting) greeting.textContent = introduction;
  });
  keepWhileVisiting(resident);
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
    if (here === 'porch') return -1;
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

  /** The reader's first real scroll, while the porch is in view: he climbs down to it. */
  function descend(): void {
    if (resident.state.place !== 'perch' || scrollY <= 80 || !belowHero) return;
    const y = firstContent(belowHero).getBoundingClientRect().top;
    if (y > 0 && y < innerHeight) ask('porch');
  }

  // ---------- what the page tells him ----------
  new IntersectionObserver(([entry]) => {
    // The first report can arrive before a real scroll; only a real scroll away counts.
    heroGone = !entry!.isIntersecting && scrollY > 80;
    if (!heroGone || !['perch', 'porch'].includes(resident.state.place)) return;
    // A reader who jumped straight to the end finds him in his nook.
    if (footerVisible) ask('nook'); else if (mode === 'lane') ask('lane'); else follow();
  }, { threshold: 0.05 }).observe(hero);
  new IntersectionObserver(([entry]) => {
    footerVisible = entry!.isIntersecting;
    if (footerVisible && (resident.state.place !== 'perch' || heroGone)) ask('nook');
    if (!footerVisible && resident.state.place === 'nook') {
      if (mode === 'lane') ask('lane'); else follow();
    }
  }, { threshold: 0.2 }).observe(footer);

  let scheduled = false;
  addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; descend(); follow(); });
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
        if (scene && here && resident.state.place === 'lane' && Math.abs(scene.y - here.y) < 160 && here.left - docRect(coast).right < 420) ask('coast');
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
