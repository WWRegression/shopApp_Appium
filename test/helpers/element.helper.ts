import { scrollElementToCenter } from './gesture.helper';

const DEFAULT_TIMEOUT_MS = 10000;

/** isDisplayed() that never throws. */
export async function isDisplayedSafe(element: ChainablePromiseElement): Promise<boolean> {
  return element.isDisplayed().catch(() => false);
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

export async function clickElement(
  element: ChainablePromiseElement,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  await element.waitForDisplayed({ timeout });
  await element.click();
}

/** Clicks in the DOM instead of tapping — overlay / position:fixed / hidden input. */
export async function jsClick(el: ChainablePromiseElement | WebdriverIO.Element): Promise<void> {
  await driver.execute('arguments[0].click();', await el);
}

/** Scroll into view, then HTMLElement.click(). */
export async function scrollAndJsClick(
  el: ChainablePromiseElement | WebdriverIO.Element
): Promise<void> {
  await console.warn('[scrollAndJsClick] start');
  await scrollElementToCenter(el).catch(() => undefined);
  await jsClick(el);
  await console.warn('[scrollAndJsClick] jsClick done');
}

/**
 * Scroll into view, then WDIO element.click() (for controls that ignore jsClick, e.g. SC+).
 */
export async function scrollAndWdioClick(el: ChainablePromiseElement): Promise<void> {
  await scrollElementToCenter(el).catch(() => undefined);
  await el.click();
}

/** Prefer getText(); fall back to content-desc. */
export async function getElementLabel(element: ChainablePromiseElement): Promise<string> {
  if (!(await isDisplayedSafe(element))) {
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
