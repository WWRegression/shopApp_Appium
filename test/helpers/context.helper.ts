import { getRunConfig } from '../../config/run.config';
import { getAppPackage } from '../../config/site';
import { isDisplayedSafe } from './element.helper';

/**
 * Hybrid context helpers — Native ↔ Hybris WebView.
 */

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

export async function getAvailableContexts(): Promise<string[]> {
  const contexts = await driver.getContexts();
  return contexts.map((ctx) => String(ctx));
}

export async function isNativeContext(contextName?: string): Promise<boolean> {
  const name = contextName ?? (await getCurrentContext());
  const upper = name.toUpperCase();
  return upper === 'NATIVE_APP' || upper.includes('NATIVE');
}

/** In-app Hybris WebView context (excludes Chrome). */
export async function isWebViewContext(
  appPackage = targetPackage(),
  contextName?: string
): Promise<boolean> {
  const name = contextName ?? (await getCurrentContext());
  const lower = name.toLowerCase();
  const pkg = appPackage.toLowerCase();
  return (
    lower.includes('webview') &&
    !lower.includes('chrome') &&
    (!pkg || lower.endsWith(pkg))
  );
}

/**
 * Recover to Native when the current context is app WebView but no app WebView
 * context appears in getAvailableContexts(). Does not switch to WebView.
 */
export async function recoverToNativeIfStale(
  appPackage = targetPackage()
): Promise<ContextType> {
  const named = await getCurrentContext();
  const available = await getAvailableContexts();

  if (await isNativeContext(named)) {
    return 'native';
  }

  if (await isWebViewContext(appPackage, named)) {
    let hasAppWebViewContext = false;
    for (const ctx of available) {
      if (await isWebViewContext(appPackage, ctx)) {
        hasAppWebViewContext = true;
        break;
      }
    }
    if (!hasAppWebViewContext) {
      await switchToNative();
      return 'native';
    }
    return 'webview';
  }

  return 'native';
}

/**
 * 현재 WebView에서 활성 window의 URL을 반환한다.
 * WebView context가 아니거나 JS 실행에 실패하면 undefined.
 */
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

  if (hrefMatches(href, pageUrlPatterns('wdsLogin', site))) {
    return 'wdsLogin';
  }
  if (hrefMatches(href, pageUrlPatterns('cart', site))) {
    return 'cart';
  }
  if (hrefMatches(href, pageUrlPatterns('checkout', site))) {
    return 'checkout';
  }
  if (hrefMatches(href, pageUrlPatterns('wish', site))) {
    return 'wish';
  }
  if (hrefMatches(href, pageUrlPatterns('address', site))) {
    return 'address';
  }

  const isBcOrPd =
    hrefMatches(href, pageUrlPatterns('bc', site)) ||
    hrefMatches(href, pageUrlPatterns('pd', site));
  if (isBcOrPd) {
    if (await hasWebViewBcSignature()) {
      return 'bc';
    }
    if (hrefMatches(href, pageUrlPatterns('bc', site))) {
      return 'bc';
    }
    if (hrefMatches(href, pageUrlPatterns('pd', site))) {
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

  // TODO: home / shop / offers / account / nativePd — BasePage (getSelectedBnbMenu, getHeaderTitle)
  return 'unknown';
}

/**
 * Detect the current page from the active screen.
 * Does not switch to WebView for guessing. May switch to Native once to recover a stale WebView handle.
 */
export async function getCurrentPage(): Promise<CurrentPageResult> {
  const context = await recoverToNativeIfStale();

  if (context === 'webview') {
    const href = await getWebViewUrl();
    const page = await detectCurrentPageInWebView(href ?? '');
    return { page, context };
  }

  const page = await detectCurrentPageInNative();
  return { page, context };
}

export async function isCurrentPage(page: Exclude<CurrentPage, 'unknown'>): Promise<boolean> {
  return (await getCurrentPage()).page === page;
}

export async function waitForWebView(
  timeoutSec = 5,
  appPackage = targetPackage()
): Promise<boolean> {
  const deadline = Date.now() + timeoutSec * 1000;

  while (Date.now() < deadline) {
    const contexts = await getAvailableContexts();
    let found = false;
    for (const ctx of contexts) {
      if (await isWebViewContext(appPackage, ctx)) {
        found = true;
        break;
      }
    }
    if (found) {
      return true;
    }
    await driver.pause(300);
  }

  return false;
}

export async function switchToNative(): Promise<void> {
  const named = await getCurrentContext();
  if (await isNativeContext(named)) return;
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
    const named = await getCurrentContext();
    if (await isWebViewContext(appPackage, named)) {
      return true;
    }

    if (!(await waitForWebView(waitTimeSec, appPackage))) {
      return false;
    }

    const contexts = await getAvailableContexts();
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
    return isWebViewContext(appPackage, await getCurrentContext());
  } catch {
    return false;
  }
}

/**
 * Switch to the WebView window whose URL matches the page pattern.
 * Handles are opaque IDs — URL is only readable after switchToWindow.
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

  const urlMatchesPage = (href: string): boolean => {
    const url = href.toLowerCase();
    const onSite = sitePatterns.some((p) => url.includes(p.toLowerCase()));
    return onSite && targetUrls.some((p) => url.includes(p.toLowerCase()));
  };

  const currentHref = await getWebViewUrl();
  if (currentHref && urlMatchesPage(currentHref)) {
    return true;
  }

  for (const handle of await driver.getWindowHandles()) {
    try {
      await driver.switchToWindow(handle);
      const href = await getWebViewUrl();
      if (href && urlMatchesPage(href)) {
        return true;
      }
    } catch {
      // unresponsive window — skip
    }
  }

  return false;
}

/**
 * WebView 전환 + URL 매칭(switchUrl)까지는 성공해도 DOM이 아직 안 그려졌을 수 있어,
 * 페이지 루트 레이아웃이 실제로 뜨는 것까지 확인하고 그 결과를 반환한다.
 * 각 page의 prepareXxxPage()는 이 헬퍼에 자기 urlKey/layout 로케이터만 넘기면 된다.
 */
export async function preparePage(
  urlKey: PageUrlKey,
  layout: ChainablePromiseElement,
  timeout = 10000
): Promise<boolean> {
  await switchToWebView();
  await switchUrl(urlKey);
  return layout.waitForDisplayed({ timeout }).catch(() => false);
}
