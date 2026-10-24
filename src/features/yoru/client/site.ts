/**
 * Yoru on the Works home page: the host that gives the resident his places and tells him what the page is doing.
 *
 * One actor in two layers. The page stage (the hero perch, the footer nook, Borrowed Coast's window) spans the
 * document; the margin lane is a fixed layer over the viewport, so while he follows the reader he rides along with
 * their scrolling without a scroll handler. Both are clipped: running out of view never makes the page scroll
 * sideways. The page's own signals become invitations, never commands: the hero scrolling away asks him along, the
 * footer coming into view offers his nook, switching Borrowed Coast's chart is something he notices when he is in
 * there. He is in one place at a time, and once he has left the perch it stays empty (DECISIONS, 2026-10-24).
 *
 * Nothing is stored and nothing leaves the page. Remembered acquaintance is built but not offered here until the
 * site's storage account changes (Wolf, 2026-10-24: "Build it, opt-in only").
 */
import { YORU_FAMILIES } from '../../../generated/yoru-families';
import { reducedMotion } from '../../../scripts/runtime';
import { ClipLibrary } from '../clips';
import { SpritePlayer } from '../player';
import { Resident } from '../resident';
import type { Place, Surface, World } from '../world';

const SHEETS = '/yoru/resident';

/** How far in from the viewport's right edge his lane sits, and how high above its bottom: v1's follower spot. */
const LANE = { right: 0.035, bottom: 0.13, width: 90 };

export function mountResident(): void {
  const perchLine = document.querySelector<HTMLElement>('[data-yoru-perch]');
  const heroSpot = document.querySelector<HTMLElement>('[data-yoru-hero]');
  const caption = document.querySelector<HTMLElement>('[data-yoru-cap]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const footer = document.querySelector<HTMLElement>('[data-footer]');
  const coast = document.querySelector<HTMLElement>('.bc-stage');
  if (!perchLine || !hero || !footer) return;

  // ---------- layers ----------
  const stage = layer('yoru-stage');
  const lane = layer('yoru-lane');
  const coastLayer = coast ? layer('yoru-scene', coast) : null;
  const sizeStage = () => { stage.style.height = `${document.documentElement.scrollHeight}px`; };
  sizeStage();

  const yoru = document.createElement('button');
  yoru.type = 'button';
  yoru.className = 'yoru-resident';
  yoru.setAttribute('aria-label', 'Yoru, the resident. Poke him.');
  yoru.title = 'Yoru';
  stage.append(yoru);

  const clips = new ClipLibrary(Object.entries(YORU_FAMILIES).map(([family, manifest]) => ({
    manifest, sheetUrl: `${SHEETS}/${family}-1x.webp`, sheetUrl2x: `${SHEETS}/${family}-2x.webp`,
  })));

  // ---------- places ----------
  const docRect = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, bottom: r.bottom + scrollY, width: r.width, height: r.height };
  };
  const nookCentre = () => {
    const r = docRect(footer);
    return { x: r.right - r.width * 0.08 - 60, y: r.top };
  };
  const places: Place[] = [
    {
      id: 'perch', kind: 'perch',
      surface: (): Surface => { const r = docRect(perchLine); return { left: r.left + 30, right: r.right - 30, y: r.top }; },
    },
    {
      id: 'lane', kind: 'ground',
      surface: (): Surface => {
        const right = scrollX + innerWidth * (1 - LANE.right);
        return { left: right - LANE.width, right, y: scrollY + innerHeight * (1 - LANE.bottom) };
      },
      layer: () => ({ element: lane, origin: { x: scrollX, y: scrollY } }),
    },
    {
      id: 'nook', kind: 'nook', restful: true,
      surface: (): Surface => { const c = nookCentre(); return { left: c.x - 28, right: c.x + 28, y: c.y - 26 }; },
    },
  ];
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
  }
  const world: World = {
    places,
    links: [
      { from: 'perch', to: 'lane', way: 'offscreen', at: 'right', enter: 'right', arrive: 0.5 },
      { from: 'lane', to: 'nook', way: 'offscreen', at: 'right', enter: 'right', arrive: 0.5 },
      { from: 'nook', to: 'lane', way: 'offscreen', at: 'right', enter: 'right', arrive: 0.5 },
      { from: 'lane', to: 'coast', way: 'hop', at: 'left', leave: 0, arrive: 0.85 },
      { from: 'coast', to: 'lane', way: 'hop', at: 'right', arrive: 0.3 },
    ],
  };

  // ---------- his nook ----------
  const cushion = document.createElement('div');
  cushion.className = 'yoru-prop';
  stage.append(cushion);
  const cushionPlayer = new SpritePlayer(cushion);
  cushion.style.pointerEvents = 'none';
  const placeCushion = () => { const c = nookCentre(); cushionPlayer.hold(clips.get('nook/cushion'), 0); cushionPlayer.moveTo(c.x, c.y + 4); };
  placeCushion();

  // ---------- the resident ----------
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
    },
  });
  yoru.addEventListener('click', () => resident.poke());
  // The resident draws him from now on; the hero's own still frame was only for pages without JavaScript.
  heroSpot?.setAttribute('hidden', '');
  resident.start();

  // ---------- what the page tells him ----------
  let footerVisible = false;
  new IntersectionObserver(([entry]) => {
    // The first report can arrive before a real scroll; only a real scroll away counts.
    if (!entry!.isIntersecting && scrollY > 80 && resident.state.place === 'perch') resident.invite('lane');
  }, { threshold: 0.05 }).observe(hero);
  new IntersectionObserver(([entry]) => {
    footerVisible = entry!.isIntersecting;
    if (footerVisible && resident.state.place === 'lane') resident.invite('nook');
    if (!footerVisible && resident.state.place === 'nook') resident.invite('lane');
  }, { threshold: 0.2 }).observe(footer);

  if (coast) {
    for (const radio of document.querySelectorAll<HTMLInputElement>('.bc-radio')) {
      radio.addEventListener('change', () => {
        if (resident.state.place === 'coast') { resident.sceneChanged('coast'); return; }
        // The window has the reader's attention; he comes to look only if it is right beside his lane.
        const scene = places.find((p) => p.id === 'coast')!.surface();
        const here = places.find((p) => p.id === 'lane')!.surface();
        if (scene && here && resident.state.place === 'lane' && Math.abs(scene.y - here.y) < 160 && here.left - scene.right < 420) resident.invite('coast');
      });
    }
  }

  const relayout = () => { sizeStage(); placeCushion(); resident.layoutChanged(); };
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
