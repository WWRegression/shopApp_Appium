import { scrollElementToCenter } from './gesture.helper';
import { getCurrentWebViewPage } from './context.helper';
import { normalizeProductName } from './data.helper';
import type { CategoryMismatch } from '../pages/shop.page';

const DEFAULT_TIMEOUT_MS = 10000;

/** isDisplayed() that never throws. */
export async function isDisplayedSafe(element: ChainablePromiseElement): Promise<boolean> {
  return element.isDisplayed().catch(() => false);
}

export async function clickElement(
  element: ChainablePromiseElement,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  await element.waitForDisplayed({ timeout });
  await element.click();
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

/** Option radios are visually hidden behind a styled label — native click gets intercepted. */
export async function clickOptionInput(el: ChainablePromiseElement | WebdriverIO.Element): Promise<void> {
  await scrollElementToCenter(el as ChainablePromiseElement).catch(() => undefined);
  await driver.execute('arguments[0].click();', await el);
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

export function verifyProductNameMatch(
  mismatches: CategoryMismatch[],
  pfName: string | null,
  bcPdName: string | null,
  L0Title: string,
  L1Title?: string,
): void {
  if (pfName === null || bcPdName === null) {
    mismatches.push(
      `PF/PD product name not compared: ${L0Title} > ${L1Title} (PF: "${pfName}", BC/PD: "${bcPdName}")`
    );
    return;
  }

  if (matchesText(pfName, bcPdName)) {
    console.log(`PF/PD product name match: ${L0Title} > ${L1Title} (PF: "${pfName}", BC/PD: "${bcPdName}")`);
    return;
  }

  mismatches.push(
    `PF/PD product name mismatch: ${L0Title} > ${L1Title} (PF: "${pfName}", BC/PD: "${bcPdName}")`
  );
}

export async function getBcPdProductName(
  pages: {
    pd: { getPdProductName(): Promise<string>; getNativePdProductName(name: string): Promise<string> };
    bc: { getBcProductName(): Promise<string> };
  },
  productName?: string | null,
): Promise<string | null> {
  const { page, context } = await getCurrentWebViewPage({ waitMs: 5000 });

  if (page === 'pd' && context === 'webview') {
    return normalizeProductName(await pages.pd.getPdProductName());
  }
  if (page === 'bc' && context === 'webview') {
    return normalizeProductName(await pages.bc.getBcProductName());
  }
  if (context === 'native') {
    if (!productName) {
      return null;
    }
    return normalizeProductName(await pages.pd.getNativePdProductName(productName));
  }

  return null;
}
