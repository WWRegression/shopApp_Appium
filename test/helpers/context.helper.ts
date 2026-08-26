import { getRunConfig } from '../../config/run.config';
import { getAppPackage } from '../../config/site';
import { isDisplayedSafe } from './element.helper';

/**
 * Hybrid context helpers — Native ↔ Hybris WebView.
 *
 * Layers:
 *   1) Context  — Native ↔ WEBVIEW_<package>   (hasAppWebViewContext / switchToWebView / switchToNative)
 *   2) Window   — URL-matched window focus     (getCurrentWindowUrl / switchToWindowByPage)
 *   3) Prepare  — context + window + layout   (prepareWebViewPage)
 *   4) Detect   — URL match + current page      (matchPageByUrl / getCurrentPage)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContextType = 'native' | 'webview';

/** Native app screens (Header / BNB). Not matched by URL. */
export type NativePage = 'home' | 'shop' | 'offers' | 'search' | 'account' | 'nativePd';

/** Hybris WebView screens. */
export type WebViewPage = 'bc' | 'pd' | 'cart' | 'checkout' | 'mypageWishlist' | 'mypageProfile' | 'wdsLogin';

export type CurrentPage = NativePage | WebViewPage | 'unknown';

/** WebView URL lookup keys. Native pages have no URL patterns. */
export type PageUrlKey = WebViewPage | 'site' | 'useinsider';

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

// ===========================================================================
// 1) Context — Native ↔ WEBVIEW_<package>
// ===========================================================================

export async function getCurrentContext(): Promise<string> {
  return String(await driver.getContext());
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

/**
 * True when WEBVIEW_<appPackage> is available in getContexts().
 * waitTimeMs > 0 → Appium waits for a webview before returning the list.
 */
export async function hasAppWebViewContext(
  waitTimeMs = 0,
  appPackage = targetPackage()
): Promise<boolean> {
  if (!appPackage) {
    return false;
  }
  try {
    const contexts = await driver.getContexts({
      waitForWebviewMs: waitTimeMs,
    });
    const expected = `webview_${appPackage.toLowerCase()}`;
    return contexts.some((c) => String(c).toLowerCase() === expected);
  } catch {
    return false;
  }
}

export async function switchToNative(): Promise<void> {
  if (await isNativeContext()) {
    return;
  }
  await driver.switchContext('NATIVE_APP');
}

/**
 * Switch to app WebView context (WEBVIEW_<package>).
 * Does not switch window/URL — use switchToWindowByPage for that.
 */
export async function switchToWebView(
  waitTimeMs = 5000,
  appPackage = targetPackage()
): Promise<boolean> {
  try {
    if (await isWebViewContext(undefined, appPackage)) {
      return true;
    }

    if (!(await hasAppWebViewContext(waitTimeMs, appPackage))) {
      return false;
    }

    await driver.switchContext(`WEBVIEW_${appPackage}`);
    return isWebViewContext(undefined, appPackage);
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

  if (await isNativeContext(currentCtx)) {
    return 'native';
  }

  if (await isWebViewContext(currentCtx, appPackage)) {
    if (!(await hasAppWebViewContext(0, appPackage))) {
      await switchToNative();
      return 'native';
    }
    return 'webview';
  }

  await switchToNative();
  return 'native';
}

// ===========================================================================
// 2) Window — URL-matched window focus
// ===========================================================================

/** Current focused window URL in WebView context, or undefined. */
export async function getCurrentWindowUrl(): Promise<string | undefined> {
  if (!(await isWebViewContext())) {
    return undefined;
  }
  try {
    return String(await driver.execute('return window.location.href;'));
  } catch {
    return undefined;
  }
}

interface MatchedWebViewPage {
  url: string;
  webviewPageId: string;
}

/**
 * Find a detailed Appium context page whose URL matches `page`.
 * Uses getContexts({ returnDetailedContexts }) — same source WDIO switchContext uses.
 */
async function findWindowByPage(
  page: PageUrlKey,
  siteCode: string
): Promise<MatchedWebViewPage | undefined> {
  const contexts = await driver.getContexts({
    returnDetailedContexts: true,
    isAndroidWebviewVisible: true,
  });
  console.log('[findWindowByPage] contexts=', JSON.stringify(contexts, null, 2));
  for (const ctx of contexts) {
    if (typeof ctx === 'string' || ctx.id === 'NATIVE_APP') {
      continue;
    }
    const url = ctx.url ?? '';
    const webviewPageId = 'webviewPageId' in ctx && ctx.webviewPageId ? String(ctx.webviewPageId) : '';
    if (!url || !webviewPageId) {
      continue;
    }
    if (matchPageByUrl(url, page, siteCode)) {
      return { url, webviewPageId };
    }
  }
  return undefined;
}

/** Wait until a matching page appears in detailed getContexts(). */
async function waitForWindowByPage(
  page: PageUrlKey,
  siteCode: string,
  timeoutMs = 5000
): Promise<MatchedWebViewPage | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const match = await findWindowByPage(page, siteCode);
    if (match) {
      return match;
    }
    await driver.pause(300);
  }
  return undefined;
}

/**
 * Switch to the WebView window whose URL matches the page pattern.
 * Waits via detailed getContexts, then focuses with switchToWindow(webviewPageId).
 * Requires WebView context. Throws if no matching window is found.
 */
