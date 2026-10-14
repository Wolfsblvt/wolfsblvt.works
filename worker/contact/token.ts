/**
 * Signed form-issue token. The Worker stamps the contact page with `<issuedAt>.<hmac>` when it serves the
 * form; a submission must carry it back unchanged. That proves the form was rendered by this deployment
 * and lets the Worker enforce a minimum interaction time without any stored state.
 */
import { LIMITS } from '../../shared/contact-contract';

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function issueFormToken(secret: string, now = Date.now()): Promise<string> {
  const issuedAt = String(now);
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(issuedAt));
  return `${issuedAt}.${toHex(signature)}`;
}

export type TokenVerdict =
  | { ok: true; issuedAt: number; ageMs: number }
  | { ok: false; reason: 'missing' | 'malformed' | 'bad-signature' | 'too-fast' | 'expired' };

export async function verifyFormToken(secret: string, token: string | null, now = Date.now()): Promise<TokenVerdict> {
  if (!token) return { ok: false, reason: 'missing' };
  const parts = token.split('.');
  if (parts.length !== 2 || !/^\d{1,16}$/.test(parts[0] ?? '') || !/^[0-9a-f]{64}$/.test(parts[1] ?? '')) {
    return { ok: false, reason: 'malformed' };
  }
  const [issuedAtText, signatureHex] = parts as [string, string];
  const signature = new Uint8Array(signatureHex.match(/.{2}/g)!.map((pair) => parseInt(pair, 16)));
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), signature, encoder.encode(issuedAtText));
  if (!valid) return { ok: false, reason: 'bad-signature' };

  const issuedAt = Number(issuedAtText);
  const ageMs = now - issuedAt;
  if (ageMs < LIMITS.minimumInteractionMs) return { ok: false, reason: 'too-fast' };
  if (ageMs > LIMITS.maximumFormAgeMs) return { ok: false, reason: 'expired' };
  return { ok: true, issuedAt, ageMs };
}
