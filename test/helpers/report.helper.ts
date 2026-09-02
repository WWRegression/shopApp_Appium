/** WDIO afterTest → DB upload bridge. */
import {
  insertShopAppResult,
  mapTestStatus,
  type ReportStatus,
} from './db.helper';

/** Runs a select-step action; on failure, throws one clear Error (used as the DB fail reason). */
export async function markFailedAndStop(action: () => Promise<void>, reason: string): Promise<void> {
  try {
    await action();
  } catch (cause) {
    throw new Error(reason, { cause: cause as Error });
  }
}

export interface FieldCheck {
  label: string;
  pass: boolean;
  detail?: string;
}

/** Checks every field, then throws once listing all that failed (e.g. "storage, color"). */
export function markFailed(checks: FieldCheck[], context: string): void {
  const failed = checks.filter((check) => !check.pass);
  if (failed.length === 0) return;

  const summary = failed.map((check) => (check.detail ? `${check.label} (${check.detail})` : check.label)).join(', ');
  throw new Error(`${context} verification failed: ${summary}`);
}

function extractTcId(title: string, parent?: string): string {
  const fromTitle = title.match(/\b(PROD_[A-Z0-9_]+|UAT_[A-Z0-9_]+)\b/);
  if (fromTitle) {
    return fromTitle[1];
  }
  const fromParent = parent?.match(/\b(PROD_[A-Z0-9_]+|UAT_[A-Z0-9_]+)\b/);
  if (fromParent) {
    return fromParent[1];
  }
  return title.trim().replace(/\s+/g, '_').slice(0, 80);
}

export async function reportTestResult(args: {
  title: string;
  parent?: string;
  passed: boolean;
  skipped?: boolean;
  error?: Error;
}): Promise<void> {
  const tcId = extractTcId(args.title, args.parent);
  const { status, reason } = mapTestStatus(
    args.passed,
    Boolean(args.skipped),
    args.error
  );

  await insertShopAppResult({
    tcId,
    status: status as ReportStatus,
    reason,
  });
}
