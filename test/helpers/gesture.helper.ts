/**
 * Gesture helpers (Katalon Keywords/ScrollActions.groovy 참고).
 * Native scroll/swipe + element까지 스크롤.
 */

export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

async function windowSize(): Promise<{ width: number; height: number }> {
  return driver.getWindowSize();
}

/** UiAutomator2 mobile: swipeGesture */
export async function swipeByBoundary(
  direction: ScrollDirection,
  percent = 0.95,
  top = 300
): Promise<boolean> {
  const result = await driver.execute('mobile: swipeGesture', {
    left: 100,
    top,
    width: 200,
    height: 800,
    direction,
    percent,
  });
  await driver.pause(500);
  return Boolean(result);
}

/** UiAutomator2 mobile: scrollGesture */
export async function scrollByBoundary(
  direction: ScrollDirection,
  percent = 1,
  options?: { left?: number; top?: number; width?: number; height?: number; attempts?: number }
): Promise<void> {
  const attempts = options?.attempts ?? 1;
  for (let i = 0; i < attempts; i++) {
    await driver.execute('mobile: scrollGesture', {
      left: options?.left ?? 100,
      top: options?.top ?? 100,
      width: options?.width ?? 200,
      height: options?.height ?? 800,
      direction,
      percent,
    });
  }
}

/** W3C pointer scroll (ratio of screen height). */
export async function scrollDownWithW3CActions(
  startRatio = 0.8,
  endRatio = 0.1
): Promise<void> {
  const { width, height } = await windowSize();
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height * startRatio);
  const endY = Math.floor(height * endRatio);

  await driver
    .action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ x: startX, y: startY, duration: 0 })
    .down()
    .move({ x: startX, y: endY, duration: 1000 })
    .up()
    .perform();
}

export async function scrollUpWithW3CActions(
  startRatio = 0.2,
  endRatio = 0.8
): Promise<void> {
  await scrollDownWithW3CActions(startRatio, endRatio);
}

/**
 * Scroll until selector is present (Katalon scrollUntilElementFound).
 */
export async function scrollUntilElementFound(
  selector: string,
  maxAttempts = 10,
  startRatio = 0.8,
  endRatio = 0.1
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const el = $(selector);
    if (await el.isExisting().catch(() => false)) {
      return true;
    }
    await scrollDownWithW3CActions(startRatio, endRatio);
    await driver.pause(300);
  }
  return false;
}

/** Scroll element into center via JS (WebView). */
export async function scrollElementToCenter(
  element: ChainablePromiseElement
): Promise<void> {
  await driver.execute(
    // runs in WebView browser context
    'arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });',
    element
  );
  await driver.pause(300);
}
