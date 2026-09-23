import { getRunConfig } from '../../config/run.config';
import { getAppPackage } from '../../config/site';

/**
 * Hybrid context helpers — Native ↔ Hybris WebView.
 *
 * Layers:
 *   1) Context  — Native ↔ WEBVIEW_<targetPackage>
 *   2) Window   — URL-matched window focus
 *   3) Prepare  — context + window + layout
 *   4) Detect   — which Hybris WebView page (Native context OK)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContextType = 'native' | 'webview';

/** Native app screens (Header / BNB). Not matched by URL. */
export type NativePage = 'home' | 'shop' | 'offers' | 'search' | 'account' | 'nativePd';

/** URL detect priority — specific fragments first, then bc/pd. */
export const WEBVIEW_DETECT_ORDER = [
  'wdsLogin',
  'cart',
  'checkout',
  'mypageWishlist',
  'mypageProfile',
  'bc',
  'pd',
] as const;

/** Hybris WebView screens (derived from WEBVIEW_DETECT_ORDER). */
export type WebViewPage = (typeof WEBVIEW_DETECT_ORDER)[number];

export type CurrentPage = NativePage | WebViewPage | 'unknown';

/** WebView URL lookup keys (Navigate / Detect). */
export type PageUrlKey = WebViewPage | 'site' | 'useinsider';

export interface WebViewPageResult {
  page: WebViewPage | 'unknown';
  context: ContextType;
}

export interface GetCurrentWebViewPageOptions {
  /** Poll detailed contexts when URL is not ready yet (e.g. after PF card). Default 0. */
  waitMs?: number;
}

// ---------------------------------------------------------------------------
// Package
// ---------------------------------------------------------------------------

/** App package for the current site (or capability fallback). */
export function targetPackage(): string {
  return (
    getAppPackage(getRunConfig().siteCode) ||
    (browser.capabilities as WebdriverIO.Capabilities)['appium:appPackage'] ||
    ''
  );
}

/** Always `webview_<targetPackage>` — the only WebView context we switch to. */
function appWebViewContextName(): string {
  const pkg = targetPackage();
  return pkg ? `webview_${pkg.toLowerCase()}` : '';
}

// ===========================================================================
// 1) Context — Native ↔ WEBVIEW_<targetPackage>
// ===========================================================================

export async function getCurrentContext(): Promise<string> {
  return String(await driver.getContext());
}

export async function isNativeContext(contextName?: string): Promise<boolean> {
  const ctx = (contextName ?? (await getCurrentContext())).toUpperCase();
  return ctx === 'NATIVE_APP';
}

/** True when current (or given) context is WEBVIEW_<targetPackage>. */
export async function isWebViewContext(contextName?: string): Promise<boolean> {
  const expected = appWebViewContextName();
  if (!expected) {
    return false;
  }
  const ctx = (contextName ?? (await getCurrentContext())).toLowerCase();
  return ctx === expected;
}

/**
 * True when WEBVIEW_<targetPackage> is in getContexts().
 * waitTimeMs > 0 → Appium waits for a webview before returning the list.
 */
