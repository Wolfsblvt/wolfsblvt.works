/**
 * Draws Yoru: one element, one clip at a time. It knows nothing about why he does anything; the resident decides
 * and the player shows it. Every playback takes an AbortSignal, so a cancelled action stops at once and its late
 * timers cannot move him afterwards.
 */
import type { Clip } from './clips';

export type PlayResult = 'done' | 'cancelled';

export interface PlayOptions {
  signal: AbortSignal;
  /** Passes through the clip; Infinity plays until the signal aborts. Default 1. */
  times?: number;
  /** Play the frames backwards. Only for movements that are honestly symmetric, such as a turn. */
  reverse?: boolean;
  /** Called on each frame shown, with its index, for movement that follows the animation. */
  onFrame?: (frame: number) => void;
}

/** Time source and scheduler, injectable so the resident can be rehearsed and tested at any speed. */
export interface Clock {
  now(): number;
  wait(ms: number, signal: AbortSignal): Promise<boolean>;
}

export const realClock: Clock = {
  now: () => performance.now(),
  wait: (ms, signal) =>
    new Promise((resolve) => {
      if (signal.aborted) return resolve(false);
      const timer = setTimeout(() => { signal.removeEventListener('abort', stop); resolve(true); }, ms);
      const stop = () => { clearTimeout(timer); resolve(false); };
      signal.addEventListener('abort', stop, { once: true });
    }),
};

type StyleProperty = 'position' | 'backgroundRepeat' | 'pointerEvents' | 'width' | 'height' | 'backgroundImage'
  | 'backgroundSize' | 'backgroundPosition' | 'left' | 'top' | 'visibility' | 'transformOrigin' | 'transform';

/**
 * The little of an element the engine uses. An HTMLElement satisfies it; naming only this keeps the engine core free
 * of the DOM library, so it is typed and tested like any other module.
 */
export interface SpriteElement {
  readonly style: Record<StyleProperty, string>;
  readonly dataset: Record<string, string | undefined>;
  readonly parentElement: object | null;
  readonly ownerDocument: { createElement(tag: 'div'): SpriteElement };
  /** DOM's before(...nodes); called with a sprite element only. */
  before(...nodes: never[]): void;
}

/** Something a sprite element can live in: the page stage, a fixed lane, a project window. */
export interface SpriteParent {
  /** DOM's append(...nodes); called with a sprite element only. */
  append(...nodes: never[]): void;
}

/** Moves a sprite element into a parent through the DOM's own append. */
export const appendSprite = (parent: SpriteParent, element: SpriteElement): void =>
  (parent.append as (node: SpriteElement) => void).call(parent, element);

export class SpritePlayer {
  readonly element: SpriteElement;
  #clip: Clip | null = null;
  #x = 0;
  #y = 0;
  /** The element his sprite currently lives in, and where that element sits in stage coordinates. */
  #home: SpriteParent | null = null;
  #layer: { element: SpriteParent; origin: { x: number; y: number } } | null = null;
  /** Playback speed multiplier for rehearsal; the site always plays at 1. */
  tempo = 1;

  constructor(element: SpriteElement, private readonly clock: Clock = realClock) {
    this.element = element;
    this.#home = element.parentElement as SpriteParent | null;
    element.style.position = 'absolute';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.pointerEvents = 'auto';
  }

  get clip(): Clip | null {
    return this.#clip;
  }

  /** Puts his feet (the clip's pivot) at (x, y) in the stage's coordinates. */
  moveTo(x: number, y: number): void {
    this.#x = x;
    this.#y = y;
    this.#position();
  }

  /**
   * Moves his one element into another layer (a project window, behind its frame), or back home with null. Stage
   * coordinates stay the same; only what clips and covers him changes. There is never a second element.
   */
  setLayer(layer: { element: SpriteParent; origin: { x: number; y: number } } | null): void {
    this.#layer = layer;
    const parent = layer?.element ?? this.#home;
    if (parent && this.element.parentElement !== parent) appendSprite(parent, this.element);
    this.#position();
  }

  get position(): { x: number; y: number } {
    return { x: this.#x, y: this.#y };
  }

  /** Shows one frame and stays there. */
  hold(clip: Clip, frame: number): void {
    this.#use(clip);
    this.#show(clip, frame);
  }

  async play(clip: Clip, { signal, times = 1, reverse = false, onFrame }: PlayOptions): Promise<PlayResult> {
    this.#use(clip);
    const order = clip.durations.map((_, i) => (reverse ? clip.durations.length - 1 - i : i));
    for (let pass = 0; pass < times; pass++) {
      for (const frame of order) {
        if (signal.aborted) return 'cancelled';
        this.#show(clip, frame);
        onFrame?.(frame);
        if (!(await this.clock.wait(clip.durations[frame]! / this.tempo, signal))) return 'cancelled';
      }
    }
    return 'done';
  }

  #use(clip: Clip): void {
    if (this.#clip === clip) return;
    this.#clip = clip;
    const s = clip.displayScale;
    const style = this.element.style;
    style.width = `${clip.cell.width * s}px`;
    style.height = `${clip.cell.height * s}px`;
    style.backgroundImage = clip.sheetUrl2x
      ? `image-set(url(${clip.sheetUrl}) 1x, url(${clip.sheetUrl2x}) 2x)`
      : `url(${clip.sheetUrl})`;
    style.backgroundSize = `${clip.sheetColumns * clip.cell.width * s}px ${clip.sheetRows * clip.cell.height * s}px`;
    this.#position();
  }

  #show(clip: Clip, frame: number): void {
    const s = clip.displayScale;
    this.element.style.backgroundPosition = `${-frame * clip.cell.width * s}px ${-clip.row * clip.cell.height * s}px`;
    this.element.dataset['frame'] = String(frame);
    this.element.dataset['clip'] = clip.id;
  }

  #position(): void {
    const clip = this.#clip;
    if (!clip) return;
    const s = clip.displayScale;
    const origin = this.#layer?.origin ?? { x: 0, y: 0 };
    this.element.style.left = `${Math.round(this.#x - origin.x - clip.pivot.x * s)}px`;
    this.element.style.top = `${Math.round(this.#y - origin.y - clip.pivot.y * s)}px`;
  }
}
