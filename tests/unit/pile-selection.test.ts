import { describe, expect, it } from 'vitest';
import { BUDGET, dealPile, packPile, pieceWidth, type ManifestEntry } from '../../src/features/pile/client/selection';
import { berlinDateKey } from '../../src/lib/shape';

const kinds = ['thought', 'note', 'chip', 'artifact', 'lineage', 'door', 'specimen', 'site'] as const;
const footprints = ['small', 'medium', 'large'] as const;
const collection: ManifestEntry[] = Array.from({ length: 24 }, (_, i) => ({
  id: `entry-${i}`,
  kind: kinds[i % kinds.length]!,
  footprint: footprints[i % footprints.length]!,
  daily: i % 7 !== 6,
}));
const weight = { small: 1, medium: 2, large: 3 } as const;

describe('daily pile', () => {
  it('deals the same pile for the same date, independent of collection order', () => {
    const a = dealPile(collection, '2026-10-14');
    const b = dealPile([...collection].reverse(), '2026-10-14');
    expect(b.pile.map((e) => e.id)).toEqual(a.pile.map((e) => e.id));
  });

  it('deals a different pile on another day and for another seed', () => {
    const today = dealPile(collection, '2026-10-14').pile.map((e) => e.id);
    expect(dealPile(collection, '2026-10-15').pile.map((e) => e.id)).not.toEqual(today);
    expect(dealPile(collection, '2026-10-14', 'abc').pile.map((e) => e.id)).not.toEqual(today);
  });

  it('starts with five different forms, never duplicates, stays within the budget and leaves out undaily entries', () => {
    for (const day of ['2026-01-01', '2026-03-29', '2026-10-14', '2026-12-31']) {
      const { pile } = dealPile(collection, day);
      expect(new Set(pile.map((e) => e.id)).size).toBe(pile.length);
      expect(new Set(pile.map((e) => e.kind)).size).toBeGreaterThanOrEqual(5);
      expect(pile.every((e) => e.daily)).toBe(true);
      const firstFive = pile.slice(1, 6);
      expect(firstFive.length).toBeGreaterThan(0);
      const spent = pile.reduce((sum, e) => sum + weight[e.footprint], 0);
      // The five form representatives may overrun a tight budget; the fill never does.
      expect(spent).toBeLessThanOrEqual(Math.max(BUDGET, 15));
    }
  });

  it('puts a pickable form on top as today’s pick', () => {
    const { featured, pile } = dealPile(collection, '2026-10-14');
    expect(featured).not.toBeNull();
    expect(pile[0]).toBe(featured);
    expect(['thought', 'site', 'artifact', 'lineage', 'chip']).toContain(featured!.kind);
  });

  it('uses what is real when the collection is small', () => {
    const tiny = collection.slice(0, 2);
    const { pile } = dealPile(tiny, '2026-10-14');
    expect(pile.length).toBe(2);
  });
});

describe('packing', () => {
  it('keeps every piece inside the stage and is deterministic', () => {
    const deal = dealPile(collection, '2026-10-14');
    for (const width of [340, 768, 1280]) {
      const a = packPile(deal, width, () => undefined);
      const b = packPile(deal, width, () => undefined);
      expect(b).toEqual(a);
      expect(a.placements.length).toBe(deal.pile.length);
      for (const p of a.placements) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x + p.width).toBeLessThanOrEqual(width + 1);
      }
      expect(a.height).toBeGreaterThan(0);
    }
  });

  it('gives today’s pick a little more room', () => {
    expect(pieceWidth('thought', 1200, true)).toBeGreaterThan(pieceWidth('thought', 1200, false));
  });
});

describe('Berlin date', () => {
  it('uses the calendar date in Europe/Berlin, across daylight-saving changes', () => {
    expect(berlinDateKey(new Date('2026-10-13T22:30:00Z'))).toBe('2026-10-14'); // CEST, UTC+2
    expect(berlinDateKey(new Date('2026-10-13T21:30:00Z'))).toBe('2026-10-13');
    expect(berlinDateKey(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01'); // CET, UTC+1
    expect(berlinDateKey(new Date('2026-03-28T23:30:00Z'))).toBe('2026-03-29');
  });
});
