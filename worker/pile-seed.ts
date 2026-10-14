/**
 * The per-browser pile seed. The Worker reduces two headers every request already carries to a browser family with
 * its major version and the first preferred language, mixes them with the Berlin date, and hands one short hash to
 * the page. Used once to deal the pile; never stored, logged or sent anywhere. Reading device values in the
 * browser would be access to the device, which this deliberately avoids.
 */

const BROWSERS: ReadonlyArray<[name: string, pattern: RegExp]> = [
  ['Edge', /\bEdg(?:e|A|iOS)?\/(\d+)/],
  ['Opera', /\bOPR\/(\d+)/],
  ['Samsung', /\bSamsungBrowser\/(\d+)/],
  ['Firefox', /\b(?:Firefox|FxiOS)\/(\d+)/],
  ['Chrome', /\b(?:Chrome|CriOS)\/(\d+)/],
  ['Safari', /\bVersion\/(\d+)(?:\.\d+)*.*\bSafari\//],
];

/** "Chrome/131", "Firefox/132", or "other" when the browser isn't recognised. */
export function browserFamily(userAgent: string | null): string {
  if (!userAgent) return 'other';
  for (const [name, pattern] of BROWSERS) {
    const match = pattern.exec(userAgent);
    if (match) return `${name}/${match[1]}`;
  }
  return 'other';
}

/** The first language tag from Accept-Language, lower-cased: "de-de", "en". */
export function primaryLanguage(acceptLanguage: string | null): string {
  const first = acceptLanguage?.split(',')[0]?.split(';')[0]?.trim().toLowerCase();
  return first && /^[a-z]{1,8}(?:-[a-z0-9]{1,8})*$/.test(first) ? first : 'und';
}

export function berlinDate(at: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** FNV-1a over the three values, as base-36: short, stable, and not reversible to anything useful. */
export function pileSeed(request: Request, at: Date = new Date()): string {
  const input = `${browserFamily(request.headers.get('User-Agent'))}|${primaryLanguage(request.headers.get('Accept-Language'))}|${berlinDate(at)}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
