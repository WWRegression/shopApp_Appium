import { getRunConfig, getSpecsForTestType } from './config/run.config';
import { loadSite } from './config/site';
import { reportTestResult } from './test/helpers/report.helper';

const run = getRunConfig();

if (run.site === 'ALL') {
  throw new Error(
    'SITE=ALL requires the work-queue runner. Set site to one code in config/run.config.ts (e.g. DE).'
  );
}

if (run.reportDb && !run.releaseName) {
  throw new Error(
    'releaseName is required when reportDb is enabled. Set it in config/run.config.ts or pass --release Rxx'
  );
}

const site = loadSite(run.site);

console.log(
  `[run] site=${run.site} testType=${run.testType} env=${run.environment} ` +
    `releaseName=${run.releaseName || '(none)'} reportDb=${run.reportDb} ` +
    `package=${site.appPackage} udid=${run.udid || '(auto)'} ` +
    `appiumPort=${run.appiumPort} systemPort=${run.systemPort} ` +
    `chromedriverPort=${run.chromedriverPort}`
);

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: getSpecsForTestType(run.testType),
  maxInstances: 1,
  port: run.appiumPort,
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
      'appium:autoLaunch': false,
      'appium:systemPort': run.systemPort,
      'appium:chromedriverPort': run.chromedriverPort,
      ...(run.udid ? { 'appium:udid': run.udid } : {}),
    } as WebdriverIO.Capabilities,
  ],
  logLevel: 'warn',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: [
    [
      'appium',
      {
        args: {
          port: run.appiumPort,
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
  before: async (_capabilities, specs) => {
    if (specs.length === 1 && specs[0].includes('_call-api.spec.ts')) {
      return;
    }
    await driver.activateApp(site.appPackage);
  },
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
