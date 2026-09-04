import fs from 'node:fs';
import path from 'node:path';
import { ShopCategory } from '../locators/shop.locator';
import { PfCardQuery } from '../pages/pf.page';
import { SelectedDisplayValues } from '../pages/bc.page';
import { CartItemOptions } from '../pages/cart.page';

const SKUS_DIR = path.join(__dirname, '../../data/flagship-data/skus');

export type FlagshipPhoneProduct = {
  kind: 'phone';
  sku: string;
  deviceName: string;
  color: string;
  storage: string;
  ram: string;
  isPFDefaultSKU: boolean;
};

export type FlagshipWatchProduct = {
  kind: 'watch';
  sku: string;
  deviceName: string;
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

export function toShopCategory(product: FlagshipProduct): ShopCategory {
  return product.kind === 'watch' ? 'watch' : 'mobile';
}

/** Watch Ultra PF cards only show the product name, no separate connectivity/caseSize cards. */
function isWatchUltra(deviceName: string): boolean {
  return deviceName.toLowerCase().includes('ultra');
}

export function toPfCardQuery(product: FlagshipProduct): PfCardQuery {
  if (product.kind === 'watch' && !isWatchUltra(product.deviceName)) {
    return {
      mode: 'watch',
      device: product.deviceName,
      connectivity: product.connectivity,
      caseSize: product.caseSize,
    };
  }
  return { mode: 'exact', product: product.deviceName };
}

/** BC summary options to compare against cart. `selected` falls back to product data when unset (e.g. watch PD). */
export function getSummaryOptions(
  product: FlagshipProduct,
  selected: SelectedDisplayValues | undefined
): CartItemOptions {
  if (product.kind === 'watch') {
    return {
      device: selected?.device ?? product.deviceName,
      connectivity: selected?.connectivity ?? product.connectivity,
      caseSize: selected?.caseSize ?? product.caseSize,
      color: selected?.color ?? product.color,
    };
  }
  return {
    device: selected?.device ?? product.deviceName,
    storage: product.storage, // cart shows capacity only, never BC's combined "256 GB｜12 GB" text
    color: selected?.color ?? product.color,
  };
}
