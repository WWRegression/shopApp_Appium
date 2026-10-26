import { getRunConfig } from '../../config/run.config';
import { insertShopAppResult, type ReportStatus } from './db.helper';

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

interface CurrentTc {
  tcId: string;
  upload: boolean;
}

let currentTc: CurrentTc | undefined;

/** Sets the TC that afterTest uploads; upload=false keeps it out of the DB (TC not in this suite). */
export function setCurrentTc(tcId: string, upload = true): void {
  currentTc = { tcId, upload };
}

const SCRIPT_ERRORS = ['TypeError', 'ReferenceError', 'RangeError', 'SyntaxError'];

/** True when the error (or one it wraps) is a script bug rather than a failed check. */
function isScriptError(error: unknown): boolean {
  for (let e = error; e instanceof Error; e = e.cause) {
    if (SCRIPT_ERRORS.includes(e.name)) return true;
  }
  return false;
}

function resolveStatus(result: { passed: boolean; skipped?: boolean; error?: Error }): { status: ReportStatus; reason: string } {
  if (result.skipped) return { status: 'N/A', reason: '' };
  if (result.passed) return { status: 'Pass', reason: '' };

  const reason = result.error?.message ?? 'Unknown failure';
  if (reason.toUpperCase().includes('[SKIPPED]')) return { status: 'N/A', reason };
  // Nothing tags [OOS] yet; the DB status is kept for upcoming out-of-stock checks
  if (/\[OOS\]/i.test(reason)) return { status: 'OOS', reason };
  if (/\[Planned\]/i.test(reason)) return { status: 'Planned', reason };
  if (isScriptError(result.error)) return { status: 'Exception', reason };
  return { status: 'Fail', reason };
}

/** Uploads the finished TC's result to the report DB (afterTest). Does nothing when reportDb is off. */
export async function reportTestResult(result: { passed: boolean; skipped?: boolean; error?: Error }): Promise<void> {
  const tc = currentTc;
  currentTc = undefined;

  const run = getRunConfig();
  if (!run.reportDb || !tc?.upload) return;
  if (run.testType === 'flagship') {
    console.log(`[db] ${tc.tcId}: flagship upload is not supported yet, skipped`);
    return;
  }

  const { status, reason } = resolveStatus(result);
  await insertShopAppResult({ tcId: tc.tcId, status, reason });
}
