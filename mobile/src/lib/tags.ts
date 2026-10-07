/**
 * Plant tag helpers.
 *
 * Botanists identify plants by the physical tag wired to the stem, which carries
 * a printed QR encoding the same code. The code is therefore treated as the
 * human-facing identity of a plant: short, uppercase and free of characters
 * that are easily confused when written by hand or read aloud (no I, L, O, U).
 */

const TAG_PREFIX = 'PLT';

// Crockford-style alphabet: digits plus unambiguous uppercase letters.
const TAG_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TAG_BODY_LENGTH = 6;

export const TAG_LABEL = 'Plant tag';

/** Uppercases, trims and collapses whitespace into single dashes. */
export function normalizeTag(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-');
}

export function isValidTag(tag: string): boolean {
  return /^[A-Z0-9][A-Z0-9-]{2,31}$/.test(tag);
}

/** Generates a writable tag such as PLT-7F3K92. */
export function generateTag(): string {
  let body = '';
  for (let i = 0; i < TAG_BODY_LENGTH; i += 1) {
    body += TAG_ALPHABET[Math.floor(Math.random() * TAG_ALPHABET.length)];
  }
  return `${TAG_PREFIX}-${body}`;
}
