import { getRunConfig, getSpecsForTestType } from './config/run.config';
import { loadSite } from './config/site';
import { reportTestResult } from './test/helpers/report.helper';

const runConfig = getRunConfig();

if (runConfig.siteCode === 'ALL') {
  throw new Error(
    'SITE=ALL requires the work-queue runner. Set siteCode to one code in config/run.config.ts (e.g. DE).'
  );
}

if (runConfig.reportDb && !runConfig.releaseName) {
  throw new Error(
    'releaseName is required when reportDb is enabled. Set it in config/run.config.ts or pass --release Rxx'
  );
}

const siteData = loadSite(runConfig.siteCode);

console.log(
  `[run] site=${runConfig.siteCode} testType=${runConfig.testType} env=${runConfig.environment} ` +
    `releaseName=${runConfig.releaseName || '(none)'} reportDb=${runConfig.reportDb} ` +
    `package=${siteData.appPackage} udid=${runConfig.udid || '(auto)'} ` +
    `appiumPort=${runConfig.appiumPort} systemPort=${runConfig.systemPort} ` +
    `chromedriverPort=${runConfig.chromedriverPort}`
);

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: getSpecsForTestType(runConfig.testType),
  maxInstances: 1,
  port: runConfig.appiumPort,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:appPackage': siteData.appPackage,
      'appium:appActivity': siteData.appActivity,
      'appium:noReset': true,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240,
      'appium:autoWebview': false,
      'appium:autoLaunch': false,
      'appium:systemPort': runConfig.systemPort,
      'appium:chromedriverPort': runConfig.chromedriverPort,
      ...(runConfig.udid ? { 'appium:udid': runConfig.udid } : {}),
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
          port: runConfig.appiumPort,
          relaxedSecurity: true,
        },
      },
    ],
  ],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 240000,
  },
  before: async (_capabilities, specs) => {
    if (specs.length === 1 && specs[0].includes('_call-api.spec.ts')) {
      return;
    }
    await driver.activateApp(siteData.appPackage);
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
