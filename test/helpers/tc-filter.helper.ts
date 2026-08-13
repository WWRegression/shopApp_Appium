import { getRunConfig } from '../../config/run.config';
import { loadSite, LoadedSite, SiteFeatureName } from '../../config/site';
import {
  TestCaseMeta,
  TestSuite,
  getTestCaseMeta,
  listTestCasesForSuite,
} from '../../config/test-case.catalog';

export function currentSiteCode(): string {
  return getRunConfig().site;
}

export function currentSuite(): TestSuite {
  return getRunConfig().testType;
}

export function getSite(): LoadedSite {
  return loadSite(currentSiteCode());
}

function isFeatureEnabled(site: LoadedSite, feature: SiteFeatureName): boolean {
  return site.features[feature] !== false;
}

export function shouldRunTestCase(siteCode: string, meta: TestCaseMeta): boolean {
  const site = loadSite(siteCode);

  if (site.excludedTcs.includes(meta.tcId)) {
    return false;
  }

  if (meta.requiresFeatures) {
    for (const feature of meta.requiresFeatures) {
      if (!isFeatureEnabled(site, feature)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Mocha helper:
 *   runOrSkip.call(this, 'PROD_BUY_01', async (site) => { ... })
 */
export async function runOrSkip(
  this: Mocha.Context,
  tcId: string,
  fn: (site: LoadedSite, meta: TestCaseMeta) => Promise<void>
): Promise<void> {
  const meta = getTestCaseMeta(tcId);
  const siteCode = currentSiteCode();

  if (!meta.suites.includes(currentSuite())) {
    this.skip();
  }

  if (!shouldRunTestCase(siteCode, meta)) {
    this.skip();
  }

  await fn(getSite(), meta);
}

export function getRunnableTestCases(
  suite: TestSuite = currentSuite(),
  siteCode: string = currentSiteCode()
): TestCaseMeta[] {
  return listTestCasesForSuite(suite).filter((meta) => shouldRunTestCase(siteCode, meta));
}
