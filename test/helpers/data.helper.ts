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

export function findFirstSpecialCharIndex(str: string, chars: string[]): number {
  let minIndex = -1;
  for (const char of chars) {
    const idx = str.indexOf(char);
    if (idx !== -1 && (minIndex === -1 || idx < minIndex)) {
      minIndex = idx;
    }
  }
  return minIndex;
}

export function normalizeProductName(rawProductData: string | null | undefined): string {
  if (!rawProductData) return '';

  // Split into lines
  const originalLines = rawProductData.split('\n');

  // Filter out marketing/brand lines
  const filteredLines = originalLines.filter((line) => {
    const trimmed = line?.trim();
    if (!trimmed) return false;

    // Condition 1: All-uppercase
    const isAllUpper = /^[A-Z0-9\s]+$/.test(trimmed);

    // Condition 2: Starts with special character (non-alphanumeric, Unicode-aware)
    const startsWithSpecialChar = /^[^\p{L}\p{N}]/u.test(trimmed);

    // Remove if marketing-like
    return !(isAllUpper || startsWithSpecialChar);
  });

  if (filteredLines.length === 0) {
    console.log('======filteredLines.isEmpty========');
    return '';
  }

  // Choose the line to normalize
  let productName: string;

  if (filteredLines.length >= 3) {
    // Case: 3 or more lines → always use the second line
    productName = filteredLines[1].toLowerCase().trim();
  } else if (filteredLines.length === 2) {
    const firstLine = filteredLines[0].toLowerCase().trim();
    const secondLine = filteredLines[1].toLowerCase().trim();

    const firstHasDigit = /\d/.test(firstLine);
    const secondHasDigit = /\d/.test(secondLine);

    if (firstHasDigit && !secondHasDigit) {
      // Case: Only the first line has digits → use the first line
      productName = firstLine;
    } else if (firstHasDigit && secondHasDigit) {
      // Case: Both lines have digits → use the second line
      productName = secondLine;
    } else if (!firstHasDigit && !secondHasDigit) {
      // Case: Neither line has digits → use the longer line
      productName = firstLine.length >= secondLine.length ? firstLine : secondLine;
    } else {
      // Fallback: use the second line
      productName = secondLine;
    }
  } else {
    // Case: Only one line available → use it directly
    productName = filteredLines[0].toLowerCase().trim();
  }

  let normalizedName = productName;

  // Remove if "and" exists, truncate at "and"
  const andIdx = normalizedName.indexOf(' and ');
  if (andIdx >= 0) {
    normalizedName = normalizedName.substring(0, andIdx).trim();
  }

  // Remove leading "galaxy"
  if (normalizedName.startsWith('galaxy ')) {
    normalizedName = normalizedName.replace(/^galaxy\s*/, '');
  }

  // Remove memory info like 128GB, 1TB, 16 Go
  normalizedName = normalizedName.replace(/\d+(gb|tb|go)\b/i, '');

  // Remove trailing "..." or "…"
  normalizedName = normalizedName.replace(/(…|\.{3}).*$/, '');

  // Truncate at first special delimiter
  const cutIndex = findFirstSpecialCharIndex(normalizedName, ['(', ',', '-', ':']);
  if (cutIndex > -1) {
    normalizedName = normalizedName.substring(0, cutIndex);
  }

  // Remove all whitespace and trim
  normalizedName = normalizedName.replace(/[\s\u00A0]+/g, '').trim();

  console.log('[normalizeProductName] Normalized productName:', normalizedName);

  return normalizedName;
}
