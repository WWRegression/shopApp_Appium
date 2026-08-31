import fs from 'node:fs';
import path from 'node:path';

const SKUS_DIR = path.join(__dirname, '../../data/flagship-data/skus');

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

let cache: Map<string, FlagshipProduct[]> | undefined;

/** Flagship products for a site (`data/flagship-data/skus/{SITE}.json`). Missing file → []. */
export function loadFlagshipProducts(siteCode: string): FlagshipProduct[] {
  const code = siteCode.toUpperCase();
  if (!cache) {
    cache = new Map();
  }
  const cached = cache.get(code);
  if (cached) {
    return cached;
  }

  const filePath = path.join(SKUS_DIR, `${code}.json`);
  if (!fs.existsSync(filePath)) {
    cache.set(code, []);
    return [];
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8')) as FlagshipSkuFile;
  const products = payload.products ?? [];
  cache.set(code, products);
  return products;
}
