/**
 * 실행 설정 (Katalon GlobalVariable.SITE / ReleaseName / Environment 대응).
 *
 * 우선순위: CLI > env(선택) > defaults
 * TEST_TYPE / APP_ENV는 npm script의 cross-env로 전달됩니다.
 *
 * 예:
 *   npm run test:sanity
 *   npm run test:sanity -- --site DE --release 30RC1_SENH
 *   npm run test:phase3 -- --site=US --release 30RC1_SENH --report-db
 *   npm run test:flagship:uat -- --site DE --release 30RC1_SENH
 *   npm run test:flagship:postunpack -- --site=US --release 30RC1_SENH --report-db
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
}

/** 여기만 고쳐도 실행됩니다. (매 리그레이션마다 releaseName 갱신) */
const defaults: RunConfig = {
  site: 'AU',
  testType: 'sanity',
  environment: 'prod',
  releaseName: '30RC1_SENH',
  reportDb: false,
  flagshipSetupDone: false,
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

function parseEnvFlag(raw?: string): boolean | undefined {
  if (raw === undefined || raw === '') return undefined;
  return raw.toLowerCase() === 'true';
}

function defaultEnvironmentFor(testType: TestType): AppEnvironment {
  // Flagship default = UAT(STG). Sanity/Phase3 = PROD.
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
  const environment = parseEnvironment(readArg(argv, 'env') ?? process.env.APP_ENV) ?? defaultEnvironmentFor(testType);

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
  };

  return cached;
}

/** sanity/phase3 → regression specs, flagship → flagship specs */
export function getSpecsForTestType(testType: TestType): string[] {
  if (testType === 'flagship') {
    return ['./test/specs/flagship/**/*.ts'];
  }
  return ['./test/specs/regression/**/*.ts'];
}
