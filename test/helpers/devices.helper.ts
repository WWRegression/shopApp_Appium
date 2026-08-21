import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { targetPackage } from './context.helper';

const execFileAsync = promisify(execFile);

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
