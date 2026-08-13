import fs from 'node:fs';
import path from 'node:path';
import tcExclusionsFile from './tc-exclusions.json';

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

/** Default feature flags. Site JSON may override only differences. */
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
 * Site test data = config/sites/{SITE}.json
 * Features = DEFAULT_SITE_FEATURES + sites/{SITE}.json features override
 * Exclusions = config/tc-exclusions.json
 */
export interface Site {
  siteCode: string;
  countryName?: string;
  phoneCountryCode?: string;
  searchApiPath?: string;
  features?: SiteFeatures;
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
}

export type LoadedSite = Site & {
  apkRegion: ApkRegion;
  appPackage: string;
  appActivity: string;
  features: SiteFeatures;
  excludedTcs: string[];
};

const SITES_DIR = path.join(__dirname, 'sites');

type ExclusionFile = {
  _comment?: string;
  [siteCode: string]: string[] | string | undefined;
};

const exclusionFile = tcExclusionsFile as ExclusionFile;

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

export function resolveFeatures(siteJsonFeatures?: SiteFeatures): SiteFeatures {
  return {
    ...DEFAULT_SITE_FEATURES,
    ...(siteJsonFeatures ?? {}),
  };
}

function resolveExcludedTcs(siteCode: string, siteJsonExcluded?: string[]): string[] {
  const raw = exclusionFile[siteCode];
  const fromFile = Array.isArray(raw) ? raw : [];
  const merged = [...fromFile, ...(siteJsonExcluded ?? [])];
  return [...new Set(merged)];
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

  return {
    ...data,
    siteCode: code,
    apkRegion,
    appPackage: apkIdentity.packageName,
    appActivity: apkIdentity.activity,
    features: resolveFeatures(data.features),
    excludedTcs: resolveExcludedTcs(code, data.excludedTcs),
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