export async function hasAppWebViewContext(waitTimeMs = 0): Promise<boolean> {
  const expected = appWebViewContextName();
  if (!expected) {
    return false;
  }
  try {
    const contexts = await driver.getContexts({ waitForWebviewMs: waitTimeMs });
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
 * Switch to WEBVIEW_<targetPackage> only.
 */
export async function switchToWebView(waitTimeMs = 5000): Promise<boolean> {
  const pkg = targetPackage();
  if (!pkg) {
    return false;
  }

  const deadline = Date.now() + waitTimeMs;
  for (;;) {
    try {
      if (await isWebViewContext()) {
        return true;
      }
      const remaining = Math.max(0, deadline - Date.now());
      if (await hasAppWebViewContext(remaining)) {
        await driver.switchContext(`WEBVIEW_${pkg}`);
        if (await isWebViewContext()) {
          return true;
        }
      }
    } catch {
      // WebView can be torn down/recreated mid-transition ("no such window") — retry below if time remains.
    }

    if (Date.now() >= deadline) {
      return false;
    }
    await driver.pause(300);
  }
}

/**
 * Stale app WebView or non-app context → Native.
 * Returns the context type after recovery.
 */
export async function recoverToNativeIfStale(): Promise<ContextType> {
  const currentCtx = await getCurrentContext();

  if (await isNativeContext(currentCtx)) {
    return 'native';
  }

  if (await isWebViewContext(currentCtx)) {
    if (!(await hasAppWebViewContext())) {
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

interface MatchedWebViewPage {
  url: string;
  webviewPageId: string;
}

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

/** App WEBVIEW_<targetPackage> windows from detailed getContexts (no context switch). */
export async function getDetailedWebViewWindows(): Promise<MatchedWebViewPage[]> {
  const expected = appWebViewContextName();
  if (!expected) {
    return [];
  }

  try {
    const contexts = await driver.getContexts({
      returnDetailedContexts: true,
      isAndroidWebviewVisible: true,
    });

    const windows: MatchedWebViewPage[] = [];
    for (const ctx of contexts) {
      if (typeof ctx === 'string') {
        continue;
      }
      if (ctx.id.toLowerCase() !== expected) {
        continue;
      }
      const url = ctx.url ?? '';
      const webviewPageId =
        'webviewPageId' in ctx && ctx.webviewPageId ? String(ctx.webviewPageId) : '';
      if (!url || !webviewPageId) {
        continue;
      }
      windows.push({ url, webviewPageId });
    }
    return windows;
  } catch {
    // WDIO may throw when WebView exists but has no pages (e.g. after native back).
    return [];
  }
}

async function findWindowByPage(
  page: PageUrlKey,
  siteCode: string
): Promise<MatchedWebViewPage | undefined> {
  for (const window of await getDetailedWebViewWindows()) {
    if (matchPageByUrl(window.url, page, siteCode)) {
      return window;
    }
  }
  return undefined;
}

/**
 * Focus the WebView window whose URL matches `page`.
 * Requires WebView context. Throws if no matching window is found.
 *
 * Cheap path first: if the focused window already matches, skip detailed getContexts.
 * Only then poll with returnDetailedContexts (expensive) every 500ms.
 * Deadline is checked *before* each expensive call so one slow getContexts cannot
 * silently overrun the caller's budget by tens of seconds.
 */
export async function switchToWindowByPage(
  page: PageUrlKey = 'site',
  waitTimeMs = 5000
): Promise<void> {
  if (!(await isWebViewContext())) {
    throw new Error('switchToWindowByPage: not in WebView context');
  }

  const siteCode = getRunConfig().siteCode;
  const deadline = Date.now() + Math.max(0, waitTimeMs);

  for (;;) {
    if (deadline - Date.now() <= 0) {
      throw new Error(`switchToWindowByPage: no browser page matched page=${page}`);
    }

    // 1) Cheap: focused window href (one executeScript) — no detailed contexts.
    try {
      const href = await getCurrentWindowUrl();
      if (href && matchPageByUrl(href, page, siteCode)) {
        await console.warn('[switchToWindowByPage] already on the page, href matches page');
        return;
      }
    } catch {
      // Focused window may be mid-navigation — fall through to detailed scan.
    }

    if (deadline - Date.now() <= 0) {
      throw new Error(`switchToWindowByPage: no browser page matched page=${page}`);
    }

    // 2) Expensive: scan all WebView windows via detailed getContexts.
    const match = await findWindowByPage(page, siteCode);
    if (match) {
      try {
        await driver.switchToWindow(match.webviewPageId);
        await console.warn('[switchToWindowByPage] window switched');
        return;
      } catch {
        await console.warn('[switchToWindowByPage] window switch failed');
      }
    }

    if (Date.now() >= deadline) {
      await console.warn('[switchToWindowByPage] deadline reached');
      throw new Error(`switchToWindowByPage: no browser page matched page=${page}`);
    }
    await driver.pause(Math.min(500, Math.max(0, deadline - Date.now())));
    await console.warn('[switchToWindowByPage] paused');
  }
}

// ===========================================================================
// 3) Prepare — context + window + layout
// ===========================================================================

/**
 * Prepare a Hybris WebView page before actions:
  * Returns false when context/window/layout is not ready within `timeout` (default 10s).
 */
export const WEBVIEW_PAGE_READY_MS = 10000;

export async function prepareWebViewPage(
  page: PageUrlKey,
  layout: ChainablePromiseElement,
  timeout = WEBVIEW_PAGE_READY_MS
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  const siteCode = getRunConfig().siteCode;

  // Fast-path: already on the target WebView page with layout visible — skip switches.
  if (await isWebViewContext()) {
    const href = await getCurrentWindowUrl().catch(() => undefined);
    if (href && matchPageByUrl(href, page, siteCode)) {
      return true;
    }
  }

  for (;;) {
    const remaining = Math.max(0, deadline - Date.now());
    if (remaining === 0) {
      return false;
    }
    
    if (await switchToWebView(remaining)) {
      await console.warn(`[${page} prepareWebViewPage] webview context switched`);

      const winBudget = Math.max(0, deadline - Date.now());
      if (winBudget < 200) {
        return false;
      }

      try {
        await switchToWindowByPage(page, winBudget);
        await console.warn(`[${page} prepareWebViewPage] window ${page} switched`);
        return true;
      } catch {
        // Window/context can flip again mid-check ("no such window") — fall through to retry below.
      }
    }

    if (Date.now() >= deadline) {
      return false;
    }
    await driver.pause(300);
  }
}

// ===========================================================================
// 4) Detect — which Hybris WebView page
// ===========================================================================

/**
 * Identify WebView page from detailed contexts (Native context OK — no switch).
 * waitMs > 0 polls until a match or timeout (e.g. after PF card tap).
 */
async function detectWebViewPageFromContexts(waitMs = 0): Promise<WebViewPage | 'unknown'> {
  const siteCode = getRunConfig().siteCode;
  const deadline = Date.now() + waitMs;

  do {
    const urls = (await getDetailedWebViewWindows()).map((window) => window.url);
    const page = matchWebViewPageFromUrls(urls, siteCode);
    if (page !== 'unknown') {
      return page;
    }
    if (waitMs === 0) {
      break;
    }
    await driver.pause(300);
  } while (Date.now() < deadline);

  return 'unknown';
}

/**
 * Identify which Hybris WebView page is showing.
 * Recovers stale context to Native; does not switch into WebView for actions.
 */
export async function getCurrentWebViewPage(
  options?: GetCurrentWebViewPageOptions
): Promise<WebViewPageResult> {
  const waitMs = options?.waitMs ?? 0;
  const context = await recoverToNativeIfStale();
  const siteCode = getRunConfig().siteCode;

  if (context === 'webview') {
    const href = (await getCurrentWindowUrl()) ?? '';
    const page = matchWebViewPageFromUrls([href], siteCode);
    return { page, context };
  }

  return { page: await detectWebViewPageFromContexts(waitMs), context };
}

export async function isCurrentWebViewPage(
  page: WebViewPage,
  options?: GetCurrentWebViewPageOptions
): Promise<boolean> {
  return (await getCurrentWebViewPage(options)).page === page;
}


// ===========================================================================
// URL match (shared by Window + Detect)
// ===========================================================================

type FragmentPage = Exclude<PageUrlKey, 'bc' | 'pd' | 'site'>;

function pageUrlPatterns(page: FragmentPage): string[] {
  const patterns: Record<FragmentPage, string[]> = {
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
    return segments[0] === site ? segments.slice(1) : segments;
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
  if (siteCode === 'US') {
    return !segs.includes('buy') && segs.length >= 2;
  }
  return !segs.includes('buy') && segs.length >= 3;
}

/** True when href matches the given page. Pure sync — no I/O, so callers must not await. */
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

function matchWebViewPageFromUrls(urls: string[], siteCode: string): WebViewPage | 'unknown' {
  for (const page of WEBVIEW_DETECT_ORDER) {
    if (urls.some((href) => matchPageByUrl(href, page, siteCode))) {
      return page;
    }
  }
  return 'unknown';
}