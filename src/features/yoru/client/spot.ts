/**
 * Yoru in the site's smaller rooms (the 404, the legal pages, Contact): one spot on a ground line where the resident
 * lives as he does on the home page, with the room's own touch. On the 404 a click sends him wandering off the screen
 * and back round from the other side ("Yoru gets lost here too"); on the legal pages he is already asleep; on Contact
 * he runs off with a sent message and comes back for the next one.
 *
 * The page's still frame (YoruStill) keeps his space and is what visitors without JavaScript see; once he is mounted
 * it is hidden and he is drawn in a clipped, click-through layer over the page. Nothing is stored.
 */
import { YORU_FAMILIES } from '../../../generated/yoru-families';
import { reducedMotion } from '../../../scripts/runtime';
import { ClipLibrary } from '../clips';
import { SpritePlayer } from '../player';
import { Resident } from '../resident';
import type { Link, Surface, World } from '../world';

const SHEETS = '/yoru/resident';

export interface SpotOptions {
  /** The element holding his still frame. */
  spot: HTMLElement;
  /** The line he stands on, in page coordinates. */
  ground(): Surface;
  /** He is asleep there when the page opens, and the spot is somewhere he would sleep. */
  asleep?: boolean;
  /** A click sends him off the screen and back round from the other side, instead of the usual reactions. */
  wandersOff?: boolean;
  /** A handwritten note that leaves while he is away. */
  caption?: HTMLElement | null;
  label: string;
}

export interface Spot {
  /** He runs off out of view and stays gone. */
  leave(): void;
  /** He comes back to his spot. */
  comeBack(): void;
}

export function mountSpot(o: SpotOptions): Spot {
  const stage = document.createElement('div');
  stage.className = 'yoru-stage';
  document.body.append(stage);
  const sizeStage = () => { stage.style.height = `${document.documentElement.scrollHeight}px`; };
  sizeStage();

  const yoru = document.createElement('button');
  yoru.type = 'button';
  yoru.className = 'yoru-resident';
  yoru.setAttribute('aria-label', o.label);
  yoru.title = 'Yoru';
  stage.append(yoru);

  const clips = new ClipLibrary(Object.entries(YORU_FAMILIES).map(([family, manifest]) => ({
    manifest, sheetUrl: `${SHEETS}/${family}-1x.webp`, sheetUrl2x: `${SHEETS}/${family}-2x.webp`,
  })));

  const view = () => ({ left: scrollX, right: scrollX + innerWidth });
  // Where the spot sits along the screen, so going round he comes back in to the same place.
  const along = () => { const g = o.ground(); return ((g.left + g.right) / 2 - scrollX) / innerWidth; };
  const world: World = {
    view,
    places: [
      { id: 'spot', kind: 'ground', restful: o.asleep ?? false, surface: o.ground },
      // The whole width of the screen at his line: the way round when he wanders off.
      { id: 'round', kind: 'ground', surface: () => ({ ...view(), y: o.ground().y }) },
      // Out of view to the right: where he goes with a sent message.
      { id: 'away', kind: 'ground', surface: () => { const right = view().right + 400; return { left: right, right: right + 60, y: o.ground().y }; } },
    ],
    links: [
      { from: 'spot', to: 'round', way: 'offscreen', at: 'right', enter: 'left', get arrive() { return along(); } },
      { from: 'round', to: 'spot', way: 'walk', at: 'left', get leave() { return along(); }, arrive: 0.5 } as Link,
      { from: 'spot', to: 'away', way: 'offscreen', at: 'right', enter: 'right', arrive: 0.5 },
      { from: 'away', to: 'spot', way: 'offscreen', at: 'right', enter: 'right', arrive: 0.5 },
    ],
  };

  let gone = false;
  const resident = new Resident({
    player: new SpritePlayer(yoru),
    clips,
    world,
    start: { place: 'spot', at: 0.5, asleep: o.asleep ?? false },
    seed: (Date.now() / 86400000) | 0,
    reducedMotion: reducedMotion(),
    onPlace: (id) => {
      // Gone round the screen: back to his spot, and the note with him.
      if (id === 'round') resident.invite('spot');
      if (id === 'spot' && o.caption) o.caption.hidden = false;
      if (id === 'away') { gone = true; resident.stop(); yoru.hidden = true; }
    },
  });

  yoru.addEventListener('click', () => {
    if (o.wandersOff && resident.state.place === 'spot' && resident.state.posture !== 'curl' && resident.state.wariness < 0.3) {
      if (o.caption) o.caption.hidden = true;
      resident.invite('round');
      return;
    }
    resident.poke();
  });

  o.spot.querySelector<HTMLElement>('[data-yoru-still]')?.style.setProperty('visibility', 'hidden');
  resident.start();

  const relayout = () => { sizeStage(); resident.layoutChanged(); };
  new ResizeObserver(relayout).observe(document.body);
  addEventListener('resize', relayout);
  document.addEventListener('visibilitychange', () => {
    if (gone) return;
    if (document.hidden) resident.stop(); else resident.start();
  });

  return {
    leave() {
      if (o.caption) o.caption.hidden = true;
      resident.invite('away', { insist: true });
    },
    comeBack() {
      if (!gone) return;
      gone = false;
      yoru.hidden = false;
      resident.start();
      resident.invite('spot', { insist: true });
    },
  };
}
