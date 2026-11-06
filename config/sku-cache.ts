import fs from 'node:fs';
import path from 'node:path';
import { getRunConfig } from './run.config';

/** Product family used by search/SKU resolution and the local cache. */
export type ProductType = 'IM' | 'VD' | 'HA';

/** IM includes color/name/storage; VD/HA only need a sku. */
export interface ResolvedProduct {
  sku: string;
  color?: string;
  name?: string;
  storage?: string;
}

export type ResolvedSkuCache = Partial<Record<ProductType, ResolvedProduct>>;

/**
 * Per site+device cache under config/cache (gitignored).
 * Parallel runs with different --udid do not share a file, so writers do not collide.
 * Falls back to data/sites-data/{SITE}.json when missing/empty.
 */
const CACHE_DIR = path.join(__dirname, 'cache');

function sanitizeUdid(udid: string): string {
  return udid.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/** One file per site + udid. No udid → "auto" (single-device / auto-pick). */
function cacheFilePath(siteCode: string, udid?: string): string {
  const site = siteCode.toUpperCase();
  const device = sanitizeUdid((udid ?? getRunConfig().udid ?? 'auto').trim() || 'auto');
  return path.join(CACHE_DIR, `resolved-sku.${site}.${device}.json`);
}

function readCacheFile(filePath: string): ResolvedSkuCache {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ResolvedSkuCache;
  } catch {
    return {};
  }
}

function writeCacheFile(filePath: string, data: ResolvedSkuCache): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function getResolvedSkuCache(siteCode: string): ResolvedSkuCache {
  return readCacheFile(cacheFilePath(siteCode));
}

export function writeResolvedSkuEntry(siteCode: string, type: ProductType, product: ResolvedProduct): void {
  const filePath = cacheFilePath(siteCode);
  const current = readCacheFile(filePath);
  writeCacheFile(filePath, { ...current, [type]: product });
}
