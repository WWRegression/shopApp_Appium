import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { getRunConfig } from '../../config/run.config';
import { targetPackage } from './context.helper';

const execFileAsync = promisify(execFile);
const ADB_TIMEOUT_MS = 15000;

/**
 * Browser page snapshot (id, url, title).
 * Sourced via Chrome DevTools /json — no Appium context/window switch.
 */
export interface BrowserPageInfo {
  id: string;
  url: string;
  title: string;
}

function deviceUdid(explicit?: string): string | undefined {
  if (explicit) {
    return explicit;
  }

  let fromCapabilities: string | undefined;
  if (typeof browser !== 'undefined') {
    try {
      fromCapabilities = (browser.capabilities as WebdriverIO.Capabilities & { deviceUDID?: string })
        ?.deviceUDID;
    } catch {
      fromCapabilities = undefined;
    }
  }

  return fromCapabilities || getRunConfig().udid;
}

function adbArgv(args: string[], udid?: string): string[] {
  const serial = deviceUdid(udid);
  return serial ? ['-s', serial, ...args] : args;
}

function adbSync(args: string[], udid?: string): string {
  return execFileSync('adb', adbArgv(args, udid), {
    encoding: 'utf8',
    timeout: ADB_TIMEOUT_MS,
  }).trim();
}

async function adbAsync(args: string[], udid?: string): Promise<string> {
  const { stdout } = await execFileAsync('adb', adbArgv(args, udid), {
    encoding: 'utf8',
    timeout: ADB_TIMEOUT_MS,
  });
  return stdout.trim();
}

/** Runs an adb command against the connected device and returns stdout. */
export async function adb(...args: string[]): Promise<string> {
  return adbAsync(args);
}

/** Process id of the given app package (defaults to the current site's target package). */
export async function getAppPid(appPackage = targetPackage()): Promise<string> {
  return adb('shell', 'pidof', appPackage).catch(() => '');
}

/** Forwards an OS-assigned free local port to the given pid's webview devtools socket, returns the port. */
export async function getWebviewDevtoolsPort(pid: string): Promise<string> {
  return adb('forward', 'tcp:0', `localabstract:webview_devtools_remote_${pid}`);
}

/** Removes a port forward set up by getWebviewDevtoolsPort() (or any adb forward on that port). */
export async function removePortForward(port: string): Promise<void> {
  await adb('forward', '--remove', `tcp:${port}`);
}

/**
 * List browser pages via Chrome DevTools /json (no Appium context switch).
 * Returns type === 'page' entries with a url.
 */
export async function getBrowserPages(): Promise<BrowserPageInfo[]> {
  const pid = await getAppPid();
  if (!pid) {
    return [];
  }

  const port = await getWebviewDevtoolsPort(pid);
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    const entries = (await res.json()) as Array<{
      id: string;
      url?: string;
      title?: string;
      type?: string;
    }>;
    return entries
      .filter((e) => e.type === 'page' && !!e.url)
      .map((e) => ({ id: e.id, url: e.url!, title: e.title ?? '' }));
  } catch {
    return [];
  } finally {
    await removePortForward(port).catch(() => undefined);
  }
}

/** adb dumpsys package → versionName(versionCode) */
export async function getPackageVersion(
  appPackage: string,
  udid?: string
): Promise<string> {
  if (!appPackage) {
    return '';
  }

  try {
    const stdout = await adbAsync(['shell', 'dumpsys', 'package', appPackage], udid);

    const versionName = extractDumpValue(stdout, 'versionName');
    const versionCode = extractDumpValue(stdout, 'versionCode');
    if (versionName === 'Not Found' && versionCode === 'Not Found') {
      return '';
    }
    return `${versionName}(${versionCode})`;
  } catch {
    return '';
  }
}

function extractDumpValue(output: string, key: string): string {
  const re = new RegExp(`${key}=([^\\s]+)`);
  const match = output.match(re);
  return match?.[1] ?? 'Not Found';
}

/**
 * adb dumpsys account → Google 계정 email (`type=com.google`, `name=wwautokr`).
 */
export function getGoogleAccountEmail(udid?: string): string {
  try {
    const stdout = adbSync(
      ['shell', 'dumpsys account | grep type=com.google | grep name=wwautokr'],
      udid
    );
    return stdout.match(/name=([^,}]+)/)?.[1]?.trim() ?? '';
  } catch {
    return '';
  }
}