import { describe, expect, it } from 'vitest';
import { ClipLibrary, type SheetManifest } from '../../src/features/yoru/clips';
import { SpritePlayer, type Clock, type SpriteElement, type SpriteParent } from '../../src/features/yoru/player';
import { Resident } from '../../src/features/yoru/resident';
import type { Surface, World } from '../../src/features/yoru/world';
import { newAcquaintance, type Acquaintance } from '../../src/features/yoru/memory';

/** A manifest with every named clip as a few 100 ms frames. */
function manifest(family: string, clips: Record<string, number>, loops: string[] = []): { manifest: SheetManifest; sheetUrl: string } {
  return {
    sheetUrl: `/${family}.webp`,
    manifest: {
      family, title: family, sheet: `${family}.webp`, cell: { width: 256, height: 208 }, pivot: { x: 128, y: 203 }, displayScale: 0.5,
      clips: Object.fromEntries(Object.entries(clips).map(([name, frames], row) => [name, { row, frames, durations: Array(frames).fill(100), loop: loops.includes(name) }])),
    },
  };
}

const library = () => new ClipLibrary([
  manifest('presence', { idle: 4, look: 4, think: 4, wave: 4, hop: 7, 'hop-right': 7, 'run-left': 4, 'run-right': 4 }, ['idle', 'think']),
  manifest('guest', { 'look-in': 3, 'sit-in': 3, watch: 4, notice: 3, rise: 3 }, ['watch']),
  manifest('ladder', { produce: 3, mount: 3, climb: 4, dismount: 3, stow: 3, 'produce-right': 3, 'mount-right': 3, 'climb-right': 4, 'dismount-right': 3, 'stow-right': 3 }, ['climb', 'climb-right']),
  manifest('ladder-prop', { open: 1 }),
  manifest('everyday', { 'walk-left': 4, 'walk-right': 4, 'turn-left': 3, 'turn-right': 3, 'sit-down': 3, sit: 3, 'stand-up': 3, yawn: 3, groom: 4 }, ['sit']),
  manifest('sleep', { settle: 4, sleep: 2, wake: 4 }, ['sleep']),
  manifest('curious', { inspect: 4 }),
  manifest('reactions', { stare: 3, startle: 3, peek: 3 }, ['peek']),
]);

/**
 * Virtual time: every wait completes on the next macrotask with the clock moved on, so minutes of his life pass in
 * milliseconds and the test's own loop still gets its turns.
 */
function virtualClock(): Clock & { advance(ms: number): void } {
  let now = 0;
  return {
    now: () => now,
    advance(ms) { now += ms; },
    wait: async (ms, signal) => {
      await new Promise((r) => setTimeout(r, 0));
      if (signal.aborted) return false;
      now += ms;
      return !signal.aborted;
    },
  };
}

/** Enough of an element for the player: it only writes styles and data attributes. */
const fakeElement = () => ({ style: {} as Record<string, string>, dataset: {} as Record<string, string> }) as unknown as SpriteElement;

function setup(seed = 7, surfaces: Record<string, Surface | null> = {}, acquaintance: Acquaintance | null = null, elapsed = 0) {
  const geometry: Record<string, Surface | null> = {
    floor: { left: 100, right: 700, y: 400 },
    nook: { left: 700, right: 900, y: 400 },
    ...surfaces,
  };
  const world: World = {
    places: [
      { id: 'floor', kind: 'ground', surface: () => geometry['floor'] ?? null, curiosities: () => [{ id: 'pebble', x: 300 }] },
      { id: 'nook', kind: 'nook', restful: true, surface: () => geometry['nook'] ?? null },
    ],
    links: [
      { from: 'floor', to: 'nook', way: 'walk', at: 'right', arrive: 0.05 },
      { from: 'nook', to: 'floor', way: 'walk', at: 'left', arrive: 0.95 },
    ],
  };
  const clock = virtualClock();
  clock.advance(elapsed);
  const element = fakeElement();
  const player = new SpritePlayer(element, clock);
  const trace: string[] = [];
  const resident = new Resident({ player, clips: library(), world, start: { place: 'floor', at: 0.5 }, seed, clock, acquaintance, trace: (line) => trace.push(line) });
  return { resident, player, clock, trace, geometry, element };
}

/** Runs his life until the virtual clock passes `ms`. */
async function live(resident: Resident, clock: Clock, ms: number): Promise<void> {
  resident.start();
  while (clock.now() < ms) await new Promise((r) => setTimeout(r, 0));
  resident.stop();
  await new Promise((r) => setTimeout(r, 0));
}

