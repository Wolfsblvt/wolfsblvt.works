/**
 * Today's pile and where its pieces land. Pure functions: the same date, seed and collection always deal the same
 * pile, independent of viewport width or Endless order. Visual variety only; nothing here is security randomness.
 */
import { clamp, hashString, mulberry32, round1 } from '../../../lib/shape';

export type Kind = 'thought' | 'note' | 'chip' | 'artifact' | 'lineage' | 'door' | 'specimen' | 'site';
export type Footprint = 'small' | 'medium' | 'large';

export interface ManifestEntry {
  id: string;
  kind: Kind;
  footprint: Footprint;
  daily: boolean;
}

const WEIGHT: Record<Footprint, number> = { small: 1, medium: 2, large: 3 };
/** Footprint budget for one day's pile. Tuned against the real collection: solid objects need more air than the
 * canvas's airy thoughts did, so a day shows eight to ten pieces, not a dozen. */
export const BUDGET = 16;
/** Forms eligible to be today's pick: those that read well a little larger, on top. */
const PICKABLE: readonly Kind[] = ['thought', 'site', 'artifact', 'lineage', 'chip'];

export interface DailyPile {
  /** The selection key: the Berlin date, plus the per-browser seed when the Worker supplied one. */
  key: string;
  featured: ManifestEntry | null;
  /** Selected entries, today's pick first. */
  pile: ManifestEntry[];
}

/**
 * One piece from each of up to five different forms first, then fill a footprint budget, then put today's pick on
 * top. Never duplicates, never manufactures filler; with fewer forms or entries it uses what is real.
 */
export function dealPile(entries: readonly ManifestEntry[], dateKey: string, seed?: string): DailyPile {
  const key = seed ? `${dateKey}|${seed}` : dateKey;
  // Sorted by id first, so the deal never depends on Endless order or any other incidental order.
  const eligible = entries.filter((entry) => entry.daily).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const rnd = mulberry32(hashString(`pile|${key}|${eligible.map((e) => e.id).join(',')}`));
  const shuffled = eligible.map((entry) => ({ entry, k: rnd() })).sort((a, b) => a.k - b.k).map((x) => x.entry);
  const forms = [...new Set(shuffled.map((entry) => entry.kind))];
  const picked: ManifestEntry[] = [];
  const used = new Set<string>();
  let budget = BUDGET;
  for (const form of forms.slice(0, 5)) {
    const entry = shuffled.find((x) => x.kind === form && !used.has(x.id));
    if (!entry) continue;
    picked.push(entry);
    used.add(entry.id);
    budget -= WEIGHT[entry.footprint];
  }
  for (const entry of shuffled) {
    if (used.has(entry.id)) continue;
    const weight = WEIGHT[entry.footprint];
    if (budget - weight < 0) continue;
    picked.push(entry);
    used.add(entry.id);
    budget -= weight;
  }
  const featured = picked.find((entry) => PICKABLE.includes(entry.kind)) ?? null;
  const pile = featured ? [featured, ...picked.filter((entry) => entry !== featured)] : picked;
  return { key, featured, pile };
}

/**
 * [width as a fraction of the stage, minimum px, maximum px] by footprint. The footprint is the authored size of the
 * object; the form only decides its tilt. Scenes are composed to these widths.
 */
const WIDTH: Record<Footprint, readonly [number, number, number]> = {
  small: [0.19, 170, 240],
  medium: [0.27, 250, 340],
  large: [0.37, 320, 460],
};
/** Height estimates before a piece has been measured. */
export const ESTIMATED_HEIGHT: Record<Footprint, number> = { small: 150, medium: 200, large: 250 };
const TILT: Record<Kind, number> = { thought: 3, note: 7, chip: 6, artifact: 4, lineage: 5, door: 3, specimen: 4, site: 5 };

export function pieceWidth(footprint: Footprint, stageWidth: number, featured: boolean): number {
  const [fraction, min, max] = WIDTH[footprint];
  const base = Math.round(Math.min(clamp(stageWidth * fraction, min, max), stageWidth * 0.92));
  return featured ? Math.round(Math.min(stageWidth * 0.92, Math.max(base * 1.15, 330))) : base;
}

/** Breathing room kept between a piece and whatever settles onto it. */
const GAP = 18;

export interface Placement {
  id: string;
  x: number;
  y: number;
  rotate: number;
  width: number;
  height: number;
  order: number;
  featured: boolean;
}

/**
 * A bounded skyline packer: today's pick goes on first, near the middle; every other piece tries a few seeded lanes
 * and settles on the lowest, most central one, with a small uneven drop and tilt. Not a physics world.
 */
export function packPile(
  pile: DailyPile,
  stageWidth: number,
  heightOf: (id: string, width: number) => number | undefined,
): { placements: Placement[]; height: number } {
  const W = Math.max(1, stageWidth);
  const rnd = mulberry32(hashString(`place|${pile.key}`));
  const cols = Math.ceil(W / 8) + 1;
  const sky = new Array<number>(cols).fill(0);
  const placements: Placement[] = [];
  pile.pile.forEach((entry, order) => {
    const featured = entry === pile.featured;
    const width = pieceWidth(entry.footprint, W, featured);
    const height = heightOf(entry.id, width) ?? ESTIMATED_HEIGHT[entry.footprint];
    if (featured) {
      const x = clamp((W - width) / 2 + (rnd() - 0.5) * W * 0.36, 0, Math.max(0, W - width));
      const y = 34;
      const c0 = Math.max(0, Math.floor(x / 8));
      const c1 = Math.min(cols - 1, Math.ceil((x + width) / 8));
      for (let c = c0; c <= c1; c++) sky[c] = y + height + GAP;
      placements.push({ id: entry.id, x: Math.round(x), y, rotate: round1((rnd() - 0.5) * 3), width, height, order, featured: true });
      return;
    }
    let best: { x: number; y: number; c0: number; c1: number; score: number } | null = null;
    const slots = 12;
    const span = Math.max(0, W - width);
    for (let k = 0; k < slots; k++) {
      const cx = span * ((k + rnd() * 0.9) / slots);
      const c0 = Math.max(0, Math.floor(cx / 8));
      const c1 = Math.min(cols - 1, Math.ceil((cx + width) / 8));
      let landing = 0;
      for (let c = c0; c <= c1; c++) landing = Math.max(landing, sky[c]!);
      const score = landing + (Math.abs(cx + width / 2 - W / 2) / (W / 2)) * 40 + rnd() * 46;
      if (!best || score < best.score) best = { x: cx, y: landing, c0, c1, score };
    }
    const b = best!;
    // A small, uneven settle onto the piece below: a little overlap reads as piled, more reads as clutter.
    const y = Math.max(0, b.y - (b.y > 0 ? Math.min(height * 0.06, 12) : 0)) + rnd() * 14;
    for (let c = b.c0; c <= b.c1; c++) sky[c] = y + height + GAP;
    placements.push({ id: entry.id, x: Math.round(b.x), y: Math.round(y), rotate: round1((rnd() - 0.5) * TILT[entry.kind]), width, height, order, featured: false });
  });
  const height = placements.reduce((max, p) => Math.max(max, p.y + p.height), 0) + 40;
  return { placements, height };
}
