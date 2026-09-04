import { currentSiteCode } from './tc-filter.helper';

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

/** lowercase, strip everything but letters/digits — for comparing values with inconsistent spacing/punctuation. */
// stripToAlnum("512 GB | 12 GB") -> "512gb12gb" / stripToAlnum("512GB") + stripToAlnum("12GB") -> same string
export function stripToAlnum(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** "256GB" | "256 GB" | "256 Go" → amount + gb/tb/mb. */
export function parseStorageSize(raw: string): { amount: string; unit: 'gb' | 'tb' | 'mb' } | undefined {
  const match = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(gb|tb|mb|go|to)\b/i);
  if (!match) {
    return undefined;
  }
  const unitRaw = match[2].toLowerCase();
  const unit = unitRaw === 'go' || unitRaw === 'gb' ? 'gb' : unitRaw === 'to' || unitRaw === 'tb' ? 'tb' : 'mb';
  return { amount: match[1], unit };
}

/** CSS / display variants: spaced or not, GB↔Go, TB↔To. */
export function storageLabelVariants(raw: string): string[] {
  const parsed = parseStorageSize(raw);
  if (!parsed) {
    const compact = raw.replace(/\s+/g, '');
    return [...new Set([raw.trim(), compact])];
  }
  const units = parsed.unit === 'gb' ? ['GB', 'Go'] : parsed.unit === 'tb' ? ['TB', 'To'] : ['MB'];
  const variants: string[] = [];
  for (const unit of units) {
    variants.push(`${parsed.amount}${unit}`, `${parsed.amount} ${unit}`);
  }
  return variants;
}

/** Unify FR Go/To with GB/TB after stripping spaces/punctuation. */
export function normalizeStorageAlnum(text: string): string {
  return stripToAlnum(text).replace(/go/g, 'gb').replace(/to/g, 'tb');
}

/** Summary/chip text may be "256 GB", "256GB", or "256 Go". */
export function storageCapacityMatches(actual: string, expected: string): boolean {
  const a = normalizeStorageAlnum(actual);
  const b = normalizeStorageAlnum(expected);
  return Boolean(a) && Boolean(b) && (a.includes(b) || b.includes(a));
}

type ColorMap = Record<string, string>;

/** Per-site color name overrides. "common" applies to both device types; "watch"/"mobile" override it. */
const SITE_COLOR_MAPS: Record<string, { common?: ColorMap; watch?: ColorMap; mobile?: ColorMap }> = {
  SE: { common: { 'Titanium Silverblue': 'Titanium Silverblue' } },
  CN: { watch: { Black: '月陨黑', White: '星系白', Silver: '远空银', Graphite: '岩影灰', Cream: '云凝白' } },
  TW: { common: { Jetblack: 'Jet Black', Coralred: 'Coral Red' } },
  IT: { common: { Jetblack: 'Jet black', Coralred: 'Coral Red' } },
  CL: { common: { 'Silver Shadow': 'Silver  Shadow', Silver: 'Plata', Black: 'Negro' } },
  HK: { watch: { Graphite: '黑', Silver: '銀', White: '白', Black: '黑' } },
  PL: {
    common: { Lavender: 'Levander' },
    watch: { Graphite: 'Grafitowy', Silver: 'Srebrny', Black: 'Czarny', White: 'Biały', Cream: 'Kremowy' },
  },
  CA_FR: {
    common: { Cream: 'cream' },
    watch: { Black: 'Noir', White: 'Blanc', Silver: 'Argenté' },
  },
  ES: { watch: { Graphite: 'Gris Oscuro', Silver: 'Plateado', Black: 'Negro', White: 'Blanco' } },
  FR: {
    watch: { Silver: 'Argent', Black: 'Noir', White: 'Blanc', Cream: 'Crème' },
  },
  PT: { watch: { Graphite: 'Grafite', Silver: 'Prateado', Black: 'Preto', White: 'Branco', Cream: 'Creme' } },
  MX: { watch: { Graphite: 'Grafito', Silver: 'Plata' } },
  TR: { watch: { Silver: 'Gümüş', Graphite: 'Koyu Gri', Black: 'Siyah', White: 'Beyaz' } },
};

