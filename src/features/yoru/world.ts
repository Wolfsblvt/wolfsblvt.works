import type { SpriteParent } from './player';

/**
 * Where Yoru can be: a few authored places with stable ids and their connections, not a collision mesh inferred
 * from every rectangle on the page. A host (the real site, or the rehearsal) supplies them; their geometry is read
 * fresh whenever it is needed, because the page reflows.
 */

/** A walkable surface in stage coordinates: from `left` to `right` along the line `y`. */
export interface Surface {
  left: number;
  right: number;
  y: number;
}

/**
 * 'peek' is a place where only his head shows over an edge (the bottom of the reader's screen): he looks, and leaves
 * when the page asks him on.
 */
export type PlaceKind = 'perch' | 'ground' | 'nook' | 'guest' | 'peek';

export interface Place {
  id: string;
  kind: PlaceKind;
  /** Current geometry, or null when the place is gone (collapsed, scrolled out of existence, closed). */
  surface(): Surface | null;
  /** Somewhere he would choose to sleep. */
  restful?: boolean;
  /** Things on this place he can go and inspect, by id with their current x. */
  curiosities?(): Array<{ id: string; x: number }>;
  /**
   * For a place inside something (a project window): the element he moves into while there, so its frame clips
   * and covers him, and that element's position in stage coordinates.
   */
  layer?(): { element: SpriteParent; origin: { x: number; y: number } } | null;
}

/**
 * walk along; hop up, down or across (into or out of a window included); climb down by ladder; or offscreen: run out
 * of view past the `at` end and come back in from the `enter` side of the next place, where the two are too far
 * apart to be joined in view (the hero perch and the reader's margin).
 */
export type Way = 'walk' | 'hop' | 'ladder-down' | 'offscreen';

/** A connection: from the `at` end of one place to another. */
export interface Link {
  from: string;
  to: string;
  way: Way;
  /** Which end of `from` he leaves by, and the x on `to` he arrives at, as a fraction of its width. */
  at: 'left' | 'right';
  arrive: number;
  /** Where along `from` he sets off, when it is not the `at` end: a window above the middle of a floor. */
  leave?: number;
  /** For an offscreen way: the side of `to` he runs in from. */
  enter?: 'left' | 'right';
}

export interface World {
  places: ReadonlyArray<Place>;
  links: ReadonlyArray<Link>;
  /** The stretch of the stage the reader can see, in stage coordinates: running out of view means past its edge. */
  view?(): { left: number; right: number };
}

export function place(world: World, id: string): Place {
  const p = world.places.find((candidate) => candidate.id === id);
  if (!p) throw new Error(`Unknown place "${id}"`);
  return p;
}

/** Places that exist right now. */
export function presentPlaces(world: World): Place[] {
  return world.places.filter((p) => p.surface() !== null);
}

/** The shortest chain of links from one place to another, over places that currently exist. */
export function route(world: World, from: string, to: string): Link[] | null {
  if (from === to) return [];
  const present = new Set(presentPlaces(world).map((p) => p.id));
  const queue: Array<{ at: string; path: Link[] }> = [{ at: from, path: [] }];
  const seen = new Set([from]);
  while (queue.length) {
    const { at, path } = queue.shift()!;
    for (const link of world.links) {
      if (link.from !== at || seen.has(link.to) || !present.has(link.to)) continue;
      const next = [...path, link];
      if (link.to === to) return next;
      seen.add(link.to);
      queue.push({ at: link.to, path: next });
    }
  }
  return null;
}

/** Where along `from` a link sets off, as a fraction of its width. */
export const departure = (link: Link): number => link.leave ?? (link.at === 'left' ? 0 : 1);
