import { getRunConfig, getSpecsForTestType } from './config/run.config';
import { loadSite } from './config/site';
import { reportTestResult } from './test/helpers/report.helper';

const run = getRunConfig();
const siteCode = run.site;
const testType = run.testType;
const environment = run.environment;

if (siteCode === 'ALL') {
  throw new Error(
    'SITE=ALL requires the work-queue runner. Set site to one code in config/run.config.ts (e.g. DE).'
  );
}

if (run.reportDb && !run.releaseName) {
  throw new Error(
    'releaseName is required when reportDb is enabled. Set it in config/run.config.ts or pass --release Rxx'
  );
}

const site = loadSite(siteCode);

console.log(
  `[run] site=${siteCode} testType=${testType} env=${environment} ` +
    `releaseName=${run.releaseName || '(none)'} reportDb=${run.reportDb} ` +
    `package=${site.appPackage}`
);

export const config: WebdriverIO.Config = {
  runner: 'local',

  specs: getSpecsForTestType(testType),
  exclude: [],

  maxInstances: 1,

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:appPackage': site.appPackage,
      'appium:appActivity': site.appActivity,
      'appium:noReset': true,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240,
      'appium:autoWebview': false,
    } as WebdriverIO.Capabilities,
  ],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: [
    [
      'appium',
      {
        args: {
          relaxedSecurity: true,
        },
      },
    ],
  ],

  framework: 'mocha',

  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },

  before: async () => {
    await driver.activateApp(site.appPackage);
},
  /**
   * Katalon ReportHandler AFTER_TEST_CASE 대응.
   * reportDb=true 일 때만 업로드 (접속 정보는 db.helper.ts).
   */
  afterTest: async function (test, _context, result) {
    const parentTitle =
      typeof test.parent === 'string'
        ? test.parent
        : (test.parent as { title?: string } | undefined)?.title;

    await reportTestResult({
      title: test.title,
      parent: parentTitle,
      passed: result.passed,
      skipped: Boolean(
        result.error?.message?.toLowerCase().includes('skipped') ||
          (test as { pending?: boolean }).pending
      ),
      error: result.error,
    });
  },
};
