import fs from 'node:fs';
import path from 'node:path';
import tcExclusionsFile from './tc-exclusions.json';
import siteFeaturesFile from './site-features.json';
import { getResolvedSkuCache } from '../test/helpers/product-api.helper';

export type ApkRegion = 'CN' | 'IN' | 'US' | 'GLOBAL';

/** Package + Activity는 APK region 단위로 함께 관리 (Katalon Launch.groovy 대응). */
export interface AppIdentity {
  packageName: string;
  activity: string;
}

export const appIdentityByRegion: Record<ApkRegion, AppIdentity> = {
  CN: {
    packageName: 'com.jv.samsungeshop',
    activity: 'com.samsung.ecomm.global.shop_app.MainActivity',
  },
  IN: {
    packageName: 'com.samsung.ecomm.global.in',
    activity: 'com.samsung.ecomm.global.shop_app.MainActivity',
  },
  US: {
    packageName: 'com.samsung.ecomm',
    // Katalon: com.samsung.ecomm/.global.shop_app.MainActivity
    activity: 'com.samsung.ecomm.global.shop_app.MainActivity',
  },
  GLOBAL: {
    packageName: 'com.samsung.ecomm.global.gbr',
    activity: 'com.samsung.ecomm.global.shop_app.MainActivity',
  },
};

/** @deprecated use getAppIdentity().packageName — 호환용 */
export const appPackageMap: Record<ApkRegion, string> = {
  CN: appIdentityByRegion.CN.packageName,
  IN: appIdentityByRegion.IN.packageName,
  US: appIdentityByRegion.US.packageName,
  GLOBAL: appIdentityByRegion.GLOBAL.packageName,
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
  apkRegion: ApkRegion;
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

export function getApkRegion(siteCode: string): ApkRegion {
  const code = siteCode.toUpperCase();
  if (code === 'CN' || code === 'IN' || code === 'US') {
    return code;
  }
  return 'GLOBAL';
}

export function getAppIdentity(siteCode: string): AppIdentity {
  return appIdentityByRegion[getApkRegion(siteCode)];
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

export function loadSite(siteCode: string): LoadedSite {
  const code = siteCode.toUpperCase();
  const filePath = path.join(SITES_DIR, `${code}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Site data not found: ${code} (${filePath})`);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Site;
  const apkRegion = getApkRegion(code);
  const apkIdentity = getAppIdentity(code);
  const resolvedCache = getResolvedSkuCache(code);

  return {
    ...data,
    siteCode: code,
    apkRegion,
    appPackage: apkIdentity.packageName,
    appActivity: apkIdentity.activity,
    searchApiPath: resolveSearchApiPath(code),
    features: resolveFeatures(code),
    excludedTcs: resolveExcludedTcs(code, data.excludedTcs),
    product: resolveProduct(resolvedCache, data.product),
    search: resolveSearch(resolvedCache, data.search),
  };
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
