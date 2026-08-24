import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { targetPackage } from './context.helper';

const execFileAsync = promisify(execFile);

/** WebView page from CDP /json (id, url, title only). */
export interface CdpPage {
  id: string;
  url: string;
  title: string;
}

function deviceArgs(): string[] {
  const udid = (browser.capabilities as WebdriverIO.Capabilities & { deviceUDID?: string }).deviceUDID;
  return udid ? ['-s', udid] : [];
}

/** Runs an adb command against the connected device and returns stdout. */
export async function adb(...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('adb', [...deviceArgs(), ...args]);
  return stdout.trim();
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
 * WebView pages via Chrome DevTools /json (no Appium context switch).
 * Returns type === 'page' entries with a url.
 */
export async function getPagesByCdp(): Promise<CdpPage[]> {
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
  deviceUdid?: string
): Promise<string> {
  if (!appPackage) {
    return '';
  }

  try {
    const adbArgs = [
      ...(deviceUdid ? ['-s', deviceUdid] : []),
      'shell',
      'dumpsys',
      'package',
      appPackage,
    ];
    const { stdout } = await execFileAsync('adb', adbArgs, {
      encoding: 'utf8',
      timeout: 15000,
    });

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
