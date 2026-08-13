/**
 * WDIO afterTest → DB upload bridge (Katalon ReportHandler listener 역할).
 */
import {
  insertShopAppResult,
  mapTestStatus,
  type ReportStatus,
} from './db.helper';

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
