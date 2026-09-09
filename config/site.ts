import fs from 'node:fs';
import path from 'node:path';
import tcExclusionsFile from './tc-exclusions.json';
import siteFeaturesFile from './site-features.json';
import { getRunConfig } from './run.config';
import { getResolvedSkuCache } from '../test/helpers/product-api.helper';

export interface AppIdentity {
  packageName: string;
  activity: string;
}

/** 사이트별 APK. CN/IN/US가 아니면 GLOBAL. */
export const appBySite: Record<'CN' | 'IN' | 'US' | 'GLOBAL', AppIdentity> = {
  CN: { packageName: 'com.jv.samsungeshop', activity: 'com.jv.samsungeshop.MainActivity' },
  IN: { packageName: 'com.samsung.ecomm.global.in', activity: 'com.samsung.ecomm.global.shop_app.MainActivity' },
  US: { packageName: 'com.samsung.ecomm', activity: 'com.samsung.ecomm.global.shop_app.MainActivity' },
  GLOBAL: { packageName: 'com.samsung.ecomm.global.gbr', activity: 'com.samsung.ecomm.global.shop_app.MainActivity' },
};

export type SiteFeatureName =
  | 'tradeIn'
  | 'tradeUp'
  | 'scPlus'
  | 'eup'
  | 'sim'
  | 'rewards'
  | 'wishlist';

export type SiteFeatures = Partial<Record<SiteFeatureName, boolean>>;

/** Default feature flags. site-features.json may override only differences. */
export const DEFAULT_SITE_FEATURES: Required<SiteFeatures> = {
  tradeIn: true,
  tradeUp: true,
  scPlus: true,
  eup: false,
  sim: false,
  rewards: true,
  wishlist: true,
};

/**
 * Site fixtures = data/sites-data/{SITE}.json
 * Features / searchApiPath = DEFAULT_* + config/site-features.json
 * Exclusions = config/tc-exclusions.json
 */
export interface Site {
  siteCode: string;
  countryName?: string;
  phoneCountryCode?: string;
  excludedTcs?: string[];
  menus?: Record<string, boolean>;
  customer: {
    firstName: string;
    lastName?: string;
    email: string;
    mobile: string;
    birthYear?: string;
    documentType?: string;
    documentNumber?: string;
  };
  shipping: {
    address1: string;
    address2?: string;
    apartment?: string;
    district?: string;
    landmark?: string;
    postalCode?: string;
    town?: string;
    searchText?: string;
  };
  product: {
    sku: string;
    deviceName: string;
    color: string;
    storage: string;
  };
  search: {
    keyword: string;
    haSku?: string;
    vdSku?: string;
  };
  tradeIn?: {
    brand?: string;
    category?: string;
    model?: string;
    subseries?: string;
    device?: string;
    storage?: string;
    color?: string;
    screenSize?: string;
    imei?: string;
    zipCode?: string;
    purchaseFrom?: string;
  };
  tradeUp?: {
    postalCode?: string;
  };
  checkout?: {
    fiscalCode?: string;
    iban?: string;
    eupImei?: string;
  };
  mypageMenuList?: {
    support?: boolean;
    policy?: boolean;
    settings?: boolean;
    accountManagement?: boolean;
    logout?: boolean;
  };
  shopMenuList?: {
    samsungEducationStore?: boolean;
    samsungGovermentStore?: boolean;
    moreSamsungApps?: boolean;
    support?: boolean;
    country?: boolean;
  };
}

export type LoadedSite = Site & {
  appPackage: string;
  appActivity: string;
  searchApiPath: string;
  features: SiteFeatures;
  excludedTcs: string[];
};

const SITES_DIR = path.join(__dirname, '../data/sites-data');
const DEFAULT_SEARCH_API_PATH = 'global';

type ExclusionFile = {
  _comment?: string;
  [siteCode: string]: string[] | string | undefined;
};

type SiteFeaturesOverride = {
  searchApiPath?: string;
  features?: SiteFeatures;
};

type SiteFeaturesFile = {
  _comment?: string;
  [siteCode: string]: SiteFeaturesOverride | string | undefined;
};

const exclusionFile = tcExclusionsFile as ExclusionFile;
const featuresFile = siteFeaturesFile as SiteFeaturesFile;

function getSiteFeaturesOverride(siteCode: string): SiteFeaturesOverride {
  const raw = featuresFile[siteCode];
  if (!raw || typeof raw === 'string') {
    return {};
  }
  return raw;
}

export function getAppIdentity(siteCode: string): AppIdentity {
  const code = siteCode.toUpperCase();
  if (code === 'CN' || code === 'IN' || code === 'US') {
    return appBySite[code];
  }
  return appBySite.GLOBAL;
}

