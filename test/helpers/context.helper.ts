import { getRunConfig } from '../../config/run.config';
import { getAppPackage } from '../../config/site';
import { isDisplayedSafe } from './element.helper';
import { getAvailableUrls } from './device.helper';

/**
 * Hybrid context helpers — Native ↔ Hybris WebView.
 *
 * Layers:
 *   1) Context  — Native ↔ WEBVIEW_<package>   (switchToNative / switchToWebView)
 *   2) Window   — URL-matched window focus     (switchToWebViewWindow)
 *   3) Prepare  — context + window + layout   (prepareWebViewPage)
 *   4) Detect   — which page is on screen      (getCurrentPage)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** WebView URL lookup keys. Native pages have no URL patterns. */
export type PageUrlKey = WebViewPage | 'site' | 'useinsider';

export type ContextType = 'native' | 'webview';

/** Native app screens (Header / BNB). Not matched by URL. */
export type NativePage = 'home' | 'shop' | 'offers' | 'search' | 'account' | 'nativePd';

/**
 * Hybris WebView screens. Identified by URL via pageUrlPatterns().
 * wish / address: opened from My Page. Unmatched Hybris links stay 'unknown'.
 */
export type WebViewPage = 'bc' | 'pd' | 'cart' | 'checkout' | 'wish' | 'address' | 'wdsLogin';

export type CurrentPage = NativePage | WebViewPage | 'unknown';

export interface CurrentPageResult {
  page: CurrentPage;
  context: ContextType;
}

// ---------------------------------------------------------------------------
// Package
// ---------------------------------------------------------------------------

/** App package for the current site (or capability fallback). */
export function targetPackage(): string {
  return (
    getAppPackage(getRunConfig().site) ||
    (browser.capabilities as WebdriverIO.Capabilities)['appium:appPackage'] ||
    ''
  );
}

// ---------------------------------------------------------------------------
// Context — read / check
// ---------------------------------------------------------------------------

export async function getCurrentContext(): Promise<string> {
  return String(await driver.getContext());
}

export async function getAvailableContexts(): Promise<string[]> {
  const contexts = await driver.getContexts();
  return contexts.map((ctx) => String(ctx));
}

export async function isNativeContext(contextName?: string): Promise<boolean> {
  const name = (contextName ?? (await getCurrentContext())).toUpperCase();
  return name === 'NATIVE_APP';
}

/** True when context is WEBVIEW_<appPackage>. */
export async function isWebViewContext(
  contextName?: string,
  appPackage = targetPackage()
): Promise<boolean> {
  const ctx = (contextName ?? (await getCurrentContext())).toLowerCase();
  const pkg = appPackage.toLowerCase();
  return !!pkg && ctx === `webview_${pkg}`;
}

