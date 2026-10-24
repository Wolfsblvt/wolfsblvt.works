/**
 * Yoru himself: the one authority over where he is, what posture he is in and what he is doing. It chooses what is
 * worth doing next, carries it out through the player, and answers the visitor. There is exactly one current action;
 * starting another cancels it first, so a late timer from an old action can never move him.
 *
 * Choice is explainable rather than random noise: impossible actions are removed, the rest are weighed against his
 * needs (rest, curiosity, wariness), recent repetition and cooldowns, and one is drawn with a seeded generator so a
 * rehearsal trace can be replayed. He finishes a meaningful beat before choosing again.
 */
import { mulberry32 } from '../../lib/shape';
import type { Clip, ClipLibrary } from './clips';
import { realClock, SpritePlayer, type Clock } from './player';
import { place, route, type Link, type World } from './world';

export type Posture = 'stand' | 'face-left' | 'face-right' | 'sit' | 'curl';

/** Clip ids by role. The first one present in the library is used, so older families can stand in. */
const ROLE = {
  idle: ['presence/idle', 'v1/idle'],
  look: ['presence/look'],
  think: ['presence/think'],
  wave: ['presence/wave', 'v1/wave'],
  hop: ['presence/hop'],
  walkLeft: ['everyday/walk-left'],
  walkRight: ['everyday/walk-right'],
  runLeft: ['presence/run-left', 'v1/run-left'],
  runRight: ['presence/run-right', 'v1/run-right'],
  turnLeft: ['everyday/turn-left'],
  turnRight: ['everyday/turn-right'],
  sitDown: ['everyday/sit-down'],
  sit: ['everyday/sit'],
  standUp: ['everyday/stand-up'],
  yawn: ['everyday/yawn'],
  groom: ['everyday/groom'],
  settle: ['sleep/settle'],
  sleep: ['sleep/sleep'],
  wake: ['sleep/wake'],
  inspect: ['curious/inspect'],
  stare: ['reactions/stare'],
  startle: ['reactions/startle'],
  peek: ['reactions/peek'],
} as const;
type Role = keyof typeof ROLE;

/** The shortest beat of his life, in milliseconds; see the loop. */
const MIN_BEAT = 400;

/** Display pixels per millisecond. */
const WALK_SPEED = 0.05;
const RUN_SPEED = 0.2;

export interface ResidentOptions {
  player: SpritePlayer;
  clips: ClipLibrary;
  world: World;
  start: { place: string; at: number };
  seed?: number;
  clock?: Clock;
  reducedMotion?: boolean;
  /** Developer trace for the rehearsal. The site passes nothing: no event log of visitors is kept. */
  trace?: (line: string) => void;
}

interface Behaviour {
  name: string;
  /** Relative weight now, or 0 when impossible. */
  weight(): number;
  run(signal: AbortSignal): Promise<void>;
}

export class Resident {
  readonly #player: SpritePlayer;
  readonly #clips: ClipLibrary;
  readonly #world: World;
  readonly #clock: Clock;
  readonly #random: () => number;
  readonly #reduced: boolean;
  readonly #trace: (line: string) => void;

  #place: string;
  /** Position along the current place's surface, 0 (left) to 1 (right). */
  #at: number;
  #posture: Posture = 'stand';
  #alive = false;
  /** Ends everything at once (stop, hide). Transitions only listen to this, so a poke never cuts one in half. */
  #hard = new AbortController();
  /** The current action; a poke or host event aborts it at the next safe point. */
  #current: AbortController | null = null;
  #queued: Behaviour | null = null;

  /** Needs, 0..1. */
  #rest = 0.2;
  #curiosity = 0.4;
  #wariness = 0;
  #pokes: number[] = [];
  #lastRun = new Map<string, number>();

  constructor(o: ResidentOptions) {
    this.#player = o.player;
    this.#clips = o.clips;
    this.#world = o.world;
    this.#clock = o.clock ?? realClock;
    this.#random = mulberry32(o.seed ?? 1);
    this.#reduced = o.reducedMotion ?? false;
    this.#trace = o.trace ?? (() => {});
    this.#place = o.start.place;
    this.#at = o.start.at;
  }

