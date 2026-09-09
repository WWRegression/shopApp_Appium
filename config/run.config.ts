/**
 * 실행 설정. 우선순위: CLI > env > defaults
 *
 * TEST_TYPE / APP_ENV는 npm script의 cross-env로 전달됩니다.
 *
 *   npm run test:flagship:uat -- --site DE --release 30RC1_SENH
 *   npm run test:sanity -- --udid R5CTxxxx --appium-port 4725 --system-port 8201 --chromedriver-port 9516
 */
export type TestType = 'sanity' | 'phase3' | 'flagship';

/** Flagship UAT = stg, PostUnpack = prod. Sanity/Phase3는 보통 prod. */
export type AppEnvironment = 'stg' | 'prod';

export interface RunConfig {
  site: string;
  testType: TestType;
  environment: AppEnvironment;
  releaseName: string;
  reportDb: boolean;
  /** UAT(stg): false → 장바구니 불가 시 Planned. true → Fail. */
  flagshipSetupDone: boolean;
  /** 생략 시 연결된 기기 중 하나. 여러 대면 필수. */
  udid?: string;
  appiumPort: number;
  systemPort: number;
  chromedriverPort: number;
}

/** 매 리그레이션마다 releaseName만 갱신하면 됩니다. */
const defaults: RunConfig = {
  site: 'AU',
  testType: 'sanity',
  environment: 'prod',
  releaseName: '30RC1_SENH',
  reportDb: false,
  flagshipSetupDone: false,
  appiumPort: 4723,
  systemPort: 8200,
  chromedriverPort: 9515,
};

function readArg(argv: string[], name: string): string | undefined {
  const long = `--${name}`;
  const eqPrefix = `${long}=`;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === long) {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        return next;
      }
      return undefined;
    }
    if (token.startsWith(eqPrefix)) {
      return token.slice(eqPrefix.length);
    }
  }
  return undefined;
}

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(`--${name}`);
}

function parseTestType(raw?: string): TestType | undefined {
  if (!raw) return undefined;
  const value = raw.toLowerCase();
  if (value === 'sanity' || value === 'phase3' || value === 'flagship') {
    return value;
  }
  throw new Error(`Unsupported TEST_TYPE: ${raw}`);
}

function parseEnvironment(raw?: string): AppEnvironment | undefined {
  if (!raw) return undefined;
  const value = raw.toLowerCase();
  if (value === 'stg' || value === 'stage' || value === 'staging') return 'stg';
  if (value === 'prod' || value === 'production') return 'prod';
  throw new Error(`Unsupported APP_ENV / --env: ${raw} (use stg|prod)`);
}

function parsePort(raw: string | undefined, flag: string): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Invalid ${flag}: ${raw} (use 1–65535)`);
  }
  return value;
}

function parseEnvFlag(raw?: string): boolean | undefined {
  if (raw === undefined || raw === '') return undefined;
  return raw.toLowerCase() === 'true';
}

function defaultEnvironmentFor(testType: TestType): AppEnvironment {
  return testType === 'flagship' ? 'stg' : 'prod';
}

let cached: RunConfig | undefined;

export function getRunConfig(): RunConfig {
  if (cached) {
    return cached;
  }

  const argv = process.argv;
  const cliReportDb = hasFlag(argv, 'report-db')
    ? true
    : hasFlag(argv, 'no-report-db')
      ? false
      : undefined;

  const testType = parseTestType(process.env.TEST_TYPE) ?? defaults.testType;
  const environment =
    parseEnvironment(readArg(argv, 'env') ?? process.env.APP_ENV) ?? defaultEnvironmentFor(testType);

  cached = {
    site: (readArg(argv, 'site') ?? process.env.SITE ?? defaults.site).trim().toUpperCase(),
    testType,
    environment,
    releaseName: (
      readArg(argv, 'release') ??
      readArg(argv, 'release-name') ??
      process.env.RELEASE_NAME ??
      defaults.releaseName
    ).trim(),
    reportDb: cliReportDb ?? parseEnvFlag(process.env.REPORT_DB) ?? defaults.reportDb,
    flagshipSetupDone:
      hasFlag(argv, 'setup-done') ||
      parseEnvFlag(process.env.FLAGSHIP_SETUP_DONE) === true ||
      defaults.flagshipSetupDone,
    udid: (readArg(argv, 'udid') ?? process.env.UDID)?.trim() || undefined,
    appiumPort:
      parsePort(readArg(argv, 'appium-port') ?? process.env.APPIUM_PORT, '--appium-port') ??
      defaults.appiumPort,
    systemPort:
      parsePort(readArg(argv, 'system-port') ?? process.env.SYSTEM_PORT, '--system-port') ??
      defaults.systemPort,
    chromedriverPort:
      parsePort(readArg(argv, 'chromedriver-port') ?? process.env.CHROMEDRIVER_PORT, '--chromedriver-port') ??
      defaults.chromedriverPort,
  };

  return cached;
}

export function getSpecsForTestType(testType: TestType): string[] {
  if (testType === 'flagship') {
    return ['./test/specs/flagship/**/*.ts'];
  }
  return ['./test/specs/regression/**/*.ts'];
}