async function findAppWebViewContext(
  contexts: string[],
  appPackage = targetPackage()
): Promise<string | undefined> {
  for (const ctx of contexts) {
    if (await isWebViewContext(ctx, appPackage)) {
      return ctx;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Context — switch
// ---------------------------------------------------------------------------

/**
 * Wait until a real webview page (type 'page', non-empty url) shows up via CDP
 * for this app's pid — no Appium context switch involved, so polling is cheap.
 */
async function waitForWebView(
  timeoutSec: number,
  appPackage = targetPackage()
): Promise<boolean> {
  const deadline = Date.now() + timeoutSec * 1000;

  while (Date.now() < deadline) {
    const pages = await getAvailableUrls(appPackage);
    if (pages.some((p) => p.url)) {
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
 * Switch to app WebView context (WEBVIEW_<package>).
 * Does not switch window/URL — use switchToWebViewWindow for that.
 */
export async function switchToWebView(
  waitTimeSec = 5,
  appPackage = targetPackage()
): Promise<boolean> {
  try {
    const current = await getCurrentContext();
    if (await isWebViewContext(current, appPackage)) {
      return true;
    }

    if (!(await waitForWebView(waitTimeSec, appPackage))) {
      return false;
    }

    const target = await findAppWebViewContext(
      await getAvailableContexts(),
      appPackage
    );
    if (!target) {
      return false;
    }

    await driver.switchContext(target);
    return isWebViewContext(await getCurrentContext(), appPackage);
  } catch {
    return false;
  }
}

/**
 * App WebView stale or non-app context → switch to Native.
 * Returns where the driver should be treated as after recovery.
 */
export async function recoverToNativeIfStale(
  appPackage = targetPackage()
): Promise<ContextType> {
  const currentCtx = await getCurrentContext();
  const availableCtxs = await getAvailableContexts();

  if (await isNativeContext(currentCtx)) {
    return 'native';
  }

  if (await isWebViewContext(currentCtx, appPackage)) {
    const stillAvailable = availableCtxs.some(
      (ctx) => ctx.toLowerCase() === currentCtx.toLowerCase()
    );
    if (!stillAvailable) {
      await switchToNative();
      return 'native';
    }
    return 'webview';
  }

  await switchToNative();
  return 'native';
}

// ---------------------------------------------------------------------------
// URL patterns
// ---------------------------------------------------------------------------

/** URL fragments for a Hybris WebView page or window-switch target. */
export function pageUrlPatterns(page: PageUrlKey, siteCode: string): string[] {
  const site = siteCode.toLowerCase();
  const patterns: Record<PageUrlKey, string[]> = {
    bc: [`${site}/buy/`, `${site}/watches/`, '/buy/'],
    pd: [
      `${site}/tvs/`,
      `${site}/watches/`,
      `${site}/lifestyle-tvs/`,
      `${site}/qled-tv/`,
      `${site}/refrigerators/`,
      `${site}/monitors/`,
    ],
    cart: [`${site}/cart`],
    checkout: [`${site}/checkout`, '/checkout'],
    wish: [`${site}/wishlist`, '/wishlist', '/wish'],
    address: [`${site}/address`, '/my-account/address', '/address'],
    wdsLogin: ['sts.secsso.net', 'wds'],
    site: [`/${site}/`, `/${site}?`, 'samsung.com.cn'],
    useinsider: ['useinsider'],
  };
  return patterns[page];
}

function hrefMatches(href: string, patterns: string[]): boolean {
  const url = href.toLowerCase();
  return patterns.some((pattern) => url.includes(pattern.toLowerCase()));
}

function hrefMatchesPage(href: string, page: PageUrlKey, siteCode: string): boolean {
  const onSite = hrefMatches(href, pageUrlPatterns('site', siteCode));
  return onSite && hrefMatches(href, pageUrlPatterns(page, siteCode));
}

// ---------------------------------------------------------------------------
// Window — URL / focus
// ---------------------------------------------------------------------------

/** Active window URL in the current WebView, or undefined. */
export async function getWebViewUrl(): Promise<string | undefined> {
  if (!(await isWebViewContext())) {
    return undefined;
  }
  try {
    return String(await driver.execute('return window.location.href;'));
  } catch {
    return undefined;
  }
}

/**
 * Switch to the WebView window whose URL matches the page pattern.
 * Requires WebView context. Throws if no matching window is found.
 */
export async function switchToWebViewWindow(
  page: PageUrlKey = 'site',
  siteCode = getRunConfig().site
): Promise<void> {
  if (!(await isWebViewContext())) {
    throw new Error('switchToWebViewWindow: not in WebView context');
  }

  const currentHref = await getWebViewUrl();
  if (currentHref && hrefMatchesPage(currentHref, page, siteCode)) {
    return;
  }

  for (const handle of await driver.getWindowHandles()) {
    try {
      await driver.switchToWindow(handle);
      const href = await getWebViewUrl();
      if (href && hrefMatchesPage(href, page, siteCode)) {
        return;
      }
    } catch {
      // unresponsive window — skip
    }
  }

  throw new Error(`switchToWebViewWindow: no window matched page=${page}`);
}

/**
 * Prepare a Hybris WebView page before actions:
 * switchToWebView + switchToWebViewWindow + layout ready.
 * Returns false when context/window/layout is not ready (does not throw).
 */
export async function prepareWebViewPage(
  urlKey: PageUrlKey,
  layout: ChainablePromiseElement,
  timeout = 10000
): Promise<boolean> {
  if (!(await switchToWebView())) {
    return false;
  }
  try {
    await switchToWebViewWindow(urlKey);
  } catch {
    return false;
  }
  return layout.waitForDisplayed({ timeout }).catch(() => false);
}

// ---------------------------------------------------------------------------
// Current page — detect
// ---------------------------------------------------------------------------

async function hasWebViewBcSignature(): Promise<boolean> {
  const bcMarker = $(
    [
      '.s-option-device',
      '[an-la="top sticky bar:add to cart"]',
      '[an-la*="sticky bar:add to cart" i]',
      '.hubble-price-bar__price-cta',
    ].join(', ')
  );
  return bcMarker.isExisting().catch(() => false);
}

async function detectCurrentPageInWebView(href: string): Promise<WebViewPage | 'unknown'> {
  const site = getRunConfig().site;
  const ordered: WebViewPage[] = [
    'wdsLogin',
    'cart',
    'checkout',
    'wish',
    'address',
  ];

  for (const page of ordered) {
    if (hrefMatches(href, pageUrlPatterns(page, site))) {
      return page;
    }
  }

  const bcPatterns = pageUrlPatterns('bc', site);
  const pdPatterns = pageUrlPatterns('pd', site);
  if (hrefMatches(href, bcPatterns) || hrefMatches(href, pdPatterns)) {
    if (await hasWebViewBcSignature()) {
      return 'bc';
    }
    if (hrefMatches(href, bcPatterns)) {
      return 'bc';
    }
    if (hrefMatches(href, pdPatterns)) {
      return 'pd';
    }
  }

  return 'unknown';
}

async function detectCurrentPageInNative(): Promise<NativePage | 'unknown'> {
  const searchInput = $('//android.widget.EditText');
  if (await isDisplayedSafe(searchInput)) {
    return 'search';
  }

  // TODO: home / shop / offers / account / nativePd — BasePage
  return 'unknown';
}

/**
 * Detect the current page from the active screen.
 * May switch to Native once to recover a stale WebView. Does not switch to WebView.
 */
export async function getCurrentPage(): Promise<CurrentPageResult> {
  const context = await recoverToNativeIfStale();

  if (context === 'webview') {
    const page = await detectCurrentPageInWebView((await getWebViewUrl()) ?? '');
    return { page, context };
  }

  return { page: await detectCurrentPageInNative(), context };
}

export async function isCurrentPage(
  page: Exclude<CurrentPage, 'unknown'>
): Promise<boolean> {
  return (await getCurrentPage()).page === page;
}
