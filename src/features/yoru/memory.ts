/**
 * Remembered acquaintance: what Yoru may carry from one visit to the next on this browser, only after the visitor
 * turned "Remember Yoru" on (Wolf, 2026-10-24: "Build it, opt-in only"). Turning it on is what creates the record;
 * turning it off deletes it, so nothing is stored while it is off, not even the choice.
 *
 * The record holds what changes his next behaviour and nothing about the visitor: how familiar he has become, where
 * he likes to rest, a short-lived wariness, the scenes he has discovered and the day he was last seen. No id, no
 * pointer path, no clicks, no reading history, no network. Time away costs nothing: familiarity stays, wariness
 * settles. A record that is unreadable, from a future version or out of range is ignored rather than trusted.
 */

export const MEMORY_KEY = 'yoru.acquaintance';
const VERSION = 1;

export interface Acquaintance {
  version: 1;
  /** 0 a stranger, 1 an old acquaintance. Grows with calm time together, never punished. */
  familiarity: number;
  /** Short-lived: settles over an absence. */
  wariness: number;
  /** A semantic place id, never a coordinate. */
  favouritePlace: string | null;
  /** Scene ids he has visited, for a keepsake in his nook. */
  discovered: string[];
  /** The calendar day of the last visit, as YYYY-MM-DD. A day, not a timestamp. */
  lastSeen: string;
}

export interface MemoryStore {
  /** The remembered acquaintance, or null when remembering is off, unavailable or the record is not usable. */
  load(): Acquaintance | null;
  /** True only when the same valid record can be read back after writing. */
  save(record: Acquaintance): boolean;
  /** Turn remembering off: the record is gone. */
  forget(): boolean;
}

export function newAcquaintance(today: string): Acquaintance {
  return { version: VERSION, familiarity: 0, wariness: 0, favouritePlace: null, discovered: [], lastSeen: today };
}

/** Merge a tab's changes, not its stale snapshot. Stored values win conflicting mood/place edits. */
export function mergeAcquaintance(base: Acquaintance, local: Acquaintance, stored: Acquaintance): Acquaintance {
  return {
    version: VERSION,
    familiarity: Math.max(local.familiarity, stored.familiarity),
    discovered: [...new Set([...stored.discovered, ...local.discovered])].slice(0, 32),
    favouritePlace: stored.favouritePlace === base.favouritePlace ? local.favouritePlace : stored.favouritePlace,
    wariness: stored.wariness === base.wariness ? local.wariness : stored.wariness,
    lastSeen: local.lastSeen > stored.lastSeen ? local.lastSeen : stored.lastSeen,
  };
}

/** Accepts only a record this version wrote, with values in range; anything else is treated as no record. */
export function parseAcquaintance(raw: string | null): Acquaintance | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Partial<Acquaintance>;
    const unit = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
    if (r.version !== VERSION || !unit(r.familiarity) || !unit(r.wariness)) return null;
    if (r.favouritePlace !== null && typeof r.favouritePlace !== 'string') return null;
    if (!Array.isArray(r.discovered) || !r.discovered.every((d) => typeof d === 'string')) return null;
    if (typeof r.lastSeen !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.lastSeen)) return null;
    const day = new Date(`${r.lastSeen}T00:00:00Z`);
    if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== r.lastSeen) return null;
    return {
      version: VERSION,
      familiarity: r.familiarity,
      wariness: r.wariness,
      favouritePlace: r.favouritePlace?.slice(0, 64) ?? null,
      discovered: r.discovered.slice(0, 32).map((d) => d.slice(0, 64)),
      lastSeen: r.lastSeen,
    };
  } catch {
    return null;
  }
}

/**
 * A store on window.localStorage, or on nothing when storage is blocked: every failure means "no memory", never a
 * broken page.
 */
export function browserMemory(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null): MemoryStore {
  return {
    load() {
      try { return parseAcquaintance(storage?.getItem(MEMORY_KEY) ?? null); } catch { return null; }
    },
    save(record) {
      if (!storage) return false;
      const raw = JSON.stringify(record);
      try {
        storage.setItem(MEMORY_KEY, raw);
        return storage.getItem(MEMORY_KEY) === raw && parseAcquaintance(raw) !== null;
      } catch { return false; }
    },
    forget() {
      if (!storage) return false;
      try { storage.removeItem(MEMORY_KEY); return storage.getItem(MEMORY_KEY) === null; } catch { return false; }
    },
  };
}

/** Days between two YYYY-MM-DD dates. */
function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000));
}

/**
 * What a returning visitor meets: familiarity kept, wariness settled by the
 * days away. No absence debt, no sulking.
 */
export function settleAcquaintance(record: Acquaintance, today: string): Acquaintance {
  const days = daysBetween(record.lastSeen, today);
  return {
    ...record,
    familiarity: record.familiarity,
    wariness: days >= 1 ? 0 : record.wariness * 0.5,
  };
}

/** Home alone records the new encounter day; a room's settled projection preserves the stored history. */
export function welcomeBack(record: Acquaintance, today: string): Acquaintance {
  return { ...settleAcquaintance(record, today), lastSeen: today };
}

/** Calm time together makes him more familiar; a minute of it is worth a little, an hour a lot, never more than 1. */
export function spendTime(record: Acquaintance, minutes: number, poked: boolean): Acquaintance {
  const gain = poked ? 0 : minutes * 0.01;
  return { ...record, familiarity: Math.min(1, record.familiarity + gain * (1 - record.familiarity)) };
}