export async function switchToWindowByPage(
  page: PageUrlKey = 'site',
  siteCode = getRunConfig().site,
  waitTimeMs = 5000
): Promise<void> {
  if (!(await isWebViewContext())) {
    throw new Error('switchToWindowByPage: not in WebView context');
  }

  const currentHref = await getCurrentWindowUrl();
  if (currentHref && matchPageByUrl(currentHref, page, siteCode)) {
    return;
  }

  const match = await waitForWindowByPage(page, siteCode, waitTimeMs);
  if (!match) {
    throw new Error(`switchToWindowByPage: no browser page matched page=${page}`);
  }

  await driver.switchToWindow(match.webviewPageId);

  const href = await getCurrentWindowUrl();
  if (href && matchPageByUrl(href, page, siteCode)) {
    return;
  }

  throw new Error(`switchToWindowByPage: switched but URL did not match page=${page}`);
}

// ===========================================================================
// 3) Prepare — context + window + layout
// ===========================================================================

/**
 * Prepare a Hybris WebView page before actions:
 * switchToWebView + switchToWindowByPage + layout ready.
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
    await switchToWindowByPage(urlKey, getRunConfig().site, timeout);
  } catch {
    return false;
  }
  return layout.waitForDisplayed({ timeout }).catch(() => false);
}

// ===========================================================================
// 4) Detect — URL match + current page
// ===========================================================================

/** URL fragments for fragment-matched pages (bc/pd/site use path helpers). */
function pageUrlPatterns(page: Exclude<PageUrlKey, 'bc' | 'pd' | 'site'>): string[] {
  const patterns: Record<Exclude<PageUrlKey, 'bc' | 'pd' | 'site'>, string[]> = {
    cart: ['/cart'],
    checkout: ['/checkout'],
    mypageWishlist: ['mypage/wishlist'],
    mypageProfile: ['mypage/profile-setting'],
    wdsLogin: ['wds.samsung.com', 'sts.secsso.net'],
    useinsider: ['useinsider'],
  };
  return patterns[page];
}

/** Site gate: `ae/` so CN matches via host `samsung.com.cn/`. */
function isOnSite(href: string, siteCode: string): boolean {
  return href.toLowerCase().includes(`${siteCode.toLowerCase()}/`);
}

/**
 * Path segments after site root, or null if not this site.
 * Global: /ae/smartphones/... → ['smartphones', ...]
 * CN: samsung.com.cn/smartphones/... → ['smartphones', ...]
 */
function getSiteUrlSegments(href: string, siteCode: string): string[] | null {
  if (!isOnSite(href, siteCode)) {
    return null;
  }
  try {
    const segments = new URL(href).pathname.toLowerCase().split('/').filter(Boolean);
    const site = siteCode.toLowerCase();
    if (segments[0] === site) {
      return segments.slice(1);
    }
    return segments;
  } catch {
    return null;
  }
}

function hrefIncludesAny(href: string, patterns: string[]): boolean {
  const url = href.toLowerCase();
  return patterns.some((p) => url.includes(p.toLowerCase()));
}

/** BC: /{category}/{family}/buy/ */
function isBcUrl(href: string, siteCode: string): boolean {
  const segs = getSiteUrlSegments(href, siteCode);
  return segs !== null && segs[2] === 'buy';
}

/** PD: .../{sku}/buy/ or product path without buy (not cart/checkout/...). */
function isPdUrl(href: string, siteCode: string): boolean {
  const segs = getSiteUrlSegments(href, siteCode);
  if (!segs) {
    return false;
  }
  const reserved = new Set([
    'cart',
    'checkout',
    'wishlist',
    'mypage',
    'my-account',
    'search',
    'multi-search',
  ]);
  if (reserved.has(segs[0] ?? '')) {
    return false;
  }
  if (segs[3] === 'buy') {
    return true;
  }
  return !segs.includes('buy') && segs.length >= 3;
}

/**
 * True when href matches the given page.
 * site → isOnSite | bc/pd → path structure | others → fragment (+ site gate)
 */
function matchPageByUrl(href: string, page: PageUrlKey, siteCode: string): boolean {
  if (page === 'site') {
    return isOnSite(href, siteCode);
  }
  if (page === 'bc') {
    return isBcUrl(href, siteCode);
  }
  if (page === 'pd') {
    return isPdUrl(href, siteCode);
  }

  const matched = hrefIncludesAny(href, pageUrlPatterns(page));
  if (page === 'wdsLogin' || page === 'useinsider') {
    return matched;
  }
  return isOnSite(href, siteCode) && matched;
}

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
    'mypageWishlist',
    'mypageProfile',
    'bc',
    'pd',
  ];

  for (const page of ordered) {
    if (matchPageByUrl(href, page, site)) {
      return page;
    }
  }

  if (await hasWebViewBcSignature()) {
    return 'bc';
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
    const page = await detectCurrentPageInWebView((await getCurrentWindowUrl()) ?? '');
    return { page, context };
  }

  return { page: await detectCurrentPageInNative(), context };
}

export async function isCurrentPage(
  page: Exclude<CurrentPage, 'unknown'>
): Promise<boolean> {
  return (await getCurrentPage()).page === page;
}
