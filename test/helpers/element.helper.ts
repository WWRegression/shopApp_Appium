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
