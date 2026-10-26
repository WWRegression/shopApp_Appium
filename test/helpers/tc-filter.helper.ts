import { getRunConfig } from '../../config/run.config';
import { getSiteData, loadSite, LoadedSite } from '../../config/site';
import { setCurrentTc, takeRecordedFailures } from './report.helper';
import {
  TestCaseMeta,
  TestSuite,
  getTestCaseMeta,
  listTestCasesForSuite,
} from '../../config/test-case.catalog';

export function currentSiteCode(): string {
  return getRunConfig().siteCode;
}

export function currentSuite(): TestSuite {
  return getRunConfig().testType;
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

  // Not in this suite: skipped without a DB row
  if (!meta.suites.includes(currentSuite())) {
    setCurrentTc(tcId, false);
    this.skip();
  }

  // From here every outcome is uploaded; a site exclusion is reported as N/A
  setCurrentTc(tcId);
  const site = getSiteData();
  if (!shouldRunTestCase(site, meta)) {
    this.skip();
  }

  // Failures recorded by markFailed fail the TC once its steps are done
  takeRecordedFailures();
  try {
    await fn(site, meta);
  } catch (error) {
    const recorded = takeRecordedFailures();
    if (recorded.length === 0) {
      throw error;
    }
    throw new Error([...recorded, (error as Error).message].join(' / '), { cause: error as Error });
  }
  const recorded = takeRecordedFailures();
  if (recorded.length > 0) {
    throw new Error(recorded.join(' / '));
  }
}

export function getRunnableTestCases(
  suite: TestSuite = currentSuite(),
  siteCode: string = currentSiteCode()
): TestCaseMeta[] {
  const site = loadSite(siteCode);
  return listTestCasesForSuite(suite).filter((meta) => shouldRunTestCase(site, meta));
}
