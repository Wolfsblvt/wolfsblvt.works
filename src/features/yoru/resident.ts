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
import { realClock, SpritePlayer, type Clock, type SpriteElement } from './player';
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
  produce: ['ladder/produce'],
  mount: ['ladder/mount'],
  climb: ['ladder/climb'],
  dismount: ['ladder/dismount'],
  stow: ['ladder/stow'],
  ladder: ['ladder-prop/open'],
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

/**
 * The ladder, in master pixels. The generator drew the ladder he climbs smaller than the prop's natural size, and
 * his paws are what must meet the rungs, so the prop is drawn at `spriteScale` to match the ladder in the climb
 * clip: rungs `rung` apart there (measured from the green ladder: one climb cycle moves him exactly this far), 42.5
 * apart in ladder-prop/open, whose hooks sit `hooksAbovePivot` above its pivot.
 */
const LADDER = { rung: 33.5, spriteScale: 33.5 / 42.5, hooksAbovePivot: 420 };
/** How far below the ladder's foot he will still step off its last rung, in CSS pixels. */
const LADDER_STEP_OFF = 40;

/** The shortest beat of his life, in milliseconds; see the loop. */
const MIN_BEAT = 400;

/** Display pixels per millisecond. */
/**
 * Ground covered per walk and run cycle, in CSS pixels, when a clip does not carry its own stride. Distance is per
 * frame of the drawing, not per millisecond, so a slower clip walks slower instead of sliding its feet.
 */
const WALK_STRIDE = 60;
const RUN_STRIDE = 144;
/**
 * How far he can hop, in display pixels: up about half his height (the hop clip's own rise), down a little further,
 * across a modest gap. A link whose places are further apart right now is not open, however it was authored: a page
 * that reflows or scrolls must not turn a hop into a flight.
 */
const HOP = { up: 60, down: 180, across: 280 };

/**
 * How far past the end of a place, and past the edge of what the reader can see, he runs to be out of view, in
 * display pixels: about half his cell, so not a whisker of him is left showing.
 */
const OFFSCREEN = 160;
const PAST_EDGE = 90;

