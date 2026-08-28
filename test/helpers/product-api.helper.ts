import fs from 'node:fs';
import path from 'node:path';
import { LoadedSite, SiteFeatureName } from '../../config/site';
import { testCaseCatalog } from '../../config/test-case.catalog';

/**
 * Resolves a valid, in-stock sku per site and product type via Samsung's product APIs.
 * Public API: resolveProduct() + getTypesForSite() — everything else here is internal.
 */

export type ProductType = 'IM' | 'VD' | 'HA';

// === 1) Per-type config ===

const CATEGORY_CODE_BY_TYPE: Record<ProductType, string> = {
  IM: '01010000',
  VD: '04010000',
  HA: '08030000',
};

const STOCK_THRESHOLD_BY_TYPE: Record<ProductType, number> = {
  IM: 5,
  VD: 3,
  HA: 3,
};

const SEARCH_COUNT_BY_TYPE: Record<ProductType, { topN: number; perFamily: number }> = {
  IM: { topN: 2, perFamily: 2 },
  VD: { topN: 5, perFamily: 2 },
  HA: { topN: 10, perFamily: 1 },
};

const SERVICE_FEATURES_BY_TYPE: Record<ProductType, SiteFeatureName[]> = {
  IM: ['tradeIn', 'scPlus', 'sim', 'eup'],
  VD: ['tradeUp'],
  HA: [],
};

const PRODUCT_API_BASE = 'https://api.shop.samsung.com/tokocommercewebservices/v2';
const SEARCH_API_BASE = 'https://searchapi.samsung.com/v6/front/b2c/product/';

// === 2) API response shapes ===

interface SearchModelItem {
  modelCode: string;
  stockStatusText?: string;
}

interface SearchProductItem {
  familyRecord?: string | number;
  fmyEngName?: string;
  categorySubTypeEngName?: string;
  modelList?: SearchModelItem[];
}

interface ProductInfoResponse {
  stock?: { stockLevel?: number };
  salesStatus?: string;
  addedServices?: string[];
  supportedAvailableServices?: string[];
}

interface ProductCardChipOption {
  fmyChipType?: string;
  optionTypeName?: string;
  optionList?: Array<{ optionName?: string }>;
}

interface ProductCard {
  fmyEngName?: string;
  chipOptions?: ProductCardChipOption[];
}

/** IM includes color/name/storage; VD/HA only need a sku. */
export interface ResolvedProduct {
  sku: string;
  color?: string;
  name?: string;
  storage?: string;
}

