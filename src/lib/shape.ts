/**
 * Small deterministic helpers shared by the Walk, the Pile and the header. They run both at build time and in the
 * browser, so they stay free of DOM access.
 */

/** A 32-bit seeded generator. Visual variety only; never use it for anything that needs to be unpredictable. */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over UTF-16 code units: a stable 32-bit key for seeding. */
export function hashString(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const round1 = (n: number): number => Math.round(n * 10) / 10;
export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

/** Monotonic quintic ease with zero speed at both ends: the authored curve for every eased journey on the site. */
export const easeQuint = (t: number): number => t * t * t * (10 + t * (-15 + 6 * t));

/** Catmull-Rom points to a smooth cubic Bézier path. */
export function smoothPath(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length < 2) return '';
  const first = points[0]!;
  let d = `M${round1(first[0])} ${round1(first[1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    d +=
      ` C${round1(p1[0] + (p2[0] - p0[0]) / 6)} ${round1(p1[1] + (p2[1] - p0[1]) / 6)}` +
      ` ${round1(p2[0] - (p3[0] - p1[0]) / 6)} ${round1(p2[1] - (p3[1] - p1[1]) / 6)}` +
      ` ${round1(p2[0])} ${round1(p2[1])}`;
  }
  return d;
}

/** The calendar date in Europe/Berlin as `YYYY-MM-DD`, independent of the visitor's own time zone. */
export function berlinDateKey(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
