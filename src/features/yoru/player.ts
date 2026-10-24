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

export class SpritePlayer {
  readonly element: HTMLElement;
  #clip: Clip | null = null;
  #x = 0;
  #y = 0;
  /** Playback speed multiplier for rehearsal; the site always plays at 1. */
  tempo = 1;

  constructor(element: HTMLElement, private readonly clock: Clock = realClock) {
    this.element = element;
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
    style.backgroundImage = `url(${clip.sheetUrl})`;
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
    this.element.style.left = `${Math.round(this.#x - clip.pivot.x * s)}px`;
    this.element.style.top = `${Math.round(this.#y - clip.pivot.y * s)}px`;
  }
}
