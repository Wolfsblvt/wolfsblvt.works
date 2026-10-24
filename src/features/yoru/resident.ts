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
import { spendTime, type Acquaintance } from './memory';
import { departure, place, route, type Link, type World } from './world';

/** 'watch' is sitting seen from behind, looking into a scene: how he is a guest inside a project window. */
export type Posture = 'stand' | 'face-left' | 'face-right' | 'sit' | 'curl' | 'watch';

/** Clip ids by role. The first one present in the library is used, so older families can stand in. */
const ROLE = {
  idle: ['presence/idle', 'v1/idle'],
  look: ['presence/look'],
  think: ['presence/think'],
  wave: ['presence/wave', 'v1/wave'],
  hop: ['presence/hop'],
  hopRight: ['presence/hop-right'],
  lookIn: ['guest/look-in'],
  sitIn: ['guest/sit-in'],
  watch: ['guest/watch'],
  notice: ['guest/notice'],
  rise: ['guest/rise'],
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
  /** What he remembers of this visitor, only when they turned remembering on; see memory.ts. */
  acquaintance?: Acquaintance | null;
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
  /** When he arrived at his current place; a guest stays a while, then leaves. */
  #arrivedAt = 0;
  #acquaintance: Acquaintance | null;
  /** Since the last remember(): time spent together and whether it included poking. */
  #since = 0;
  #pokedSince = false;
  #lastRun = new Map<string, number>();

  constructor(o: ResidentOptions) {
    this.#player = o.player;
    this.#clips = o.clips;
    this.#world = o.world;
    this.#clock = o.clock ?? realClock;
    this.#random = mulberry32(o.seed ?? 1);
    this.#reduced = o.reducedMotion ?? false;
    this.#trace = o.trace ?? (() => {});
    this.#acquaintance = o.acquaintance ?? null;
    this.#wariness = this.#acquaintance?.wariness ?? 0;
    this.#place = o.start.place;
    this.#at = o.start.at;
  }

  get state(): { place: string; at: number; posture: Posture; rest: number; curiosity: number; wariness: number } {
    return { place: this.#place, at: this.#at, posture: this.#posture, rest: this.#rest, curiosity: this.#curiosity, wariness: this.#wariness };
  }

  /**
   * The acquaintance to keep, updated with the time spent together since the last call, or null when remembering is
   * off. The host saves it; the resident never touches storage.
   */
  remember(): Acquaintance | null {
    if (!this.#acquaintance) return null;
    const now = this.#clock.now();
    const updated = spendTime(this.#acquaintance, (now - this.#since) / 60000, this.#pokedSince);
    this.#acquaintance = { ...updated, wariness: this.#wariness };
    this.#since = now;
    this.#pokedSince = false;
    return this.#acquaintance;
  }

  /** Remembering was switched on (with a fresh record) or off (null) during the visit. */
  setAcquaintance(record: Acquaintance | null): void {
    this.#acquaintance = record;
    this.#since = this.#clock.now();
    this.#pokedSince = false;
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
    this.#wariness = Math.min(1, this.#wariness + 0.25 * (1 - this.#familiarity() * 0.5));
    this.#pokedSince = true;
    this.#trace(`poke ×${this.#pokes.length}`);
    this.#queued = this.#reaction(this.#pokes.length);
    this.#current?.abort();
  }

  /**
   * A place is getting the visitor's attention (a project window scrolled into view and used). If he is calm and the
   * way is open, he goes to have a look; otherwise he carries on. An invitation, not a command.
   */
  invite(placeId: string): void {
    if (this.#place === placeId || this.#calm() < 0.5) return;
    const way = route(this.#world, this.#place, placeId);
    if (!way || !way.every((link) => this.#canTake(link))) return;
    this.#trace(`invited to ${placeId}`);
    this.#queued = { name: 'visit', weight: () => 1, run: (signal) => this.#travel(way, signal) };
    this.#current?.abort();
  }

  /** Something changed inside a scene (Borrowed Coast switched its view): if he is watching it, he notices. */
  sceneChanged(placeId: string): void {
    if (this.#place !== placeId || this.#posture !== 'watch' || !this.#has('notice')) return;
    this.#trace(`${placeId} changed`);
    this.#queued = { name: 'notice', weight: () => 1, run: (signal) => this.#once('notice', signal) };
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

  #familiarity(): number {
    return this.#acquaintance?.familiarity ?? 0;
  }

  /** How settled he feels: someone who just poked him does not get to watch him curl up. */
  #calm(): number {
    return Math.max(0, 1 - this.#wariness * 1.6);
  }

  // ---------- behaviours ----------

  #behaviours(): Behaviour[] {
    const here = place(this.#world, this.#place);
    if (here.kind === 'guest') return this.#guestBehaviours();
    const list: Behaviour[] = [this.#idleBehaviour()];
    const scenes = this.#reachable().filter((id) => place(this.#world, id).kind === 'guest');
    list.push({
      name: 'visit',
      weight: () => (scenes.length && this.#has('sitIn', 'watch', 'rise') ? (0.3 + this.#curiosity * 1.6) * this.#calm() : 0),
      run: async (signal) => {
        const scene = scenes[Math.floor(this.#random() * scenes.length)]!;
        await this.#travel(route(this.#world, this.#place, scene)!, signal);
      },
    });
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
      weight: () => (here.restful && this.#rest > 0.45 && this.#has('settle', 'sleep', 'wake') ? this.#rest * 3 * this.#calm() ** 2 * (this.#acquaintance?.favouritePlace === here.id ? 1.6 : 1) : 0),
      run: async (signal) => {
        await this.#toPosture('curl');
        await this.#loop('sleep', signal, 6 + Math.floor(this.#random() * 6));
        this.#rest = signal.aborted ? this.#rest * 0.6 : 0;
        if (!signal.aborted && this.#acquaintance) this.#acquaintance = { ...this.#acquaintance, favouritePlace: here.id };
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

  /** Inside a scene he watches for a while, notices what changes, and leaves the way he came. */
  #guestBehaviours(): Behaviour[] {
    const stayed = this.#clock.now() - this.#arrivedAt;
    const exits = this.#reachable().filter((id) => place(this.#world, id).kind !== 'guest');
    return [
      {
        name: 'watch',
        weight: () => Math.max(0.05, 2.5 - stayed / 40000),
        run: async (signal) => { await this.#toPosture('watch'); await this.#loop('watch', signal, 2 + Math.floor(this.#random() * 3)); },
      },
      {
        name: 'leave',
        weight: () => (exits.length ? Math.min(3, stayed / 45000) : 0),
        run: async (signal) => {
          this.#curiosity = Math.max(0, this.#curiosity - 0.5);
          const exit = exits[Math.floor(this.#random() * exits.length)]!;
          await this.#travel(route(this.#world, this.#place, exit)!, signal);
        },
      },
    ];
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
        // Someone he knows well gets a lazy wave for a first poke instead of the stare.
        const role: Role = startled && this.#has('startle') ? 'startle' : count === 1 && this.#familiarity() > 0.5 && this.#has('wave') ? 'wave' : 'stare';
        await this.#once(role, signal);
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
    if (link.way === 'hop') return this.#hopsLeft(link) ? this.#has('hop', 'turnLeft') : this.#has('hopRight', 'turnRight');
    return false; // the ladder needs its prop art first
  }

  async #travel(links: Link[], signal: AbortSignal): Promise<void> {
    for (const link of links) {
      if (signal.aborted) return;
      await this.#walkTo(departure(link), signal);
      if (signal.aborted) return;
      if (link.way === 'walk') {
        this.#arrive(link);
      } else if (link.way === 'hop') {
        // Before hopping into a scene he has a look inside first, when he is facing it.
        if (this.#hopsLeft(link) && place(this.#world, link.to).kind === 'guest' && this.#has('lookIn')) {
          await this.#toPosture('face-left');
          await this.#once('lookIn', signal);
          if (signal.aborted) return;
        }
        await this.#hop(link);
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

  /**
   * Hops from one end of this place onto the next, up, down or across. The arc is his; the clip is drawn in place.
   * Going into or out of a scene, he changes layer at the top of the arc, where he is clear of its frame.
   */
  async #hop(link: Link): Promise<void> {
    const from = place(this.#world, this.#place).surface()!;
    const destination = place(this.#world, link.to);
    const to = destination.surface()!;
    const leftwards = this.#hopsLeft(link);
    await this.#toPosture(leftwards ? 'face-left' : 'face-right');
    const clip = this.#clip(leftwards ? 'hop' : 'hopRight');
    const start = { x: from.left + departure(link) * (from.right - from.left), y: from.y };
    let swapped = false;
    const end = { x: to.left + link.arrive * (to.right - to.left), y: to.y };
    const frames = clip.durations.length;
    await this.#player.play(clip, {
      signal: this.#hard.signal,
      onFrame: (frame) => {
        // frames 0-1 gather, 2-4 travel, 5-6 land
        const t = Math.max(0, Math.min(1, (frame - 1.5) / Math.max(1, frames - 4)));
        const lift = Math.sin(t * Math.PI) * 24;
        if (!swapped && t >= 0.5) {
          swapped = true;
          this.#player.setLayer(destination.layer?.() ?? null);
        }
        this.#player.moveTo(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t - lift);
      },
    });
    this.#arrive(link);
    this.#posture = leftwards ? 'face-left' : 'face-right';
  }

  /** Whether a hop goes towards the left, from where it sets off to where it lands. */
  #hopsLeft(link: Link): boolean {
    const from = place(this.#world, link.from).surface();
    const to = place(this.#world, link.to).surface();
    if (!from || !to) return link.at === 'left';
    const start = from.left + departure(link) * (from.right - from.left);
    return to.left + link.arrive * (to.right - to.left) < start;
  }

  #arrive(link: Link): void {
    this.#place = link.to;
    this.#at = link.arrive;
    this.#arrivedAt = this.#clock.now();
    // A scene he has visited is remembered (only when remembering is on), and its keepsake can appear in his nook.
    const a = this.#acquaintance;
    if (a && place(this.#world, link.to).kind === 'guest' && !a.discovered.includes(link.to)) {
      this.#acquaintance = { ...a, discovered: [...a.discovered, link.to] };
      this.#trace(`discovered ${link.to}`);
    }
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

  /** Puts the sprite where his place says he is, in that place's layer. */
  #follow(): void {
    const here = place(this.#world, this.#place);
    const surface = here.surface();
    if (!surface) return;
    this.#player.setLayer(here.layer?.() ?? null);
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
      if (target === 'watch' && p === 'face-left') await this.#transition('sitIn', 'watch');
      else if (target === 'watch' && p === 'stand') await this.#turn('turnLeft', false, 'face-left');
      else if (p === 'watch') await this.#transition('rise', 'face-right');
      else if (p === 'face-left') await this.#turn('turnLeft', true, 'stand');
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