export interface ResidentOptions {
  player: SpritePlayer;
  clips: ClipLibrary;
  world: World;
  /** Where he is when the page opens, and whether he is already asleep there (a restful place). */
  start: { place: string; at: number; asleep?: boolean };
  seed?: number;
  clock?: Clock;
  reducedMotion?: boolean;
  /** Developer trace for the rehearsal. The site passes nothing: no event log of visitors is kept. */
  trace?: (line: string) => void;
  /** What he remembers of this visitor, only when they turned remembering on; see memory.ts. */
  acquaintance?: Acquaintance | null;
  /** Called whenever he arrives somewhere, for the host's own touches (the perch caption leaving with him). */
  onPlace?: (placeId: string) => void;
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
  readonly #onPlace: (placeId: string) => void;
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
    this.#onPlace = o.onPlace ?? (() => {});
    this.#wariness = this.#acquaintance?.wariness ?? 0;
    this.#place = o.start.place;
    this.#at = o.start.at;
    if (o.start.asleep) { this.#posture = 'curl'; this.#rest = 1; }
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
    // Resuming after a pause, he is shown in the posture he was in, not snapped back to standing.
    const resting: Record<Posture, Role> = { stand: 'idle', 'face-left': 'walkLeft', 'face-right': 'walkRight', sit: 'sit', curl: 'sleep', watch: 'watch' };
    this.#show(this.#clip(this.#has(resting[this.#posture]) ? resting[this.#posture] : 'idle'), 0);
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
  invite(placeId: string, { insist = false }: { insist?: boolean } = {}): void {
    // insist: the page needs him there whatever his mood (he has a sent message to deliver).
    if (this.#place === placeId || (!insist && this.#calm() < 0.5)) return;
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
    // Found curled up (a page where he is already asleep, or a tab seen again mid-nap), he sleeps on.
    if (this.#posture === 'curl' && !this.#queued) this.#queued = this.#behaviours().find((b) => b.name === 'nap' && b.weight() > 0) ?? null;
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
    if (here.kind === 'peek') return this.#peekBehaviours();
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
    // Leaving a window by running out of its side is still leaving the way he came.
    const exits = this.#reachable(true).filter((id) => place(this.#world, id).kind !== 'guest');
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

  /** Only his head shows: he looks about and waits for the page to move on. */
  #peekBehaviours(): Behaviour[] {
    return [
      this.#idleBehaviour(),
      {
        name: 'look around',
        weight: () => (this.#has('look') ? 0.8 : 0),
        run: async (signal) => { await this.#toPosture('stand'); await this.#once('look', signal); },
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

  /**
   * Places he can get to now. On his own he only goes where the reader can watch him go; running out of view is
   * something the page asks of him (an invitation), or how he leaves a window (`outOfView`).
   */
  #reachable(outOfView = false): string[] {
    return this.#world.places
      .filter((p) => p.id !== this.#place && p.surface())
      .map((p) => p.id)
      .filter((id) => {
        const r = route(this.#world, this.#place, id);
        return r !== null && r.every((link) => this.#canTake(link) && (outOfView || link.way !== 'offscreen'));
      });
  }

  #canTake(link: Link): boolean {
    if (link.way === 'walk') return this.#has('walkLeft', 'walkRight');
    if (link.way === 'hop') return this.#withinHop(link) && (this.#hopsLeft(link) ? this.#has('hop', 'turnLeft') : this.#has('hopRight', 'turnRight'));
    if (link.way === 'offscreen') return this.#has('runLeft', 'runRight', 'turnLeft', 'turnRight');
    // The ladder clips are drawn with the drop to his left.
    return this.#hopsLeft(link) && this.#withinLadder(link) && this.#has('produce', 'mount', 'climb', 'dismount', 'stow', 'ladder', 'turnLeft');
  }

  async #travel(links: Link[], signal: AbortSignal): Promise<void> {
    for (const link of links) {
      if (signal.aborted) return;
      // Running out of view starts from wherever he stands; every other way sets off from its end of the place.
      if (link.way !== 'offscreen') await this.#walkTo(departure(link), signal);
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
      } else if (link.way === 'ladder-down') {
        await this.#climbDown(link);
      } else if (link.way === 'offscreen') {
        await this.#goOffscreen(link);
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
    const clip = this.#clip(role);
    const stride = clip.stride ?? (run ? RUN_STRIDE : WALK_STRIDE);
    while (!signal.aborted && this.#alive && Math.abs(target - this.#at) * width > 1) {
      await this.#player.play(clip, {
        signal,
        onFrame: (frame) => {
          const step = stepOf(clip, frame, stride) / width;
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

  /**
   * Down a ledge by ladder, a deliberate and slightly unnecessary effort: he produces the ladder, hooks it over the
   * edge, climbs down rung by rung and puts it away. The whole descent is one committed movement: a poke waits until
   * he stands on the ground again rather than leaving him frozen half-way down. The ladder hangs as its own sprite
   * where the generator painted it, so it stays put while he moves down it.
   */
  async #climbDown(link: Link): Promise<void> {
    const from = place(this.#world, this.#place).surface()!;
    const to = place(this.#world, link.to).surface()!;
    const hard = this.#hard.signal;
    if (this.#reduced) { this.#arrive(link); return; }
    await this.#toPosture('face-left');
    const produce = this.#clip('produce'), mount = this.#clip('mount'), climb = this.#clip('climb');
    const dismount = this.#clip('dismount'), stow = this.#clip('stow');
    const s = climb.displayScale;
    const x = this.#player.position.x;
    await this.#player.play(produce, { signal: hard });

    // The hanging ladder: where mount's first frame has it, or just past his toes.
    const hanging = mount.props?.[0];
    const ladderX = hanging ? x + (hanging.cx - mount.pivot.x) * s : x - 20;
    const hooksY = hanging ? from.y + (hanging.top - mount.pivot.y) * s : from.y - 8;
    const ladder = this.#ladderSprite();
    const ladderClip = this.#clip('ladder');
    ladder.hold(ladderClip, 0);
    ladder.element.style.transformOrigin = `${ladderClip.pivot.x * s}px ${ladderClip.pivot.y * s}px`;
    ladder.element.style.transform = `scale(${LADDER.spriteScale})`;
    // A drop shorter than the ladder: it stands on the lower floor instead of reaching through it.
    ladder.moveTo(ladderX, Math.min(hooksY + LADDER.hooksAbovePivot * LADDER.spriteScale * s, to.y));
    ladder.element.style.visibility = '';

    await this.#player.play(mount, { signal: hard });
    // Each clip drew the ladder somewhere in its own cell; the ladder now hangs still, so he is placed per clip
    // wherever puts that clip's ladder onto it.
    const onLadder = (clip: Clip, fallback: number) => {
      const p = clip.props?.find((placed) => placed) ?? null;
      return p ? ladderX - (p.cx - clip.pivot.x) * s : fallback;
    };
    // Climb from where mount left his feet, one rung per cycle, until his feet are where dismount begins.
    const climbX = onLadder(climb, x);
    let y = from.y + (mount.feet.at(-1)! - climb.feet[0]!) * s;
    const stopAt = to.y + (dismount.feet[0]! - climb.feet[0]!) * s;
    this.#player.moveTo(climbX, y);
    while (!hard.aborted && y < stopAt - (LADDER.rung * s) / 2) {
      await this.#player.play(climb, { signal: hard });
      y += LADDER.rung * s;
      this.#player.moveTo(climbX, y);
    }
    const groundX = onLadder(dismount, climbX);
    this.#player.moveTo(groundX, to.y);
    await this.#player.play(dismount, { signal: hard });
    ladder.element.style.visibility = 'hidden';
    await this.#player.play(stow, { signal: hard });
    this.#place = link.to;
    this.#at = Math.max(0, Math.min(1, (groundX - to.left) / (to.right - to.left)));
    this.#arrivedAt = this.#clock.now();
    this.#posture = 'stand';
    this.#follow();
    this.#onPlace(link.to);
  }

  /**
   * Runs out past the end of this place, and back in from the side of the next one. Committed, like a hop: by the time
   * anyone could poke him he is out of reach. Reduced motion: he is simply there.
   */
  async #goOffscreen(link: Link): Promise<void> {
    const from = place(this.#world, this.#place).surface()!;
    const to = place(this.#world, link.to).surface()!;
    const hard = this.#hard.signal;
    if (!this.#reduced) {
      const leftwards = link.at === 'left';
      const view = this.#world.view?.();
      const outLeft = (left: number) => Math.min(left - OFFSCREEN, view ? view.left - PAST_EDGE : Infinity);
      const outRight = (right: number) => Math.max(right + OFFSCREEN, view ? view.right + PAST_EDGE : -Infinity);
      await this.#toPosture(leftwards ? 'face-left' : 'face-right');
      const start = this.#player.position.x;
      await this.#run(start, leftwards ? outLeft(from.left) : outRight(from.right), from.y, hard);
      const fromLeft = link.enter === 'left';
      const arriveX = to.left + link.arrive * (to.right - to.left);
      this.#posture = fromLeft ? 'face-right' : 'face-left';
      this.#player.setLayer(place(this.#world, link.to).layer?.() ?? null);
      await this.#run(fromLeft ? outLeft(to.left) : outRight(to.right), arriveX, to.y, hard);
    }
    this.#arrive(link);
  }

  /** Runs in a straight line from one x to another along y, one frame's distance at a time. */
  async #run(fromX: number, toX: number, y: number, signal: AbortSignal): Promise<void> {
    const leftwards = toX < fromX;
    const clip = this.#clip(leftwards ? 'runLeft' : 'runRight');
    let x = fromX;
    this.#player.moveTo(x, y);
    while (!signal.aborted && Math.abs(toX - x) > 1) {
      await this.#player.play(clip, {
        signal,
        onFrame: (frame) => {
          const step = stepOf(clip, frame, clip.stride ?? RUN_STRIDE);
          x = leftwards ? Math.max(toX, x - step) : Math.min(toX, x + step);
          this.#player.moveTo(x, y);
        },
      });
    }
  }

  /** The ladder's own element beside his, created on first use; scenery, not a second Yoru. */
  #ladder: SpritePlayer | null = null;
  #ladderSprite(): SpritePlayer {
    if (this.#ladder) return this.#ladder;
    const el = this.#player.element.ownerDocument.createElement('div');
    el.dataset['yoruLadder'] = '';
    (this.#player.element.before as (node: SpriteElement) => void).call(this.#player.element, el);
    this.#ladder = new SpritePlayer(el, this.#clock);
    el.style.pointerEvents = 'none';
    return this.#ladder;
  }

  /** Whether the two ends of a hop are close enough, right now, for him to make it. */
  #withinHop(link: Link): boolean {
    const from = place(this.#world, link.from).surface();
    const to = place(this.#world, link.to).surface();
    if (!from || !to) return false;
    const dx = Math.abs(to.left + link.arrive * (to.right - to.left) - (from.left + departure(link) * (from.right - from.left)));
    const dy = to.y - from.y;
    return dx <= HOP.across && dy >= -HOP.up && dy <= HOP.down;
  }

  /** Whether a hop goes towards the left, from where it sets off to where it lands. */
  /** A ladder only goes down, as far as it reaches, onto somewhere below where it hangs. */
  #withinLadder(link: Link): boolean {
    const from = place(this.#world, link.from).surface();
    const to = place(this.#world, link.to).surface();
    if (!from || !to || !this.#has('ladder')) return false;
    const drop = to.y - from.y;
    const reach = LADDER.hooksAbovePivot * LADDER.spriteScale * this.#clip('ladder').displayScale + LADDER_STEP_OFF;
    const x = from.left + departure(link) * (from.right - from.left);
    return drop > 0 && drop <= reach && x >= to.left && x <= to.right;
  }

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
    this.#onPlace(link.to);
  }

  /** His place disappeared: the nearest present place takes him, and he is simply there. */
  #relocate(): void {
    const present = this.#world.places.filter((p) => p.surface());
    if (!present.length) { this.stop(); return; }
    this.#place = (present.find((p) => p.kind === 'ground') ?? present[0]!).id;
    this.#at = 0.5;
    this.#follow();
    this.#onPlace(this.#place);
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

/** How far one frame of a walk or run carries him: its share of the cycle's time, of the cycle's stride. */
function stepOf(clip: Clip, frame: number, stride: number): number {
  const cycle = clip.durations.reduce((a, b) => a + b, 0);
  return (stride * clip.durations[frame]!) / cycle;
}
