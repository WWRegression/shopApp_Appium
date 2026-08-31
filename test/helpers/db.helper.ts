/**
 * Result DB helper (Katalon Keywords/ReportHandler.groovy 참고).
 *
 * Sanity/Phase3:
 *   EXEC procInsertShopAppResult agentIp, testType, releaseName, site, tcId, apkVersion, status, reason
 *
 * 업로드 on/off · releaseName: config/run.config.ts (또는 --report-db / --release)
 */
import os from 'node:os';
import { getRunConfig } from '../../config/run.config';
import { getAppPackage } from '../../config/site';
import { getPackageVersion } from './device.helper';

/** Report DB 접속 (고정). password만 팀 계정에 맞게 수정. */
const REPORT_DB = {
  server: 'katalondb.ecom-qa.samsung.com',
  port: 11433,
  database: 'TestInfo',
  user: 'katalon_admin',
  password: '',
} as const;

export type ReportStatus = 'Pass' | 'Fail' | 'N/A' | 'Exception' | 'Planned' | 'OOS';

export interface ShopAppResultPayload {
  tcId: string;
  status: ReportStatus;
  reason?: string;
  site?: string;
  testType?: string;
  releaseName?: string;
  apkVersion?: string;
  agentIp?: string;
}

function isReportDbEnabled(): boolean {
  return getRunConfig().reportDb;
}

function resolveAgentIp(): string {
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

function buildDbConfig() {
  if (!REPORT_DB.password) {
    throw new Error(
      '[db.helper] REPORT_DB.password is empty — set it in test/helpers/db.helper.ts'
    );
  }

  return {
    server: REPORT_DB.server,
    port: REPORT_DB.port,
    database: REPORT_DB.database,
    user: REPORT_DB.user,
    password: REPORT_DB.password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    pool: { max: 2, min: 0, idleTimeoutMillis: 10000 },
  };
}

/**
 * Upload one TC result via procInsertShopAppResult (Smoke/Sanity/Phase3 path).
 * No-op when reportDb is false. Failures are logged, never thrown.
 */
export async function insertShopAppResult(
  payload: ShopAppResultPayload
): Promise<boolean> {
  if (!isReportDbEnabled()) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sql: any;
  try {
    sql = await import('mssql');
  } catch {
    console.warn('[db.helper] mssql package not installed. Run: npm i mssql');
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pool: any;

  try {
    const run = getRunConfig();
    const site = (payload.site ?? run.site).toUpperCase();
    const testType = payload.testType ?? run.testType;
    const releaseName = payload.releaseName ?? run.releaseName;
    const agentIp = payload.agentIp ?? resolveAgentIp();
    const appPackage =
      getAppPackage(run.site) ||
      ((browser.capabilities as WebdriverIO.Capabilities)['appium:appPackage'] as
        | string
        | undefined) ||
      '';
    const apkVersion = payload.apkVersion ?? (await getPackageVersion(appPackage));

    if (!releaseName) {
      console.warn(
        '[db.helper] releaseName is empty — set config/run.config.ts or pass --release Rxx'
      );
    }

    pool = await new sql.ConnectionPool(buildDbConfig()).connect();
    const request = pool.request();
    request.input('agentIp', sql.NVarChar, agentIp);
    request.input('testType', sql.NVarChar, testType);
    request.input('releaseName', sql.NVarChar, releaseName);
    request.input('site', sql.NVarChar, site);
    request.input('tcId', sql.NVarChar, payload.tcId);
    request.input('apkVersion', sql.NVarChar, apkVersion);
    request.input('status', sql.NVarChar, payload.status);
    request.input('reason', sql.NVarChar, payload.reason ?? '');

    const result = await request.query(`
      DECLARE @result VARCHAR(20);
      EXEC procInsertShopAppResult
        @agentIp, @testType, @releaseName, @site, @tcId, @apkVersion, @status, @reason,
        @result OUTPUT;
      SELECT @result AS result;
    `);

    const value = String(result.recordset?.[0]?.result ?? '');
    if (value.toLowerCase() === 'success') {
      console.log(`[db.helper] ${site} - ${payload.tcId} uploaded: ${payload.status}`);
      return true;
    }

    console.warn(
      `[db.helper] Failed to export ${payload.tcId} (reason: ${value || 'empty'})`
    );
    return false;
  } catch (error) {
    console.warn(
      `[db.helper] insertShopAppResult: ${error instanceof Error ? error.message : error}`
    );
    return false;
  } finally {
    if (pool) {
      await pool.close().catch(() => undefined);
    }
  }
}

/** Map WDIO/Mocha result → ReportHandler status labels. */
export function mapTestStatus(
  passed: boolean,
  skipped: boolean,
  error?: Error
): { status: ReportStatus; reason: string } {
  if (skipped) {
    return { status: 'N/A', reason: error?.message ?? '' };
  }

  if (passed) {
    return { status: 'Pass', reason: '' };
  }

  const reason = error?.message ?? 'Unknown failure';
  if (reason.toUpperCase().includes('[SKIPPED]')) {
    return { status: 'N/A', reason };
  }
  if (/\[OOS\]/i.test(reason)) {
    return { status: 'OOS', reason };
  }
  if (reason.includes('[SETUP_ERROR]') || /\[Planned\]/i.test(reason)) {
    return { status: 'Planned', reason };
  }
  return { status: 'Fail', reason };
}
