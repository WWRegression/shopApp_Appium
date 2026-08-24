import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { targetPackage } from './context.helper';

const execFileAsync = promisify(execFile);

export interface WebViewDevtoolsPage {
  id: string;
  url: string;
  title: string;
  type: string;
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

/** Process id of the current app package. */
export async function getAppPid(): Promise<string> {
  return adb('shell', 'pidof', targetPackage()).catch(() => '');
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
 * Lists WebView pages via Chrome DevTools /json (no Appium context switch).
 * TODO: wire adb forward + HTTP /json.
 */
export async function getAvailableUrls(): Promise<WebViewDevtoolsPage[]> {
  const pid = await getAppPid();
  if (!pid) {
    return [];
  }

  const port = await adb('forward', 'tcp:0', `localabstract:webview_devtools_remote_${pid}`);
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    return (await res.json()) as CdpPage[];
  } finally {
    await adb('forward', '--remove', `tcp:${port}`).catch(() => undefined);
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