// Virtual time still yields a macrotask per frame; these lives take a few seconds of real time.
describe('the resident', { timeout: 20000 }, () => {
  it('pauses acquaintance time while stopped, then counts only the next visible calm minute', () => {
    const { resident, clock } = setup(7, {}, newAcquaintance('2026-10-24'));
    resident.start();
    expect(resident.remember()?.familiarity).toBe(0);
    resident.stop();
    clock.advance(120 * 60_000);
    expect(resident.remember()?.familiarity).toBe(0);
    resident.start();
    expect(resident.remember()?.familiarity).toBe(0);
    clock.advance(60_000);
    expect(resident.remember()?.familiarity).toBeCloseTo(0.01);
    resident.stop();
  });

  it('synchronizes incoming wariness into live state and the next save', () => {
    const base = { ...newAcquaintance('2026-10-24'), wariness: 0.2 };
    const { resident } = setup(7, {}, base);
    const incoming = { ...base, wariness: 0.9 };
    resident.synchronizeAcquaintance(incoming);
    expect(resident.state.wariness).toBe(0.9);
    expect(resident.remember()?.wariness).toBe(0.9);
    resident.setAcquaintance({ ...base, wariness: 0.7 });
    expect(resident.state.wariness).toBe(0.7);
    expect(resident.remember()?.wariness).toBe(0.7);
  });

  it('counts only actual session minutes for a returning acquaintance on a non-zero clock', () => {
    const known = { ...newAcquaintance('2026-10-24'), familiarity: 0.4 };
    const { resident, clock } = setup(7, {}, known, 86_400_000);
    expect(resident.remember()?.familiarity).toBe(0.4);
    clock.advance(60_000);
    expect(resident.remember()?.familiarity).toBeCloseTo(0.406);
  });

  it('chooses the same life from the same seed, and a different one from another', async () => {
    const a = setup(3), b = setup(3), c = setup(4);
    await Promise.all([live(a.resident, a.clock, 30000), live(b.resident, b.clock, 30000), live(c.resident, c.clock, 30000)]);
    expect(a.trace.length).toBeGreaterThan(5);
    expect(a.trace).toEqual(b.trace);
    expect(c.trace).not.toEqual(a.trace);
  }, 30000);

  it('answers one poke with a look, a second with a startle, a third by leaving and peeking back', async () => {
    const { resident, clock, trace } = setup();
    resident.start();
    while (clock.now() < 3000) await new Promise((r) => setTimeout(r, 0));
    resident.poke();
    while (!trace.includes('→ react 1')) await new Promise((r) => setTimeout(r, 0));
    resident.poke();
    resident.poke();
    while (!trace.includes('→ react 3')) await new Promise((r) => setTimeout(r, 0));
    const t = clock.now();
    while (clock.now() < t + 3000) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    expect(trace.filter((l) => l.startsWith('poke'))).toEqual(['poke ×1', 'poke ×2', 'poke ×3']);
    expect(trace).toContain('→ react 3');
  });

  it('does not curl up to sleep right after being poked', async () => {
    const { resident, clock, trace } = setup(11);
    resident.start();
    while (clock.now() < 1000) await new Promise((r) => setTimeout(r, 0));
    for (let i = 0; i < 3; i++) resident.poke();
    const t = clock.now();
    while (clock.now() < t + 12000) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    const after = trace.slice(trace.indexOf('poke ×3'));
    expect(after).not.toContain('→ nap');
  });

  it('leaves a place that disappears instead of standing on nothing', async () => {
    const { resident, clock, geometry, trace } = setup();
    resident.start();
    while (clock.now() < 2000) await new Promise((r) => setTimeout(r, 0));
    geometry['floor'] = null;
    resident.layoutChanged();
    const t = clock.now();
    while (clock.now() < t + 2000) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    expect(resident.state.place).toBe('nook');
    expect(trace).toContain('floor is gone');
  });

  it('stops moving the moment he is stopped', async () => {
    const { resident, clock, element } = setup();
    await live(resident, clock, 10000);
    const frozen = { ...element.style, ...element.dataset };
    for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
    expect({ ...element.style, ...element.dataset }).toEqual(frozen);
  });

  it('greets someone he knows with a lazy wave for a first poke, and remembers the calm time', async () => {
    const known = { ...newAcquaintance('2026-10-24'), familiarity: 0.8 };
    const { resident, clock, element } = setup(7, {}, known);
    resident.start();
    while (clock.now() < 2000) await new Promise((r) => setTimeout(r, 0));
    resident.poke();
    const seen = new Set<string>();
    const t = clock.now();
    while (clock.now() < t + 1500) { seen.add(element.dataset['clip'] ?? ''); await new Promise((r) => setTimeout(r, 0)); }
    resident.stop();
    expect(seen).toContain('presence/wave');
    expect(seen).not.toContain('reactions/stare');
    expect(resident.remember()?.familiarity).toBe(0.8); // a poke in the window earns no familiarity
  });

  it('visits a scene as one actor: in through its layer, watching, noticing, and out again', async () => {
    // Stand-ins that move the element between parents the way the DOM does.
    const appended: string[] = [];
    let parent: unknown = null;
    const layerElement = { append: () => { parent = layerElement; appended.push('into window'); } } as SpriteParent;
    const stageElement = { append: () => { parent = stageElement; appended.push('back home'); } } as SpriteParent;
    parent = stageElement;
    const world: World = {
      places: [
        { id: 'floor', kind: 'ground', surface: () => ({ left: 100, right: 700, y: 400 }) },
        {
          id: 'coast', kind: 'guest',
          surface: () => ({ left: 300, right: 500, y: 360 }),
          layer: () => ({ element: layerElement, origin: { x: 280, y: 150 } }),
        },
      ],
      links: [
        { from: 'floor', to: 'coast', way: 'hop', at: 'left', leave: 0.7, arrive: 0.8 },
        { from: 'coast', to: 'floor', way: 'hop', at: 'right', arrive: 0.8 },
      ],
    };
    const clock = virtualClock();
    const element = { style: {}, dataset: {}, get parentElement() { return parent; } } as unknown as SpriteElement;
    const trace: string[] = [];
    const resident = new Resident({ player: new SpritePlayer(element, clock), clips: library(), world, start: { place: 'floor', at: 0.5 }, seed: 5, clock, trace: (l) => trace.push(l) });
    resident.start();
    while (resident.state.posture !== 'watch' && clock.now() < 600000) await new Promise((r) => setTimeout(r, 0));
    expect(resident.state.place).toBe('coast');
    expect(appended).toContain('into window');
    resident.sceneChanged('coast');
    const t = clock.now();
    while (!trace.includes('→ leave') && clock.now() < t + 600000) await new Promise((r) => setTimeout(r, 0));
    while (resident.state.place === 'coast' && clock.now() < t + 600000) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    expect(trace).toContain('coast changed');
    expect(trace).toContain('→ notice');
    expect(resident.state.place).toBe('floor');
    expect(appended.at(-1)).toBe('back home');
  });

  it('climbs down by ladder in whole rungs, lands on the lower place and puts the ladder away', async () => {
    const created: Array<{ style: Record<string, string>; dataset: Record<string, string> }> = [];
    const doc = { createElement: () => { const el = { style: {} as Record<string, string>, dataset: {} as Record<string, string> }; created.push(el); return el; } };
    const element = { style: {}, dataset: {}, parentElement: null, ownerDocument: doc, before: () => {} } as unknown as SpriteElement;
    const world: World = {
      places: [
        { id: 'ledge', kind: 'perch', surface: () => ({ left: 300, right: 500, y: 300 }) },
        { id: 'floor', kind: 'ground', surface: () => ({ left: 100, right: 700, y: 420 }) },
      ],
      links: [{ from: 'ledge', to: 'floor', way: 'ladder-down', at: 'left', arrive: 0.3 }],
    };
    const clock = virtualClock();
    const trace: string[] = [];
    const resident = new Resident({ player: new SpritePlayer(element, clock), clips: library(), world, start: { place: 'ledge', at: 0.5 }, seed: 2, clock, trace: (l) => trace.push(l) });
    resident.start();
    while (resident.state.place !== 'floor' && clock.now() < 600000) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    expect(resident.state.place).toBe('floor');
    expect(created).toHaveLength(1); // one ladder, never a second Yoru
    expect(created[0]!.style['visibility']).toBe('hidden');
  });

  it('does not take a hop that has become a flight because the page moved', async () => {
    let gap = 40;
    const world: World = {
      places: [
        { id: 'floor', kind: 'ground', surface: () => ({ left: 100, right: 700, y: 400 }) },
        { id: 'shelf', kind: 'perch', surface: () => ({ left: 40, right: 160, y: 400 - gap }) },
      ],
      links: [{ from: 'floor', to: 'shelf', way: 'hop', at: 'left', arrive: 0.5 }],
    };
    const clock = virtualClock();
    const element = { style: {}, dataset: {}, parentElement: null } as unknown as SpriteElement;
    const resident = new Resident({ player: new SpritePlayer(element, clock), clips: library(), world, start: { place: 'floor', at: 0.5 }, seed: 3, clock });
    gap = 900; // the shelf scrolled far above him
    resident.invite('shelf');
    resident.start();
    while (clock.now() < 20000) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    expect(resident.state.place).toBe('floor');
  });

  it('climbs down a drop on his right with the right-hand ladder clips', async () => {
    const doc = { createElement: () => ({ style: {} as Record<string, string>, dataset: {} as Record<string, string> }) };
    const element = { style: {} as Record<string, string>, dataset: {}, parentElement: null, ownerDocument: doc, before: () => {} } as unknown as SpriteElement;
    const world: World = {
      places: [
        { id: 'shelf', kind: 'perch', surface: () => ({ left: 100, right: 300, y: 300 }) },
        { id: 'floor', kind: 'ground', surface: () => ({ left: 100, right: 700, y: 420 }) },
      ],
      links: [{ from: 'shelf', to: 'floor', way: 'ladder-down', at: 'right', arrive: 0.5 }],
    };
    const clock = virtualClock();
    const seen = new Set<string>();
    const player = new SpritePlayer(element, clock);
    const play = player.play.bind(player);
    player.play = (clip, options) => { seen.add(clip.id); return play(clip, options); };
    const resident = new Resident({ player, clips: library(), world, start: { place: 'shelf', at: 0.5 }, seed: 2, clock });
    resident.invite('floor');
    resident.start();
    while (resident.state.place !== 'floor' && clock.now() < 600000) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    expect(resident.state.place).toBe('floor');
    expect([...seen].filter((id) => id.startsWith('ladder/'))).toEqual(['ladder/produce-right', 'ladder/mount-right', 'ladder/climb-right', 'ladder/dismount-right', 'ladder/stow-right']);
  });

  it('does not climb down a ladder that would not reach the floor', async () => {
    let drop = 120;
    const world: World = {
      places: [
        { id: 'ledge', kind: 'perch', surface: () => ({ left: 300, right: 500, y: 300 }) },
        { id: 'floor', kind: 'ground', surface: () => ({ left: 100, right: 700, y: 300 + drop }) },
      ],
      links: [{ from: 'ledge', to: 'floor', way: 'ladder-down', at: 'left', arrive: 0 }],
    };
    const clock = virtualClock();
    const element = { style: {}, dataset: {}, parentElement: null } as unknown as SpriteElement;
    const resident = new Resident({ player: new SpritePlayer(element, clock), clips: library(), world, start: { place: 'ledge', at: 0.5 }, seed: 3, clock });
    drop = 1600; // the next section is a whole screen below
    resident.invite('floor');
    resident.start();
    while (clock.now() < 20000) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    expect(resident.state.place).toBe('ledge');
  });

  it('runs out of view only when the page asks, and only looks about while peeking', async () => {
    const world: World = {
      places: [
        { id: 'band', kind: 'ground', surface: () => ({ left: 400, right: 500, y: 300 }) },
        { id: 'peek', kind: 'peek', surface: () => ({ left: 640, right: 700, y: 1000 }) },
      ],
      links: [
        { from: 'band', to: 'peek', way: 'offscreen', at: 'right', enter: 'right', arrive: 0.5 },
        { from: 'peek', to: 'band', way: 'offscreen', at: 'right', enter: 'right', arrive: 0.5 },
      ],
    };
    const clock = virtualClock();
    const element = { style: {}, dataset: {}, parentElement: null } as unknown as SpriteElement;
    const trace: string[] = [];
    const resident = new Resident({ player: new SpritePlayer(element, clock), clips: library(), world, start: { place: 'band', at: 0.5 }, seed: 5, clock, trace: (l) => trace.push(l) });
    await live(resident, clock, 20000);
    expect(resident.state.place).toBe('band'); // a good while on his own, and he never ran off

    resident.invite('peek');
    resident.start();
    while (resident.state.place !== 'peek' && clock.now() < 200000) await new Promise((r) => setTimeout(r, 0));
    const arrived = trace.length;
    const until = clock.now() + 15000;
    while (clock.now() < until) await new Promise((r) => setTimeout(r, 0));
    resident.stop();
    expect(resident.state.place).toBe('peek');
    const chosen = trace.slice(arrived).filter((l) => l.startsWith('→ ')).map((l) => l.slice(2));
    expect(new Set(chosen)).toEqual(new Set(['idle', 'look around']));
  });
});
