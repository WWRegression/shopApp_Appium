import { getRunConfig } from '../../config/run.config';
import { loadSite, LoadedSite } from '../../config/site';
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

export function shouldRunTestCase(site: LoadedSite, meta: TestCaseMeta): boolean {
  if (site.excludedTcs.includes(meta.tcId)) {
    return false;
  }

  if (meta.requiresFeatures) {
    for (const feature of meta.requiresFeatures) {
      if (site.features[feature] === false) {
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

  if (!meta.suites.includes(currentSuite())) {
    this.skip();
  }

  const site = getSite();
  if (!shouldRunTestCase(site, meta)) {
    this.skip();
  }

  await fn(site, meta);
}

export function getRunnableTestCases(
  suite: TestSuite = currentSuite(),
  siteCode: string = currentSiteCode()
): TestCaseMeta[] {
  const site = loadSite(siteCode);
  return listTestCasesForSuite(suite).filter((meta) => shouldRunTestCase(site, meta));
}
