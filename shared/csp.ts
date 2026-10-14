/**
 * The site's Content-Security-Policy. Scripts run only from this origin or as the exact inline scripts a page ships,
 * pinned by hash; the contact page additionally allows Turnstile, the one third-party script on the site. Used by
 * the Worker for the pages it serves and by scripts/write-headers.mjs for every static page.
 */
export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

/** Executable inline scripts in an HTML document (JSON data blocks don't execute and need no hash). */
export function inlineScripts(html: string): string[] {
  const out: string[] = [];
  for (const match of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    if (/\ssrc=/.test(attrs) || !body) continue;
    const type = /\stype="([^"]+)"/.exec(attrs)?.[1];
    if (type && type !== 'module' && type !== 'text/javascript') continue;
    out.push(body);
  }
  return out;
}

export async function sha256Base64(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function scriptHashes(html: string): Promise<string[]> {
  return Promise.all(inlineScripts(html).map(async (body) => `'sha256-${await sha256Base64(body)}'`));
}

export function contentSecurityPolicy(hashes: readonly string[], options: { turnstile?: boolean } = {}): string {
  const turnstile = options.turnstile ? ` ${TURNSTILE_ORIGIN}` : '';
  return [
    "default-src 'self'",
    `script-src 'self'${hashes.length ? ` ${hashes.join(' ')}` : ''}${turnstile}`,
    `frame-src ${options.turnstile ? TURNSTILE_ORIGIN : "'none'"}`,
    `connect-src 'self'${turnstile}`,
    // Inline style attributes carry measured geometry (the Walk, the Pile); styles never execute.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "form-action 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}
