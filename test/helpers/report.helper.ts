/** WDIO afterTest → DB upload bridge. */
import {
  insertShopAppResult,
  mapTestStatus,
  type ReportStatus,
} from './db.helper';

export interface FieldCheck {
  label: string;
  pass: boolean;
  detail?: string;
}

/**
 * Stops the TC here — for failures the next step cannot go on from.
 * - (checks, context): throws once listing every failed check.
 * - (action, reason): runs the action; on failure throws one clear Error with the reason (a function builds it at failure time).
 */
export function markFailedAndStop(checks: FieldCheck[], context: string): void;
export function markFailedAndStop(action: () => Promise<void>, reason: string | (() => string)): Promise<void>;
export function markFailedAndStop(
  checksOrAction: FieldCheck[] | (() => Promise<void>),
  reason: string | (() => string)
): void | Promise<void> {
  if (Array.isArray(checksOrAction)) {
    throwIfFailed(checksOrAction, reason as string);
    return;
  }
  return checksOrAction().catch((cause) => {
    throw new Error(typeof reason === 'function' ? reason() : reason, { cause: cause as Error });
  });
}

const recordedFailures: string[] = [];

/** Records the failed checks and lets the TC go on; runOrSkip fails the TC with them once its steps are done. */
export function markFailed(checks: FieldCheck[], context: string): void {
  try {
    throwIfFailed(checks, context);
  } catch (error) {
    recordedFailures.push((error as Error).message);
    console.log(`[markFailed] recorded, TC continues: ${(error as Error).message}`);
  }
}

/** Returns and clears the failures recorded by markFailed. */
export function takeRecordedFailures(): string[] {
  return recordedFailures.splice(0);
}

function throwIfFailed(checks: FieldCheck[], context: string): void {
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