/** From the SIMPLE_INFO endpoint — no name/color/storage, see fetchImInfo. */
interface SkuStatus {
  sku: string;
  stockLevel: number;
  salesStatus?: string;
  services: Set<SiteFeatureName>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Product API call failed (${res.status}): ${url}`);
  }
  return res.json() as Promise<T>;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// === 3) Search & candidate selection ===

async function searchProducts(site: LoadedSite, type: ProductType, num = 48): Promise<SearchProductItem[]> {
  const siteCode = site.siteCode.toLowerCase();
  const searchPath = site.searchApiPath ?? siteCode;
  const url =
    `${SEARCH_API_BASE}finder/${searchPath}?type=${CATEGORY_CODE_BY_TYPE[type]}&siteCode=${siteCode}` +
    `&start=1&num=${num}&sort=recommended&onlyFilterInfoYN=N&keySummaryYN=Y`;
  const data = await fetchJson<{ response?: { resultData?: { productList?: SearchProductItem[] } } }>(url);
  return data.response?.resultData?.productList ?? [];
}

/** Numeric familyRecord only, excludes Galaxy A / *FE / F-prefix bundles, sorted ascending. */
function getTopFamilies(productList: SearchProductItem[], topN: number): SearchProductItem[] {
  return productList
    .filter((item) => {
      const familyRecord = String(item.familyRecord ?? '').trim();
      const subType = (item.categorySubTypeEngName ?? '').trim().toLowerCase();
      const familyName = (item.fmyEngName ?? '').trim();
      if (!/^\d+$/.test(familyRecord)) return false;
      if (subType.startsWith('galaxy a')) return false;
      if (familyName.endsWith('FE')) return false;
      if ((item.modelList ?? []).some((m) => m.modelCode?.startsWith('F-'))) return false;
      return true;
    })
    .sort((a, b) => Number(a.familyRecord) - Number(b.familyRecord))
    .slice(0, topN);
}

function getRandomInStockSkus(productList: SearchProductItem[], topN: number, perFamily: number): string[] {
  const needCount = topN * perFamily;
  const skuList: string[] = [];
  const used = new Set<string>();
  const families = getTopFamilies(productList, topN + 3);

  for (const family of families) {
    if (skuList.length >= needCount) break;
    const available = shuffle(
      (family.modelList ?? []).filter((m) =>
        ['instock', 'preorder'].includes((m.stockStatusText ?? '').toLowerCase())
      )
    );

    let count = 0;
    for (const model of available) {
      if (skuList.length >= needCount) break;
      if (!used.has(model.modelCode)) {
        skuList.push(model.modelCode);
        used.add(model.modelCode);
        count += 1;
        if (count >= perFamily) break;
      }
    }
  }
  return shuffle(skuList).slice(0, needCount);
}

function normalizeServices(raw: string[] | undefined): SiteFeatureName[] {
  const result = new Set<SiteFeatureName>();
  for (const service of raw ?? []) {
    const cleaned = service?.trim().toUpperCase();
    if (!cleaned) continue;
    if (['TRADE_IN', 'TRADE-IN', 'TRADEIN'].includes(cleaned)) result.add('tradeIn');
    else if (cleaned === 'INSURANCE' || cleaned.includes('SC')) result.add('scPlus');
    else if (cleaned.includes('SIM')) result.add('sim');
    else if (cleaned.includes('UPGRADE') || cleaned.includes('EUP')) result.add('eup');
    else if (['TRADE_UP', 'TRADE-UP', 'TRADEUP'].includes(cleaned)) result.add('tradeUp');
  }
  return [...result];
}

/** A service counts only if a catalog TC requires it and site.features allows it. */
function getExpectedServices(site: LoadedSite, type: ProductType): SiteFeatureName[] {
  const usedInCatalog = new Set(testCaseCatalog.flatMap((tc) => tc.requiresFeatures ?? []));
  return SERVICE_FEATURES_BY_TYPE[type].filter((f) => usedInCatalog.has(f) && site.features[f] !== false);
}

/** True when the sku has no active AEM "Warranty" add-on. */
async function hasNoWarrantyAddOn(site: LoadedSite, type: 'VD' | 'HA', sku: string): Promise<boolean> {
  const siteCode = site.siteCode.toLowerCase();
  const queryType = type === 'VD' ? 'DISPLAY_ON_PDP' : 'ACCESSORIES';
  const url =
    `https://shop.samsung.com/${siteCode}/servicesv2/getRelatedCategorizedProductsSimpleInfo` +
    `?productCode=${encodeURIComponent(sku)}&queryType=${queryType}`;
  const list = await fetchJson<Array<{ category?: { id?: string } }>>(url).catch(() => []);
  return list.length === 0 || !list.some((item) => item.category?.id?.includes('Warranty'));
}

async function fetchSkuStatus(site: LoadedSite, sku: string): Promise<SkuStatus> {
  const siteCode = site.siteCode.toLowerCase();
  const url = `${PRODUCT_API_BASE}/${siteCode}/products/${sku}?fields=SIMPLE_INFO`;
  const data = await fetchJson<ProductInfoResponse>(url);
  const services = new Set([
    ...normalizeServices(data.addedServices),
    ...normalizeServices(data.supportedAvailableServices),
  ]);
  return { sku, stockLevel: data.stock?.stockLevel ?? 0, salesStatus: data.salesStatus, services };
}

/**
 * Picks the first sku (caller orders the current sku first, so it's kept when still valid)
 * with enough stock and the right services. Falls back to the first in-stock sku otherwise.
 */
async function findValidSku(site: LoadedSite, type: ProductType, skuList: string[]): Promise<string | undefined> {
  const expected = getExpectedServices(site, type);
  const threshold = STOCK_THRESHOLD_BY_TYPE[type];
  const candidates = await Promise.all(skuList.map((sku) => fetchSkuStatus(site, sku).catch(() => null)));

  let fallback: string | undefined;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.stockLevel < threshold || candidate.salesStatus === 'ARCHIVED') continue;
    if (!fallback) fallback = candidate.sku;

    if (type === 'IM') {
      if (expected.every((service) => candidate.services.has(service))) {
        return candidate.sku;
      }
      continue;
    }

    const hasExpectedService = expected.length === 0 || expected.some((s) => candidate.services.has(s));
    if (!hasExpectedService) continue;
    if (await hasNoWarrantyAddOn(site, type, candidate.sku)) {
      return candidate.sku;
    }
  }
  return fallback;
}

// === 4) IM detail lookup (color/name/storage) ===

function parseStorage(raw: string): string {
  const matches = [...raw.matchAll(/(\d+)\s*([gt]b)/gi)];
  if (!matches.length) return '';
  const sizes = matches.map((m) => ({
    size: m[2].toLowerCase() === 'tb' ? Number(m[1]) * 1024 : Number(m[1]),
    text: `${m[1]}${m[2].toUpperCase()}`,
  }));
  return sizes.reduce((max, cur) => (cur.size > max.size ? cur : max)).text;
}