/**
 * Watch Ultra (SM-L7 SKUs) has its own color-naming scheme, unrelated to SITE_COLOR_MAPS above.
 * "default" always applies first — every site needs the short→full name expansion below, even
 * sites with no further override — then a site entry, if any, overrides on top of it.
 */
const WATCH_ULTRA_COLOR_MAPS: Record<string, ColorMap> = {
  default: {
    'Absolute White': 'Titanium White',
    Gray: 'Titanium Gray',
    Blue: 'Titanium Blue',
    Silver: 'Titanium Silver',
  },
  // Both "Gray" and the already-expanded "Titanium Gray" are mapped since our data stores the
  // expanded form, but keep the raw short form covered too.
  AU: { 'Titanium Gray': 'Titanium Grey', Gray: 'Titanium Grey' },
  UK: { 'Titanium Gray': 'Titanium Grey' },
  CN: {
    'Absolute White': '钛瓷白',
    Gray: '钛岩灰',
    Blue: '钛屿蓝',
    Silver: '钛铂银',
    'Titanium Silver': '钛霜银',
    'Titanium Gray': '钛影灰',
  },
  HK: { 'Absolute White': '鈦金白', Gray: '鈦金灰', Blue: '鈦金藍', Silver: '鈦金銀' },
  CA_FR: {
    Gray: 'Gris titane',
    Blue: 'Bleu titane',
    Silver: 'Argenté titane',
    'Titanium Silver': 'Argent titane',
    'Titanium Gray': 'Gris titane',
  },
  ES: {
    'Absolute White': 'Blanco Titanio',
    Blue: 'Azul Titanio',
    Silver: 'Plateado Titanio',
    'Titanium Gray': 'Gris Titanio',
    'Titanium Silver': 'Plateado Titanio',
  },
  PL: {
    'Absolute White': 'Tytanowy biały',
    Gray: 'Tytanowy szary',
    Blue: 'Tytanowy niebieski',
    Silver: 'Tytanowy srebrny',
    'Titanium Gray': 'Tytanowy szary',
    'Titanium Silver': 'Tytanowy srebrny',
  },
  FR: {
    'Absolute White': 'Blanc Titane',
    Gray: 'Gris Titane',
    Blue: 'Bleu Titane',
    Silver: 'Argent Titane',
    'Titanium Gray': 'Noir Titane',
    'Titanium Silver': 'Argent Titane',
  },
  PT: {
    'Absolute White': 'Branco Titânio',
    Gray: 'Cinzento',
    Blue: 'Azul Titânio',
    Silver: 'Prateado',
    'Titanium Gray': 'Cinzento',
    'Titanium Silver': 'Prateado',
  },
  SG: { 'Titanium Gray': 'Titanium Grey', Gray: 'Titanium Grey' },
  MX: { Gray: 'Gris Titanio', Blue: 'Azul Titanio', Silver: 'Plata Titanio' },
  TR: { Gray: 'Gri Titanyum', Blue: 'Mavi Titanyum', Silver: 'Titanyum' },
};

function isWatchUltraSku(sku: string): boolean {
  return sku.toUpperCase().includes('SM-L7');
}

function mergeColorMaps(...maps: (ColorMap | undefined)[]): ColorMap {
  return Object.assign({}, ...maps);
}

/** Maps a raw binding color (e.g. "Gray") to what's actually shown on screen for this site/device/SKU. */
export function resolveDisplayColor(
  color: string,
  sku: string,
  deviceKind: 'phone' | 'watch',
  site: string = currentSiteCode()
): string {
  const siteCode = site.toUpperCase();

  if (isWatchUltraSku(sku)) {
    const map = mergeColorMaps(WATCH_ULTRA_COLOR_MAPS.default, WATCH_ULTRA_COLOR_MAPS[siteCode]);
    return map[color] ?? color;
  }

  const siteMap = SITE_COLOR_MAPS[siteCode];
  const deviceType = deviceKind === 'watch' ? 'watch' : 'mobile';
  const map = mergeColorMaps(siteMap?.common, siteMap?.[deviceType]);
  return map[color] ?? color;
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