  get state(): { place: string; at: number; posture: Posture; rest: number; curiosity: number; wariness: number } {
    return { place: this.#place, at: this.#at, posture: this.#posture, rest: this.#rest, curiosity: this.#curiosity, wariness: this.#wariness };
  }

  start(): void {
    if (this.#alive) return;
    this.#alive = true;
    this.#hard = new AbortController();
    this.#show(this.#clip('idle'), 0);
    void this.#live();
  }

  stop(): void {
    this.#alive = false;
    this.#hard.abort();
    this.#current?.abort();
  }

  /** The visitor poked him: count it, interrupt what he is doing at the next safe point, and react. */
  poke(): void {
    const now = this.#clock.now();
    this.#pokes = [...this.#pokes.filter((t) => now - t < 8000), now];
    this.#wariness = Math.min(1, this.#wariness + 0.25);
    this.#trace(`poke ×${this.#pokes.length}`);
    this.#queued = this.#reaction(this.#pokes.length);
    this.#current?.abort();
  }

  /** The host changed the page: if his place is gone, he leaves rather than standing on nothing. */
  layoutChanged(): void {
    if (place(this.#world, this.#place).surface()) { this.#follow(); return; }
    this.#trace(`${this.#place} is gone`);
    this.#current?.abort();
  }

  // ---------- the loop ----------

  async #live(): Promise<void> {
    while (this.#alive) {
      if (!place(this.#world, this.#place).surface()) { this.#relocate(); continue; }
      const next = this.#queued ?? this.#choose();
      this.#queued = null;
      const action = new AbortController();
      this.#current = action;
      const stop = () => action.abort();
      this.#hard.signal.addEventListener('abort', stop, { once: true });
      this.#trace(`→ ${next.name}`);
      const started = this.#clock.now();
      try {
        await next.run(action.signal);
      } finally {
        this.#hard.signal.removeEventListener('abort', stop);
      }
      this.#lastRun.set(next.name, this.#clock.now());
      // A beat that took no time (a wander to where he already stands) must not let the loop spin: hold the pose
      // for a moment, as anyone would before deciding again.
      if (this.#clock.now() - started < MIN_BEAT) await this.#clock.wait(MIN_BEAT, this.#hard.signal);
      this.#age(this.#clock.now() - started, next.name);
    }
  }

  /** Needs move with time and with what he just did. */
  #age(ms: number, did: string): void {
    const minutes = ms / 60000;
    if (did !== 'nap') this.#rest = Math.min(1, this.#rest + minutes * 0.35);
    if (did !== 'inspect' && did !== 'wander') this.#curiosity = Math.min(1, this.#curiosity + minutes * 0.5);
    this.#wariness = Math.max(0, this.#wariness - minutes * 0.6);
  }

  #choose(): Behaviour {
    const options = this.#behaviours().map((b) => ({ b, w: b.weight() * this.#freshness(b.name) })).filter((o) => o.w > 0);
    const total = options.reduce((sum, o) => sum + o.w, 0);
    let pick = this.#random() * total;
    for (const o of options) {
      pick -= o.w;
      if (pick <= 0) return o.b;
    }
    return options.at(-1)?.b ?? this.#idleBehaviour();
  }

  /** Something he just did is less attractive for a while. */
  #freshness(name: string): number {
    const last = this.#lastRun.get(name);
    if (last === undefined) return 1;
    const since = this.#clock.now() - last;
    return Math.min(1, 0.15 + since / 40000);
  }

  /** How settled he feels: someone who just poked him does not get to watch him curl up. */
  #calm(): number {
    return Math.max(0, 1 - this.#wariness * 1.6);
  }

  // ---------- behaviours ----------

  #behaviours(): Behaviour[] {
    const here = place(this.#world, this.#place);
    const list: Behaviour[] = [this.#idleBehaviour()];
    list.push({
      name: 'sit a while',
      weight: () => (this.#has('sitDown', 'sit', 'standUp') ? (0.7 + this.#rest * 0.6) * this.#calm() : 0),
      run: async (signal) => {
        await this.#toPosture('sit');
        await this.#loop('sit', signal, 2 + Math.floor(this.#random() * 3));
        if (!signal.aborted && this.#has('groom') && this.#random() < 0.4) await this.#once('groom', signal);
        if (!signal.aborted) await this.#loop('sit', signal, 1 + Math.floor(this.#random() * 2));
        if (!signal.aborted) await this.#toPosture('stand');
      },
    });
    list.push({
      name: 'nap',
      weight: () => (here.restful && this.#rest > 0.45 && this.#has('settle', 'sleep', 'wake') ? this.#rest * 3 * this.#calm() ** 2 : 0),
      run: async (signal) => {
        await this.#toPosture('curl');
        await this.#loop('sleep', signal, 6 + Math.floor(this.#random() * 6));
        this.#rest = signal.aborted ? this.#rest * 0.6 : 0;
        if (!signal.aborted) await this.#toPosture('stand');
      },
    });
    list.push({
      name: 'look around',
      weight: () => (this.#has('look') ? 0.5 + this.#curiosity * 0.3 : 0),
      run: async (signal) => { await this.#toPosture('stand'); await this.#once('look', signal); },
    });
    list.push({
      name: 'yawn',
      weight: () => (this.#has('yawn') ? this.#rest * 0.8 : 0),
      run: async (signal) => { await this.#toPosture('stand'); await this.#once('yawn', signal); },
    });
    list.push({
      name: 'think',
      weight: () => (this.#has('think') ? 0.25 : 0),
      run: async (signal) => { await this.#toPosture('stand'); await this.#loop('think', signal, 2); },
    });
    const curiosities = here.curiosities?.() ?? [];
    list.push({
      name: 'inspect',
      weight: () => (curiosities.length && this.#has('inspect', 'walkLeft', 'walkRight') ? this.#curiosity * 2.2 : 0),
      run: async (signal) => {
        const thing = curiosities[Math.floor(this.#random() * curiosities.length)]!;
        // The clip pokes at a spot in front of him towards the left: stand to the right of the thing.
        const surface = here.surface()!;
        const reach = 30;
        await this.#walkTo(Math.min(1, (thing.x + reach - surface.left) / (surface.right - surface.left)), signal);
        if (signal.aborted) return;
        await this.#toPosture('stand');
        await this.#once('inspect', signal);
        if (!signal.aborted) this.#curiosity = 0.1;
      },
    });
    list.push({
      name: 'wander',
      weight: () => (this.#reachable().length || this.#has('walkLeft') ? 0.6 + this.#curiosity * 0.8 : 0),
      run: async (signal) => {
        const targets = this.#reachable();
        if (targets.length && this.#random() < 0.6) {
          const target = targets[Math.floor(this.#random() * targets.length)]!;
          await this.#travel(route(this.#world, this.#place, target)!, signal);
        } else {
          await this.#walkTo(0.15 + this.#random() * 0.7, signal);
        }
        if (!signal.aborted) {
          await this.#toPosture('stand');
          this.#curiosity = Math.max(0, this.#curiosity - 0.3);
        }
      },
    });
    return list;
  }

  #idleBehaviour(): Behaviour {
    return {
      name: 'idle',
      weight: () => 1,
      run: async (signal) => { await this.#toPosture('stand'); await this.#loop('idle', signal, 2 + Math.floor(this.#random() * 3)); },
    };
  }

  /** What a poke means depends on how many came close together and what he was doing. */
  #reaction(count: number): Behaviour {
    return {
      name: `react ${count}`,
      weight: () => 1,
      run: async (signal) => {
        const startled = this.#posture === 'curl' || count === 2;
        // Waking or getting up is part of the response, not a teleport into it.
        await this.#toPosture('stand');
        if (count >= 3 && this.#has('peek')) {
          await this.#retreat(signal);
          await this.#loop('peek', signal, 3);
          this.#pokes = [];
          return;
        }
        await this.#once(startled && this.#has('startle') ? 'startle' : 'stare', signal);
      },
    };
  }

  /** Repeated poking: he walks off to the far end, out of reach, and keeps an eye on the visitor. */
  async #retreat(signal: AbortSignal): Promise<void> {
    const target = this.#at > 0.5 ? 0.05 : 0.95;
    await this.#walkTo(target, signal, true);
  }

  // ---------- movement ----------

  #reachable(): string[] {
    return this.#world.places
      .filter((p) => p.id !== this.#place && p.surface())
      .map((p) => p.id)
      .filter((id) => {
        const r = route(this.#world, this.#place, id);
        return r !== null && r.every((link) => this.#canTake(link));
      });
  }

  #canTake(link: Link): boolean {
    if (link.way === 'walk') return this.#has('walkLeft', 'walkRight');
    if (link.way === 'hop-up') return link.at === 'left' && this.#has('hop', 'turnLeft');
    return false; // the ladder needs its prop art first
  }

  async #travel(links: Link[], signal: AbortSignal): Promise<void> {
    for (const link of links) {
      if (signal.aborted) return;
      await this.#walkTo(link.at === 'left' ? 0 : 1, signal);
      if (signal.aborted) return;
      if (link.way === 'walk') {
        this.#arrive(link);
      } else if (link.way === 'hop-up') {
        await this.#hopUp(link);
      }
    }
  }

  /** Walks (or runs) along the current surface to a position, turning to face the way first. */
  async #walkTo(at: number, signal: AbortSignal, run = false): Promise<void> {
    const surface = place(this.#world, this.#place).surface();
    if (!surface) return;
    const width = surface.right - surface.left;
    const target = Math.max(0, Math.min(1, at));
    if (Math.abs(target - this.#at) * width < 4) return;
    const leftwards = target < this.#at;
    if (this.#reduced) { this.#at = target; this.#follow(); return; }
    await this.#toPosture(leftwards ? 'face-left' : 'face-right');
    const role: Role = run ? (leftwards ? 'runLeft' : 'runRight') : leftwards ? 'walkLeft' : 'walkRight';
    const speed = run ? RUN_SPEED : WALK_SPEED;
    const clip = this.#clip(role);
    while (!signal.aborted && this.#alive && Math.abs(target - this.#at) * width > 1) {
      await this.#player.play(clip, {
        signal,
        onFrame: (frame) => {
          const step = (speed * clip.durations[frame]! * this.#player.tempo) / width;
          this.#at = leftwards ? Math.max(target, this.#at - step) : Math.min(target, this.#at + step);
          this.#follow();
        },
      });
    }
  }

  /** Hops from the left end of this place up onto the next one; the arc is his, the clip is drawn in place. */
  async #hopUp(link: Link): Promise<void> {
    const from = place(this.#world, this.#place).surface()!;
    const to = place(this.#world, link.to).surface()!;
    await this.#toPosture('face-left');
    const clip = this.#clip('hop');
    const start = { x: from.left, y: from.y };
    const end = { x: to.left + link.arrive * (to.right - to.left), y: to.y };
    const frames = clip.durations.length;
    await this.#player.play(clip, {
      signal: this.#hard.signal,
      onFrame: (frame) => {
        // frames 0-1 gather, 2-4 travel, 5-6 land
        const t = Math.max(0, Math.min(1, (frame - 1.5) / Math.max(1, frames - 4)));
        const lift = Math.sin(t * Math.PI) * 24;
        this.#player.moveTo(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t - lift);
      },
    });
    this.#arrive(link);
    this.#posture = 'face-left';
  }

  #arrive(link: Link): void {
    this.#place = link.to;
    this.#at = link.arrive;
    this.#follow();
  }

  /** His place disappeared: the nearest present place takes him, and he is simply there. */
  #relocate(): void {
    const present = this.#world.places.filter((p) => p.surface());
    if (!present.length) { this.stop(); return; }
    this.#place = (present.find((p) => p.kind === 'ground') ?? present[0]!).id;
    this.#at = 0.5;
    this.#follow();
    this.#trace(`moved to ${this.#place}`);
  }

  /** Puts the sprite where his place says he is. */
  #follow(): void {
    const surface = place(this.#world, this.#place).surface();
    if (!surface) return;
    this.#player.moveTo(surface.left + this.#at * (surface.right - surface.left), surface.y);
  }

  // ---------- posture ----------

  /**
   * Reaches a posture through the clips that connect them. Transitions finish even when the action is cancelled:
   * he does not freeze half-way into a curl. Only a hard stop ends one early.
   */
  async #toPosture(target: Posture): Promise<void> {
    let guard = 0;
    while (this.#posture !== target && guard++ < 4) {
      const p = this.#posture;
      if (p === 'face-left') await this.#turn('turnLeft', true, 'stand');
      else if (p === 'face-right') await this.#turn('turnRight', true, 'stand');
      else if (p === 'sit') await this.#transition('standUp', 'stand');
      else if (p === 'curl') await this.#transition('wake', 'stand');
      else if (target === 'sit') await this.#transition('sitDown', 'sit');
      else if (target === 'curl') await this.#transition('settle', 'curl');
      else if (target === 'face-left') await this.#turn('turnLeft', false, 'face-left');
      else if (target === 'face-right') await this.#turn('turnRight', false, 'face-right');
      if (this.#hard.signal.aborted) return;
    }
  }

  async #transition(role: Role, then: Posture): Promise<void> {
    const clip = this.#clip(role);
    if (this.#reduced) this.#show(clip, clip.durations.length - 1);
    else await this.#player.play(clip, { signal: this.#hard.signal });
    this.#posture = then;
  }

  /** A turn may honestly play backwards to turn back to the front. */
  async #turn(role: Role, reverse: boolean, then: Posture): Promise<void> {
    const clip = this.#clip(role);
    if (this.#reduced) this.#show(clip, reverse ? 0 : clip.durations.length - 1);
    else await this.#player.play(clip, { signal: this.#hard.signal, reverse });
    this.#posture = then;
  }

  async #once(role: Role, signal: AbortSignal): Promise<void> {
    await this.#loop(role, signal, 1);
  }

  async #loop(role: Role, signal: AbortSignal, times: number): Promise<void> {
    const clip = this.#clip(role);
    if (this.#reduced) {
      // A complete still pose, then the same beat of time.
      this.#show(clip, 0);
      await this.#clock.wait(this.#clips.length(clip.id) * times, signal);
      return;
    }
    await this.#player.play(clip, { signal, times });
  }

  // ---------- clips ----------

  #has(...roles: Role[]): boolean {
    return roles.every((role) => ROLE[role].some((id) => this.#clips.has(id)));
  }

  #clip(role: Role): Clip {
    const id = ROLE[role].find((candidate) => this.#clips.has(candidate));
    if (!id) throw new Error(`No clip for ${role}`);
    return this.#clips.get(id);
  }

  #show(clip: Clip, frame: number): void {
    this.#player.hold(clip, frame);
    this.#follow();
  }
}