export function getAppPackage(siteCode: string): string {
  return getAppIdentity(siteCode).packageName;
}

export function getAppActivity(siteCode: string): string {
  return getAppIdentity(siteCode).activity;
}

export function resolveFeatures(siteCode: string): SiteFeatures {
  return {
    ...DEFAULT_SITE_FEATURES,
    ...(getSiteFeaturesOverride(siteCode).features ?? {}),
  };
}

export function resolveSearchApiPath(siteCode: string): string {
  return getSiteFeaturesOverride(siteCode).searchApiPath ?? DEFAULT_SEARCH_API_PATH;
}

function resolveExcludedTcs(siteCode: string, siteJsonExcluded?: string[]): string[] {
  const raw = exclusionFile[siteCode];
  const fromFile = Array.isArray(raw) ? raw : [];
  const merged = [...fromFile, ...(siteJsonExcluded ?? [])];
  return [...new Set(merged)];
}

/** Overlays the cached IM product onto the static value, only when every field resolved. */
function resolveProduct(
  cache: ReturnType<typeof getResolvedSkuCache>,
  staticProduct: Site['product']
): Site['product'] {
  const im = cache.IM;
  if (im?.sku && im.color && im.name && im.storage) {
    return { sku: im.sku, deviceName: im.name, color: im.color, storage: im.storage };
  }
  return staticProduct;
}

function resolveSearch(
  cache: ReturnType<typeof getResolvedSkuCache>,
  staticSearch: Site['search']
): Site['search'] {
  return {
    ...staticSearch,
    vdSku: cache.VD?.sku ?? staticSearch.vdSku,
    haSku: cache.HA?.sku ?? staticSearch.haSku,
  };
}

const loadedSites = new Map<string, LoadedSite>();

function loadSiteJson(siteCode: string): LoadedSite {
  const code = siteCode.toUpperCase();
  const cached = loadedSites.get(code);
  if (cached) {
    return cached;
  }

  const filePath = path.join(SITES_DIR, `${code}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Site data not found: ${code} (${filePath})`);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Site;
  const site: LoadedSite = {
    ...data,
    siteCode: code,
    appPackage: getAppPackage(code),
    appActivity: getAppActivity(code),
    searchApiPath: resolveSearchApiPath(code),
    features: resolveFeatures(code),
    excludedTcs: resolveExcludedTcs(code, data.excludedTcs),
  };
  loadedSites.set(code, site);
  return site;
}

/** JSON SKU 위에 `_call-api` 캐시가 있으면 덮어 반환합니다. */
function withResolvedSku(site: LoadedSite): LoadedSite {
  const skuCache = getResolvedSkuCache(site.siteCode);
  return {
    ...site,
    product: resolveProduct(skuCache, site.product),
    search: resolveSearch(skuCache, site.search),
  };
}

/** 파일을 읽어 메모리에 올립니다. wdio.conf 시작 시 한 번 호출합니다. */
export function loadSite(siteCode: string): LoadedSite {
  return withResolvedSku(loadSiteJson(siteCode));
}

/**
 * 이미 로드된 현재 실행 사이트. JSON은 다시 읽지 않습니다.
 * (워커에서 아직 loadSite가 안 불렸으면 그때 한 번 로드합니다.)
 */
export function getSiteData(): LoadedSite {
  return loadSite(getRunConfig().siteCode);
}

export function listSiteCodes(): string[] {
  return fs
    .readdirSync(SITES_DIR)
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .map((name) => path.basename(name, '.json'))
    .sort();
}

/** Official regression target sites (43). */
export const REGRESSION_SITE_CODES = [
  'AT', 'ES', 'HU', 'IT', 'SE', 'PT', 'FR', 'NL', 'BE', 'BE_FR', 'CZ', 'PL', 'RO', 'UK', 'DE',
  'AE', 'AE_AR', 'SA', 'SA_EN', 'TR', 'IN', 'IL', 'ZA',
  'AU', 'JP', 'HK', 'HK_EN', 'ID', 'MY', 'NZ', 'PH', 'SG', 'TH', 'TW', 'VN', 'CN',
  'CL', 'CO', 'MX', 'PE', 'CA', 'CA_FR', 'US',
] as const;

export function listRegressionSiteCodes(): string[] {
  return [...REGRESSION_SITE_CODES];
}

export function resolveSiteCodes(siteEnv?: string): string[] {
  if (!siteEnv || siteEnv.trim() === '' || siteEnv.trim().toUpperCase() === 'ALL') {
    return listRegressionSiteCodes();
  }

  return siteEnv
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code.length > 0)
    .map((code) => {
      loadSite(code);
      return code;
    });
}