function parseDeviceName(raw: string): string {
  const pattern =
    /Galaxy(?:\s+[A-Za-z0-9+-]+)*\s+(S\d+\+?|Z\d+\+?|Fold\d*\+?|Flip\d*\+?|A\d+\+?|Ultra|FE|\+|\d+\+?)(?:\s+Edge)?(?!\w)/i;
  const match = raw.match(pattern);
  return match ? match[0].replace(/\s+/g, ' ').trim() : raw;
}

/** Separate call since SIMPLE_INFO doesn't include color/name/storage. */
async function fetchImInfo(site: LoadedSite, sku: string): Promise<ResolvedProduct> {
  const siteCode = site.siteCode.toLowerCase();
  const searchPath = site.searchApiPath ?? siteCode;
  const url =
    `${SEARCH_API_BASE}card/detail/${searchPath}?siteCode=${siteCode}&modelList=${sku}` +
    `&saleSkuYN=N&onlyRequestSkuYN=Y&vd3PACardYN=Y&commonCodeYN=N`;
  const data = await fetchJson<{ response?: { resultData?: { productList?: ProductCard[] } } }>(url);
  const product = data.response?.resultData?.productList?.[0];

  const rawName = product?.fmyEngName ?? '';
  const color =
    product?.chipOptions?.find((o) => (o.fmyChipType ?? '').toLowerCase() === 'color')
      ?.optionList?.[0]?.optionName ?? '';
  const rawStorage =
    product?.chipOptions?.find((o) => ['storage', 'memory'].includes((o.optionTypeName ?? '').toLowerCase()))
      ?.optionList?.[0]?.optionName ?? '';

  return { sku, color, name: parseDeviceName(rawName), storage: parseStorage(rawStorage) };
}

// === 5) Public API ===

function getCurrentSkuFor(site: LoadedSite, type: ProductType): string | undefined {
  if (type === 'IM') return site.product.sku;
  if (type === 'VD') return site.search.vdSku;
  return site.search.haSku;
}

/** Resolves a fresh, valid sku for the site+type, preferring the current sku when still valid. */
export async function resolveProduct(site: LoadedSite, type: ProductType): Promise<ResolvedProduct | undefined> {
  const productList = await searchProducts(site, type);
  const { topN, perFamily } = SEARCH_COUNT_BY_TYPE[type];
  const candidateSkus = getRandomInStockSkus(productList, topN, perFamily);

  const current = getCurrentSkuFor(site, type);
  const skuList = current ? [current, ...candidateSkus] : candidateSkus;

  const validSku = await findValidSku(site, type, skuList);
  if (!validSku) return undefined;

  return type === 'IM' ? fetchImInfo(site, validSku) : { sku: validSku };
}

/** JP only ever searches IM. */
export function getTypesForSite(siteCode: string): ProductType[] {
  return siteCode.toUpperCase() === 'JP' ? ['IM'] : ['IM', 'VD', 'HA'];
}

/** Live re-check right before a TC runs — just "still purchasable", looser than resolveProduct(). */
export async function isSkuInStock(site: LoadedSite, sku: string): Promise<boolean> {
  const status = await fetchSkuStatus(site, sku);
  return status.stockLevel >= 1 && status.salesStatus !== 'ARCHIVED';
}

// === 6) Local cache (config/cache/resolved-sku.json) ===

/**
 * Local cache of resolved products (config/cache, gitignored), keyed by site then type:
 * { AU: { IM, VD, HA }, DE: {...} }. Falls back to sites/{SITE}.json — see site.ts.
 */
const CACHE_FILE = path.join(__dirname, '..', '..', 'config', 'cache', 'resolved-sku.json');

export type ResolvedSkuCache = Partial<Record<ProductType, ResolvedProduct>>;
type CacheFile = Record<string, ResolvedSkuCache>;

function readCacheFile(): CacheFile {
  if (!fs.existsSync(CACHE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as CacheFile;
  } catch {
    return {};
  }
}

function writeCacheFile(data: CacheFile): void {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function getResolvedSkuCache(siteCode: string): ResolvedSkuCache {
  return readCacheFile()[siteCode.toUpperCase()] ?? {};
}

export function writeResolvedSkuEntry(siteCode: string, type: ProductType, product: ResolvedProduct): void {
  const all = readCacheFile();
  const code = siteCode.toUpperCase();
  all[code] = { ...all[code], [type]: product };
  writeCacheFile(all);
}
