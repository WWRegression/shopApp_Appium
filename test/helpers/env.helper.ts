/**
 * Test environment helpers (Katalon TestEnvContext / API URL 대응).
 *
 * Flagship UAT     → environment: stg  (WDS 로그인, stg URL)
 * Flagship PostUnpack → environment: prod
 */
import { getRunConfig, type AppEnvironment, type TestType } from '../../config/run.config';
import { getApkRegion } from '../../config/site';

export function currentTestType(): TestType {
  return getRunConfig().testType;
}

export function currentEnvironment(): AppEnvironment {
  return getRunConfig().environment;
}

export function isFlagshipTest(): boolean {
  return currentTestType() === 'flagship';
}

/** Katalon TestEnvContext.isStgEnvironment() */
export function isStgEnvironment(): boolean {
  return currentEnvironment() === 'stg';
}

/** Flagship + STG (UAT) */
export function isFlagshipStg(): boolean {
  return isFlagshipTest() && isStgEnvironment();
}

/**
 * Shop web base URL (product info API 등).
 * Katalon API.isSkuInfoAvailable baseUrl 대응.
 */
export function getShopBaseUrl(siteCode = getRunConfig().site): string {
  const code = siteCode.toLowerCase();
  if (isStgEnvironment()) {
    if (code === 'cn') {
      // CN STG URL — Katalon 주석상 업데이트 필요. 당분간 CDN 유지.
      return 'https://p1-smz-api-cdn.shop.samsung.com.cn';
    }
    return 'https://stg2.shop.samsung.com';
  }

  if (code === 'cn') {
    return 'https://p1-smz-api-cdn.shop.samsung.com.cn';
  }
  return 'https://shop.samsung.com';
}

/**
 * Product search/API host (Katalon API.getProductAPIBase 참고).
 * 현재 Katalon STG/PROD 모두 api.shop.samsung.com 을 쓰는 구간이 있어 host는 동일.
 * Shop HTML/simple product API는 getShopBaseUrl() 사용.
 */
export function getProductApiBase(siteCode = getRunConfig().site): string {
  const region = getApkRegion(siteCode);
  if (region === 'CN') {
    return 'https://p1-smz-api-cdn.shop.samsung.com.cn';
  }
  return 'https://api.shop.samsung.com';
}

export function getSimpleProductInfoUrl(
  sku: string,
  siteCode = getRunConfig().site
): string {
  const base = getShopBaseUrl(siteCode);
  const code = siteCode.toLowerCase();
  return `${base}/${code}/servicesv2/getSimpleProductsInfo?productCodes=${encodeURIComponent(sku)}`;
}
