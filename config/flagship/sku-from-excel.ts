import fs from 'node:fs';
import path from 'node:path';

const CSV_PATH = path.join(__dirname, 'Products.csv');
const OUT_DIR = path.join(__dirname, 'skus');

const WATCH_CASE_SIZE: Record<string, string> = {
  'SM-L32': '40mm',
  'SM-L33': '44mm',
  'SM-L50': '46mm',
  'SM-L70': '47mm',
  'SM-L34': '40mm',
  'SM-L35': '44mm',
  'SM-L71': '47mm',
};

export type FlagshipPhoneProduct = {
  kind: 'phone';
  sku: string;
  device: string;
  color: string;
  storage: string;
  ram: string;
  isPFDefaultSKU: boolean;
};

export type FlagshipWatchProduct = {
  kind: 'watch';
  sku: string;
  device: string;
  color: string;
  caseSize: string;
  connectivity: string;
  isBespokeSKU: boolean;
  isPFDefaultSKU: boolean;
};

export type FlagshipProduct = FlagshipPhoneProduct | FlagshipWatchProduct;

export type FlagshipSkuFile = {
  siteCode: string;
  products: FlagshipProduct[];
};

type CsvRow = Record<string, unknown>;

function cell(row: CsvRow, ...names: string[]): string {
  const keys = Object.keys(row);
  for (const name of names) {
    const key = keys.find((k) => k.toLowerCase().replace(/\s+/g, '') === name.toLowerCase());
    if (key === undefined) {
      continue;
    }
    return String(row[key] ?? '').trim();
  }
  return '';
}

function isWatchSku(sku: string): boolean {
  return sku.toUpperCase().startsWith('SM-L');
}

function isPfDefault(raw: string): boolean {
  const v = raw.trim().toUpperCase();
  return v === 'O' || v === 'Y' || v === 'YES' || v === 'TRUE' || v === '1';
}

/** 4th character from the end is 1 / 2 / A → not bespoke. e.g. SM-L340NZEAEUB */
function isBespokeWatchSku(sku: string): boolean {
  if (sku.length < 4) {
    return true;
  }
  const ch = sku.charAt(sku.length - 4).toUpperCase();
  return !['1', '2', 'A'].includes(ch);
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return [];
  }
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const row: CsvRow = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = (cols[i] ?? '').trim();
    }
    return row;
  });
}

function caseSizeFromWatchSku(sku: string): string {
  const prefix = sku.slice(0, 6).toUpperCase();
  const size = WATCH_CASE_SIZE[prefix];
  if (!size) {
    throw new Error(`Unknown watch SKU prefix "${prefix}" (${sku})`);
  }
  return size;
}

function toProduct(row: CsvRow): { siteCode: string; product: FlagshipProduct } | undefined {
  const sku = cell(row, 'SKU').toUpperCase();
  if (!sku) {
    return undefined;
  }

  const siteCode = cell(row, 'Site').toUpperCase();
  if (!siteCode) {
    throw new Error(`Row missing Site (sku=${sku})`);
  }

  const device = cell(row, 'Device');
  const color = cell(row, 'Color');
  const isPFDefaultSKU = isPfDefault(cell(row, 'isDefault', 'isPFDefaultSKU'));

  if (isWatchSku(sku)) {
    return {
      siteCode,
      product: {
        kind: 'watch',
        sku,
        device,
        color,
        caseSize: caseSizeFromWatchSku(sku),
        connectivity: cell(row, 'Connectivity') || cell(row, 'Storage'),
        isPFDefaultSKU,
        isBespokeSKU: isBespokeWatchSku(sku),
      },
    };
  }

  return {
    siteCode,
    product: {
      kind: 'phone',
      sku,
      device,
      color,
      storage: cell(row, 'Storage'),
      ram: cell(row, 'RAM'),
      isPFDefaultSKU,
    },
  };
}

export function convertProductsCsv(csvPath = CSV_PATH, outDir = OUT_DIR): FlagshipSkuFile[] {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));

  const bySite = new Map<string, FlagshipProduct[]>();
  for (const row of rows) {
    const parsed = toProduct(row);
    if (!parsed) {
      continue;
    }
    const list = bySite.get(parsed.siteCode) ?? [];
    list.push(parsed.product);
    bySite.set(parsed.siteCode, list);
  }

  fs.mkdirSync(outDir, { recursive: true });
  for (const file of fs.readdirSync(outDir)) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(outDir, file));
    }
  }

  const files: FlagshipSkuFile[] = [];
  for (const siteCode of [...bySite.keys()].sort()) {
    const payload: FlagshipSkuFile = { siteCode, products: bySite.get(siteCode) ?? [] };
    files.push(payload);
    const outPath = path.join(outDir, `${siteCode}.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`[flagship-sku] ${siteCode}: ${payload.products.length} products → ${outPath}`);
  }

  return files;
}

const isCliEntry = (process.argv[1] ?? '').replace(/\\/g, '/').includes('sku-from-excel');
if (isCliEntry) {
  convertProductsCsv();
}
