import { describe, expect, it } from 'vitest';
import { browserMemory, MEMORY_KEY, mergeAcquaintance, newAcquaintance, parseAcquaintance, settleAcquaintance, spendTime, welcomeBack } from '../../src/features/yoru/memory';

/** A Storage stand-in; `fail` makes every call throw, as a blocked or full store does. */
function store(fail = false) {
  const data = new Map<string, string>();
  const guard = () => { if (fail) throw new DOMException('blocked', 'SecurityError'); };
  return {
    data,
    getItem: (k: string) => { guard(); return data.get(k) ?? null; },
    setItem: (k: string, v: string) => { guard(); data.set(k, v); },
    removeItem: (k: string) => { guard(); data.delete(k); },
  };
}

describe('remembered acquaintance', () => {
  it('merges different tabs’ changes while preserving discoveries and familiarity in either save order', () => {
    const base = newAcquaintance('2026-10-24');
    const a = { ...base, discovered: ['coast'], familiarity: 0.4 };
    const b = { ...base, favouritePlace: 'nook', wariness: 0.7 };
    const expected = { ...a, favouritePlace: 'nook', wariness: 0.7 };
    expect(mergeAcquaintance(base, b, a)).toEqual(expected);
    expect(mergeAcquaintance(base, a, b)).toEqual(expected);
    const conflict = { ...a, favouritePlace: 'floor', wariness: 0.9 };
    expect(mergeAcquaintance(base, b, conflict)).toMatchObject({ favouritePlace: 'floor', wariness: 0.9 });
  });

  it('stores nothing until remembering is turned on, and nothing after it is turned off', () => {
    const s = store();
    const memory = browserMemory(s);
    expect(memory.load()).toBeNull();
    expect(s.data.size).toBe(0);
    expect(memory.save(newAcquaintance('2026-10-24'))).toBe(true);
    expect(memory.load()?.familiarity).toBe(0);
    expect(memory.forget()).toBe(true);
    expect(s.data.size).toBe(0);
    expect(memory.load()).toBeNull();
  });

  it('keeps only what changes his behaviour: no ids, coordinates or timestamps', () => {
    const record = newAcquaintance('2026-10-24');
    expect(Object.keys(record).sort()).toEqual(['discovered', 'familiarity', 'favouritePlace', 'lastSeen', 'version', 'wariness']);
    expect(record.lastSeen).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('ignores records it cannot trust instead of letting them drive him', () => {
    expect(parseAcquaintance('not json')).toBeNull();
    expect(parseAcquaintance(JSON.stringify({ ...newAcquaintance('2026-10-24'), version: 2 }))).toBeNull();
    expect(parseAcquaintance(JSON.stringify({ ...newAcquaintance('2026-10-24'), familiarity: 7 }))).toBeNull();
    expect(parseAcquaintance(JSON.stringify({ ...newAcquaintance('2026-10-24'), lastSeen: 1729700000000 }))).toBeNull();
    for (const day of ['2026-99-99', '2026-02-30', '2025-02-29']) {
      expect(parseAcquaintance(JSON.stringify(newAcquaintance(day)))).toBeNull();
    }
    expect(parseAcquaintance(JSON.stringify(newAcquaintance('2024-02-29')))).not.toBeNull();
    const s = store();
    s.data.set(MEMORY_KEY, '{"version":1');
    expect(browserMemory(s).load()).toBeNull();
  });

  it('treats blocked storage as no memory, never as a broken page', () => {
    const memory = browserMemory(store(true));
    expect(memory.load()).toBeNull();
    expect(memory.save(newAcquaintance('2026-10-24'))).toBe(false);
    expect(memory.forget()).toBe(false);
    expect(browserMemory(null).load()).toBeNull();
    expect(browserMemory(null).save(newAcquaintance('2026-10-24'))).toBe(false);
  });

  it('does not report a successful write when storage silently discards or changes the record', () => {
    const discarded = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    expect(browserMemory(discarded).save(newAcquaintance('2026-10-24'))).toBe(false);
    const changed = { ...discarded, getItem: () => JSON.stringify({ ...newAcquaintance('2026-10-24'), familiarity: 0.5 }) };
    expect(browserMemory(changed).save(newAcquaintance('2026-10-24'))).toBe(false);
  });

  it('reports failure when removal is blocked or silently ignored, preserving the record', () => {
    for (const throws of [true, false]) {
      const s = store();
      const record = newAcquaintance('2026-10-24');
      const memory = browserMemory({ ...s, removeItem() { if (throws) throw new DOMException('blocked', 'SecurityError'); } });
      expect(memory.save(record)).toBe(true);
      expect(memory.forget()).toBe(false);
      expect(memory.load()).toEqual(record);
    }
  });

  it('charges nothing for time away: familiarity stays, wariness settles', () => {
    const before = { ...newAcquaintance('2026-10-01'), familiarity: 0.7, wariness: 0.8 };
    const after = welcomeBack(before, '2026-10-24');
    expect(after.familiarity).toBe(0.7);
    expect(after.wariness).toBe(0);
    expect(after.lastSeen).toBe('2026-10-24');
    const yearsLater = welcomeBack(before, '2036-10-24');
    expect(yearsLater.familiarity).toBe(before.familiarity);
    expect(yearsLater.wariness).toBe(0);
    const room = settleAcquaintance(before, '2036-10-24');
    expect(room.familiarity).toBe(before.familiarity);
    expect(room.wariness).toBe(0);
    expect(room.lastSeen).toBe(before.lastSeen);
    expect(before.wariness).toBe(0.8);
  });

  it('grows familiar with calm time together, not with poking', () => {
    const a = newAcquaintance('2026-10-24');
    expect(spendTime(a, 30, false).familiarity).toBeGreaterThan(0.2);
    expect(spendTime(a, 30, true).familiarity).toBe(0);
    expect(spendTime({ ...a, familiarity: 0.99 }, 600, false).familiarity).toBeLessThanOrEqual(1);
  });
});
