import { describe, expect, it } from 'vitest';
import { ClipLibrary, type SheetManifest } from '../../src/features/yoru/clips';
import { SpritePlayer, type Clock } from '../../src/features/yoru/player';
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
  manifest('presence', { idle: 4, look: 4, think: 4, wave: 4, hop: 7, 'run-left': 4, 'run-right': 4 }, ['idle', 'think']),
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
const fakeElement = () => ({ style: {} as Record<string, string>, dataset: {} as Record<string, string> }) as unknown as HTMLElement;

function setup(seed = 7, surfaces: Record<string, Surface | null> = {}, acquaintance: Acquaintance | null = null) {
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
});
