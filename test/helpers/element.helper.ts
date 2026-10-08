/**
 * Element helpers — query, state, and interaction with WebDriver/DOM elements.
 *
 * Belongs here:
 *   - existence / visibility checks
 *   - clicks (native WDIO, JS, touch events)
 *   - reading labels / text matching
 *   - "scroll until element is found" orchestration (calls gesture.helper for motion)
 *
 * Does NOT belong here:
 *   - raw swipe/scroll/tap motion → gesture.helper.ts
 */

import { scrollElementToCenter, scrollWebViewDown, scrollDown } from './gesture.helper';
import type { WaitForOptions } from 'webdriverio';

const DEFAULT_TIMEOUT_MS = 3000;

/** isDisplayed() that never throws. */
export async function isDisplayedOrFalse(element: ChainablePromiseElement): Promise<boolean> {
  return await element.isDisplayed().catch(() => false);
}

/** waitForDisplayed() that never throws. */
export async function waitForDisplayedOrFalse(element: ChainablePromiseElement, options?: WaitForOptions): Promise<boolean> {
  return await element.waitForDisplayed(options).then(() => true).catch(() => false);
}

/** Clicks the element if it is displayed. (default 0 = check now). */
export async function clickIfDisplayed(element: ChainablePromiseElement, timeout = 0): Promise<boolean> {
  const displayed = timeout > 0 ? await waitForDisplayedOrFalse(element, {timeout:timeout}) : await isDisplayedOrFalse(element);
  if (!displayed) return false;
  await scrollAndWdioClick(element);
  return true;
}

/**
 * WebView existence: prefer document.querySelector (CSS + execute/sync),
 * fall back to Appium isExisting when selector is not CSS or execute fails.
 */
export async function isExistingInWebView(el: ChainablePromiseElement): Promise<boolean> {
  try {
    const resolved = await el;
    const selector = typeof resolved.selector === 'string' ? resolved.selector : '';
    if (selector) {
      const found = await driver
        .execute('return Boolean(document.querySelector(arguments[0]));', selector)
        .catch(() => null);
      if (found !== null) {
        return Boolean(found);
      }
    }
    return resolved.isExisting().catch(() => false);
  } catch {
    return false;
  }
}

/**
 * Scroll the WebView document down until the target exists in the DOM
 * (Hybris lazy-rendered nodes). Uses scrollWebViewDown — not native scrollGesture.
 */
export async function scrollUntilVisibleInWebView(
  target: ChainablePromiseElement,
  maxAttempts = 6
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await isExistingInWebView(target)) {
      console.warn('[scrollUntilVisibleInWebView] found, return true');
      return true;
    }
    console.warn(`[scrollUntilVisibleInWebView] not found, scroll down attempt=${attempt + 1}`);
    await scrollWebViewDown();
  }
  return isExistingInWebView(target);
}

/** Runs fn without the UI idle wait — only for screens that never go idle (CN login slider), where every action would wait it out. */
export async function withoutIdleWait<T>(fn: () => Promise<T>): Promise<T> {
  const { waitForIdleTimeout } = (await driver.getSettings()) as { waitForIdleTimeout: number };
  await driver.updateSettings({ waitForIdleTimeout: 0 });
  try {
    return await fn();
  } finally {
    await driver.updateSettings({ waitForIdleTimeout });
  }
}

/**
 * Native list scroll until locator.exists (Katalon scrollUntilElementFound).
 * Uses mobile scrollGesture via scrollDown — for Native lists, not WebView DOM.
 */
export async function scrollUntilVisible(
  locator: ChainablePromiseElement,
  maxAttempts = 10
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await locator.isExisting().catch(() => false)) {
      return true;
    }
    await scrollDown();
  }
  return false;
}

export async function clickElement(
  element: ChainablePromiseElement,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  await element.waitForDisplayed({ timeout });
  await element.click();
}

/** Clicks the first displayed match — for selectors that also match hidden copies (e.g. CN cart's 0x0 checkout button). */
export async function clickFirstDisplayed(
  elements: ReturnType<typeof $$>,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 10000;
  let target: WebdriverIO.Element | undefined;
  await driver.waitUntil(
    async () => {
      for (const el of await elements) {
        if (await el.isDisplayed().catch(() => false)) {
          target = el;
          return true;
        }
      }
      return false;
    },
    { timeout, interval: 300, timeoutMsg: `no displayed element within ${timeout}ms` }
  );
  await target!.click();
}

/** Waits for the element to be displayed, then types the value (clickElement counterpart for inputs). */
export async function setElementValue(
  element: ChainablePromiseElement,
  value: string,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  await element.waitForDisplayed({ timeout });
  await element.setValue(value);
}

/** DOM HTMLElement.click() — overlay / position:fixed / hidden input. */
export async function jsClick(el: ChainablePromiseElement | WebdriverIO.Element): Promise<void> {
  const script = "arguments[0].click();";
  await driver.execute(script, await el);
}

export async function jsTouchStart(el: ChainablePromiseElement | WebdriverIO.Element): Promise<void> {
  const script = "arguments[0].dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));";
  await driver.execute(script, await el);  
}
/**
 * scrollIntoView (center) then HTMLElement.click().
 * Failures (missing element etc.) are swallowed after WDIO fallback attempt.
 */
export async function scrollAndJsClick(
  el: ChainablePromiseElement | WebdriverIO.Element
): Promise<void> {
  await scrollElementToCenter(el).catch(() => undefined);
  try {
    await jsClick(el);
    console.warn('[scrollAndJsClick] jsClick done');
  } catch {
    console.warn('[scrollAndJsClick] jsClick threw, fallback to WDIO click');
    await el.click().catch((err) => {
      console.warn('[scrollAndJsClick] WDIO click also failed:', (err as Error)?.message ?? err);
    });
  }
}

/**
 * scrollIntoView (center) then WDIO element.click().
 * Prefer for plan/radio cards that ignore HTMLElement.click().
 * Missing element / both clicks failing → catch and continue (no throw).
 */
export async function scrollAndWdioClick(
  el: ChainablePromiseElement | WebdriverIO.Element
): Promise<void> {
  await scrollElementToCenter(el).catch(() => undefined);
  try {
    await el.click();
    console.warn('[scrollAndWdioClick] WDIO click done');
  } catch {
    console.warn('[scrollAndWdioClick] WDIO click threw, fallback to jsClick');
    await jsClick(el).catch((err) => {
      console.warn('[scrollAndWdioClick] jsClick also failed:', (err as Error)?.message ?? err);
    });
  }
}

/** Prefer getText(); fall back to content-desc. */
export async function getElementLabel(element: ChainablePromiseElement): Promise<string> {
  if (!(await isDisplayedOrFalse(element))) {
    return '';
  }
  const text = await element.getText().catch(() => '');
  if (text?.trim()) {
    return text.trim();
  }
  const desc = await element.getAttribute('content-desc').catch(() => '');
  return (desc ?? '').trim();
}

/** For widgets that only respond to touchstart, not click() (e.g. cart quantity stepper). */
export async function dispatchTouchStart(element: ChainablePromiseElement): Promise<void> {
  await driver.execute(
    "arguments[0].dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));",
    await element
  );
}

export function matchesText(actual: string, expected: string | RegExp): boolean {
  if (expected instanceof RegExp) {
    return expected.test(actual);
  }
  return actual.localeCompare(expected.trim(), undefined, { sensitivity: 'accent' }) === 0;
}
