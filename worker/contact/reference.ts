/**
 * Human-readable submission reference: `WW-YYYYMMDD-XXXXX`. Carried in both emails, the browser outcome
 * and the log line so a person can relate them without a database. Not a secret and not unique by
 * construction; five base32 characters make an accidental collision on one day very unlikely.
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'; // no I, L, O, U, 0, 1 to keep it readable aloud

export function createReference(now = new Date(), random: (bytes: number) => Uint8Array = randomBytes): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const bytes = random(5);
  let suffix = '';
  for (const byte of bytes) suffix += ALPHABET[byte % ALPHABET.length];
  return `WW-${date}-${suffix}`;
}

export const REFERENCE_PATTERN = /^WW-\d{8}-[A-Z2-9]{5}$/;

function randomBytes(count: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(count));
}
