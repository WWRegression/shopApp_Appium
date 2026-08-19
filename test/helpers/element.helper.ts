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
export async function readElementLabel(element: ChainablePromiseElement): Promise<string> {
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

export function matchesText(actual: string, expected: string | RegExp): boolean {
  if (expected instanceof RegExp) {
    return expected.test(actual);
  }
  return actual.localeCompare(expected.trim(), undefined, { sensitivity: 'accent' }) === 0;
}
