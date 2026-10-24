import { describe, expect, it } from 'vitest';
import { browserMemory, MEMORY_KEY, newAcquaintance, parseAcquaintance, spendTime, welcomeBack } from '../../src/features/yoru/memory';

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
  it('stores nothing until remembering is turned on, and nothing after it is turned off', () => {
    const s = store();
    const memory = browserMemory(s);
    expect(memory.load()).toBeNull();
    expect(s.data.size).toBe(0);
    memory.save(newAcquaintance('2026-10-24'));
    expect(memory.load()?.familiarity).toBe(0);
    memory.forget();
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
    const s = store();
    s.data.set(MEMORY_KEY, '{"version":1');
    expect(browserMemory(s).load()).toBeNull();
  });

  it('treats blocked storage as no memory, never as a broken page', () => {
    const memory = browserMemory(store(true));
    expect(memory.load()).toBeNull();
    expect(() => memory.save(newAcquaintance('2026-10-24'))).not.toThrow();
    expect(() => memory.forget()).not.toThrow();
    expect(browserMemory(null).load()).toBeNull();
  });

  it('charges nothing for time away: familiarity stays, wariness settles', () => {
    const before = { ...newAcquaintance('2026-10-01'), familiarity: 0.7, wariness: 0.8 };
    const after = welcomeBack(before, '2026-10-24');
    expect(after.familiarity).toBe(0.7);
    expect(after.wariness).toBe(0);
    expect(after.lastSeen).toBe('2026-10-24');
  });

  it('grows familiar with calm time together, not with poking', () => {
    const a = newAcquaintance('2026-10-24');
    expect(spendTime(a, 30, false).familiarity).toBeGreaterThan(0.2);
    expect(spendTime(a, 30, true).familiarity).toBe(0);
    expect(spendTime({ ...a, familiarity: 0.99 }, 600, false).familiarity).toBeLessThanOrEqual(1);
  });
});
