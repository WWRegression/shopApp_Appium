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
  /** US carrier chip from sku-from-csv (XAA/VZW/ATT/XAU). */
  connectivity?: string;
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

/** Cart line fields aligned with BC verifyOptionFields (sku checked separately via verifySku). */
export function toCartItemOptions(
  product: FlagshipProduct,
  selected?: SelectedDisplayValues
): CartItemOptions {
  if (product.kind === 'watch') {
    return {
      deviceName: selected?.device ?? product.deviceName,
      color: selected?.color ?? product.color,
      caseSize: selected?.caseSize ?? product.caseSize,
      connectivity: selected?.connectivity ?? product.connectivity,
    };
  }
  return {
    deviceName: selected?.device ?? product.deviceName,
    color: selected?.color ?? product.color,
    storage: product.storage, // cart shows capacity only, not BC "256 GB｜12 GB"
    ...(product.connectivity || selected?.connectivity
      ? { connectivity: selected?.connectivity ?? product.connectivity }
      : {}),
  };
}

export function getSummaryOptions(
  product: FlagshipProduct,
  selected: SelectedDisplayValues | undefined
): CartItemOptions {
  return toCartItemOptions(product, selected);
}
