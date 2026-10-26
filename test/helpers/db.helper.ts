import os from 'node:os';
import sql from 'mssql';
import { getReportDbConnection } from '../../config/db.config';
import { getRunConfig, type TestType } from '../../config/run.config';
import { getAppPackage } from '../../config/site';
import { getPackageVersion } from './device.helper';

export type ReportStatus = 'Pass' | 'Fail' | 'N/A' | 'Exception' | 'Planned' | 'OOS';

export interface ShopAppResultPayload {
  tcId: string;
  status: ReportStatus;
  reason?: string;
}

/** TestType values as registered in ShopApp_releasemgt. */
const DB_TEST_TYPE: Record<TestType, string> = {
  sanity: 'Sanity',
  phase3: 'Phase3',
  flagship: 'ShopAppFS',
};

let poolPromise: Promise<sql.ConnectionPool> | undefined;

function resolveAgentIp(): string {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

/** Opens the report DB pool once per worker and reuses it for every TC. */
async function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool({
      ...sql.ConnectionPool.parseConnectionString(getReportDbConnection()),
      pool: { max: 2, min: 0, idleTimeoutMillis: 30000 },
    })
      .connect()
      .catch((error: unknown) => {
        // Drop the failed pool so the next TC tries to connect again
        poolPromise = undefined;
        throw error;
      });
  }
  return poolPromise;
}

/** Closes the report DB pool; called once when the worker ends. */
export async function closeReportDb(): Promise<void> {
  const pending = poolPromise;
  poolPromise = undefined;
  if (pending) {
    await pending.then((pool) => pool.close()).catch(() => undefined);
  }
}

/** Uploads one Sanity/Phase3 TC result via procInsertShopAppResult. Errors are logged, never thrown. */
export async function insertShopAppResult(payload: ShopAppResultPayload): Promise<boolean> {
  const run = getRunConfig();
  const site = run.siteCode.toUpperCase();
  try {
    const apkVersion = await getPackageVersion(getAppPackage(run.siteCode), run.udid);
    console.log(`[db] [${site}] ${payload.tcId} uploading: ${payload.status} - ${payload.reason ?? ''}`);

    const pool = await getPool();
    const result = await pool
      .request()
      .input('agentIp', sql.NVarChar, resolveAgentIp())
      .input('testType', sql.NVarChar, DB_TEST_TYPE[run.testType])
      .input('releaseName', sql.NVarChar, run.releaseName)
      .input('site', sql.NVarChar, site)
      .input('tcId', sql.NVarChar, payload.tcId)
      .input('apkVersion', sql.NVarChar, apkVersion)
      .input('status', sql.NVarChar, payload.status)
      .input('reason', sql.NVarChar, payload.reason ?? '')
      .query(`
        DECLARE @result VARCHAR(20);
        EXEC procInsertShopAppResult
          @agentIp, @testType, @releaseName, @site, @tcId, @apkVersion, @status, @reason,
          @result OUTPUT;
        SELECT @result AS result;
      `);

    const value = String(result.recordset?.[0]?.result ?? '');
    if (value.toLowerCase() === 'success') {
      console.log(`[db] ${site} - ${payload.tcId} uploaded`);
      return true;
    }
    // fail1 = release/testType, TC or site is not registered (enabled) in the *_mgt tables
    const hint =
      value === 'fail1'
        ? ` — check ShopApp_releasemgt has ${run.releaseName}/${DB_TEST_TYPE[run.testType]}, and ShopApp_tcmgt/sitemgt have ${payload.tcId}/${site}`
        : '';
    console.warn(`[db] failed to export ${payload.tcId} (reason: ${value || 'no result'})${hint}`);
    return false;
  } catch (error) {
    console.warn(`[db] insertShopAppResult: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}
