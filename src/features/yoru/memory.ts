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
  save(record: Acquaintance): void;
  /** Turn remembering off: the record is gone. */
  forget(): void;
}

export function newAcquaintance(today: string): Acquaintance {
  return { version: VERSION, familiarity: 0, wariness: 0, favouritePlace: null, discovered: [], lastSeen: today };
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
      try { storage?.setItem(MEMORY_KEY, JSON.stringify(record)); } catch { /* full or blocked: he simply forgets */ }
    },
    forget() {
      try { storage?.removeItem(MEMORY_KEY); } catch { /* nothing stored that we can reach */ }
    },
  };
}

/** Days between two YYYY-MM-DD dates. */
function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000));
}

/**
 * What a returning visitor meets: familiarity kept (it fades only very slowly over months), wariness settled by the
 * days away. No absence debt, no sulking.
 */
export function welcomeBack(record: Acquaintance, today: string): Acquaintance {
  const days = daysBetween(record.lastSeen, today);
  return {
    ...record,
    familiarity: Math.max(0, record.familiarity - Math.max(0, days - 30) * 0.002),
    wariness: days >= 1 ? 0 : record.wariness * 0.5,
    lastSeen: today,
  };
}

/** Calm time together makes him more familiar; a minute of it is worth a little, an hour a lot, never more than 1. */
export function spendTime(record: Acquaintance, minutes: number, poked: boolean): Acquaintance {
  const gain = poked ? 0 : minutes * 0.01;
  return { ...record, familiarity: Math.min(1, record.familiarity + gain * (1 - record.familiarity)) };
}
