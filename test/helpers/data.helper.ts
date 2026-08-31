// "$1,234.56" -> 1234.56
export function parsePriceToNumber(priceText: string): number {
  const normalized = priceText.replace(/[^0-9.-]/g, '');
  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? 0 : value;
}

// 1234.56 -> "$1,234.56"
export function formatNumberToPrice(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/** lowercase, unify apostrophe variants, collapse whitespace. */
// "  Samsung's  Galaxy " -> "samsung's galaxy"
export function normalizeText(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[‘’‚‛′`´'ʼ`]/g, "'")
    .replace(/\s+/g, ' ');
}

/** Words that must NOT immediately follow a match (e.g. "Galaxy S26" ≠ "Galaxy S26 Ultra"). */
const TOKEN_EXTENSION_WORDS = new Set([
  'ultra', 'fe', 'plus', '+', 'classic', 'edge', 'pro', 'max', 'slim', 'flip', 'fold',
  'ألترا', 'الترا', 'إف', 'إي',
]);

const TOKEN_BOUNDARIES = new Set([' ', ',', '\n', '\t', '(', ')', '-', '–', '—', '|', '·', '•']);

/** target must appear in text as a whole token, not as a prefix of a longer name. */
// isExactTokenMatch("galaxy s26 ultra", "galaxy s26") -> false / isExactTokenMatch("galaxy s26", "galaxy s26") -> true
export function isExactTokenMatch(text: string, target: string): boolean {
  if (!text || !target) return false;

  const idx = text.indexOf(target);
  if (idx < 0) return false;

  if (idx > 0 && !TOKEN_BOUNDARIES.has(text[idx - 1])) return false;

  const end = idx + target.length;
  if (end === text.length) return true;
  if (!TOKEN_BOUNDARIES.has(text[end])) return false;

  const nextToken = text.slice(end).trim().split(/[\s\-–—,(|·•]+/)[0] ?? '';
  if (!nextToken) return true;
  if (/^\d/.test(nextToken) || /^\p{Sc}/u.test(nextToken)) return true;
  return !TOKEN_EXTENSION_WORDS.has(nextToken.toLowerCase());
}

/** Removes a marker substring (and surrounding parens) from text. */
// stripMarkerText("galaxy z fold8 (samsung.com only)", "samsung.com only") -> "galaxy z fold8"
export function stripMarkerText(text: string, marker: string): string {
  if (!text || !marker) return text ?? '';
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text
    .replace(new RegExp(`\\(?\\s*${escaped}\\s*\\)?`, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
