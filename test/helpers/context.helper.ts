import { getRunConfig } from '../../config/run.config';
import { getAppPackage } from '../../config/site';

/**
 * Hybrid context helpers — Native ↔ Hybris WebView.
 */

export type PageUrlKey = 'site' | 'cart' | 'buy' | 'PD' | 'useinsider' | string;

function targetPackage(): string {
  return (
    getAppPackage(getRunConfig().site) ||
    (browser.capabilities as WebdriverIO.Capabilities)['appium:appPackage'] ||
    ''
  );
}

export async function getCurrentContext(): Promise<string> {
  return String(await driver.getContext());
}

export async function getContexts(): Promise<string[]> {
  const contexts = await driver.getContexts();
  return contexts.map((ctx) => String(ctx));
}

export async function isNativeContext(): Promise<boolean> {
  const current = (await getCurrentContext()).toUpperCase();
  return current === 'NATIVE_APP' || current.includes('NATIVE');
}

/**
 * Target WebView = context ending with app package (excludes chrome).
 */
export async function isWebViewContext(appPackage = targetPackage()): Promise<boolean> {
  const current = (await getCurrentContext()).toLowerCase();
  if (!current.includes('webview')) {
    return false;
  }
  if (!appPackage) {
    return !current.includes('chrome');
  }
  return current.endsWith(appPackage.toLowerCase());
}

export async function waitForWebView(
  timeoutSec = 5,
  appPackage = targetPackage()
): Promise<boolean> {
  const deadline = Date.now() + timeoutSec * 1000;

  while (Date.now() < deadline) {
    const contexts = await getContexts();
    const found = contexts.some((ctx) => {
      const lower = ctx.toLowerCase();
      return (
        lower.includes('webview') &&
        (!appPackage || lower.endsWith(appPackage.toLowerCase()))
      );
    });
    if (found) {
      return true;
    }
    await driver.pause(300);
  }

  return false;
}

export async function switchToNative(): Promise<void> {
  if (await isNativeContext()) {
    return;
  }
  await driver.switchContext('NATIVE_APP');
}

/**
 * Switch to app WebView. Prefer package-matched context, then non-chrome WEBVIEW_*.
 */
export async function switchToWebView(
  waitTimeSec = 5,
  appPackage = targetPackage()
): Promise<boolean> {
  try {
    if (await isWebViewContext(appPackage)) {
      return true;
    }

    if (!(await waitForWebView(waitTimeSec, appPackage))) {
      return false;
    }

    const contexts = await getContexts();
    const pkg = appPackage.toLowerCase();
    const byPackage = contexts.find((ctx) => ctx.toLowerCase().endsWith(pkg));
    const byWebView = contexts.find(
      (ctx) =>
        ctx.toLowerCase().includes('webview') &&
        !ctx.toLowerCase().includes('chrome')
    );
    const target = byPackage ?? byWebView;

    if (!target) {
      return false;
    }

    await driver.switchContext(target);
    await driver.pause(1500);
    return isWebViewContext(appPackage);
  } catch {
    return false;
  }
}

function pageUrlPatterns(page: PageUrlKey, siteCode: string): string[] {
  const site = siteCode.toLowerCase();
  const patterns: Record<string, string[]> = {
    cart: [`${site}/cart`],
    buy: [`${site}/buy/`, `${site}/watches/`, '/buy/'],
    PD: [
      `${site}/tvs/`,
      `${site}/watches/`,
      `${site}/lifestyle-tvs/`,
      `${site}/qled-tv/`,
      `${site}/refrigerators/`,
      `${site}/monitors/`,
    ],
    useinsider: ['useinsider'],
    site: [`/${site}/`, `/${site}?`, 'samsung.com.cn'],
  };
  return patterns[page] ?? [`${page}/`];
}

/**
 * Within WebView, pick the window whose URL matches the page pattern.
 * Katalon Common.switchUrl 참고.
 */
export async function switchUrl(
  page: PageUrlKey = 'site',
  siteCode = getRunConfig().site
): Promise<boolean> {
  if (!(await isWebViewContext())) {
    return false;
  }

  const targetUrls = pageUrlPatterns(page, siteCode);
  const sitePatterns = pageUrlPatterns('site', siteCode);
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const handles = [...(await driver.getWindowHandles())].reverse();

    for (const handle of handles) {
      try {
        await driver.switchToWindow(handle);
        const currentUrl = String(
          await driver.execute('return window.location.href;')
        ).toLowerCase();

        const belongsToSite = sitePatterns.some((p) =>
          currentUrl.includes(p.toLowerCase())
        );
        if (!belongsToSite) {
          continue;
        }

        if (targetUrls.some((p) => currentUrl.includes(p.toLowerCase()))) {
          return true;
        }
      } catch {
        // unresponsive handle — skip
      }
    }

    if (attempt < maxAttempts) {
      await driver.pause(2000);
    }
  }

  return false;
}
