/**
 * Common swipe/scroll gestures. Migrated from Katalon Keywords/ScrollActions.groovy
 * (fixed Mobile.delay waits removed in favor of explicit WDIO waits at call sites).
 *
 * Everything below funnels through two low-level primitives — gestureByBoundary (boundary
 * box) and gestureByElement (relative to an element) — so the actual `mobile: swipeGesture` /
 * `mobile: scrollGesture` command-building logic exists in exactly one place each.
 */

export type GestureDirection = 'up' | 'down' | 'left' | 'right';
export type GestureKind = 'swipe' | 'scroll';

export interface GestureBoundary {
  left: number;
  top: number;
  width: number;
  height: number;
}

const DEFAULT_BOUNDARY: GestureBoundary = { left: 100, top: 300, width: 200, height: 800 };

function gestureCommand(kind: GestureKind): 'mobile: swipeGesture' | 'mobile: scrollGesture' {
  return kind === 'swipe' ? 'mobile: swipeGesture' : 'mobile: scrollGesture';
}

/**
 * Shared primitive behind every boundary-box swipe/scroll in this project — reuse this
 * directly for a one-off gesture that doesn't fit the named helpers below.
 *
 * DEFAULT_BOUNDARY is a generic fallback, not a validated Katalon value — when porting a
 * specific Katalon call site (e.g. ScrollActions.scrollByBoundary(driver, 250, 400, 200, 800,
 * 1, "up")), pass its literal boundary/attempts instead of relying on the default.
 */
export async function gestureByBoundary(
  kind: GestureKind,
  direction: GestureDirection,
  percent: number,
  boundary: Partial<GestureBoundary> = {},
  attempts = 1
): Promise<void> {
  const args = { ...DEFAULT_BOUNDARY, ...boundary, direction, percent };
  for (let i = 0; i < attempts; i++) {
    await driver.execute(gestureCommand(kind), args);
  }
}

/**
 * Short scroll up (finger moves down).
 * Long pages hide Header/BNB; a small scroll up brings them back.
 */
export async function scrollUp(): Promise<void> {
  const { width, height } = await driver.getWindowSize();
  const x = Math.floor(width / 2);
  const startY = Math.floor(height * 0.42);
  const endY = Math.floor(height * 0.6);

  await driver
    .action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ x, y: startY, duration: 0 })
    .down()
    .pause(50)
    .move({ x, y: endY, duration: 400 })
    .up()
    .perform();
  await driver.pause(300);
}

/**
 * Scroll until selector is present (Katalon scrollUntilElementFound).
 */
export async function gestureByElement(
  kind: GestureKind,
  element: ChainablePromiseElement,
  direction: GestureDirection,
  percent: number
): Promise<void> {
  const el = await element;
  await driver.execute(gestureCommand(kind), { elementId: el.elementId, direction, percent });
}

/** Swipe toward the top of the screen. */
export async function swipeToTop(): Promise<void> {
  await gestureByBoundary('swipe', 'down', 0.95, { top: 300 });
}

/** Scroll a list down one page. */
export async function scrollDown(): Promise<void> {
  await gestureByBoundary('scroll', 'down', 1, { left: 250, top: 400 });
}

/**
 * Generic directional swipe within a boundary box.
 * Katalon: ScrollActions.swipeByBoundary(direction, percent, driver, top)
 */
export async function swipeByBoundary(
  direction: GestureDirection,
  percent: number,
  boundary: Partial<GestureBoundary> = {}
): Promise<void> {
  await gestureByBoundary('swipe', direction, percent, boundary);
}

/**
 * Scroll within a boundary box, repeated `attempts` times.
 * Katalon: ScrollActions.scrollByBoundary
 */
export async function scrollByBoundary(
  direction: GestureDirection,
  percent: number,
  boundary: Partial<GestureBoundary> = {},
  attempts = 1
): Promise<void> {
  await gestureByBoundary('scroll', direction, percent, boundary, attempts);
}

/**
 * Scroll relative to a specific element (rather than a boundary box).
 * Katalon: ScrollActions.scrollByElementId
 */
export async function scrollByElement(
  element: ChainablePromiseElement,
  direction: GestureDirection,
  percent: number
): Promise<void> {
  await gestureByElement('scroll', element, direction, percent);
}

/** Scroll element into center via JS (WebView only — different mechanism than the
 * mobile:*Gesture commands above, since those don't reach into WebView DOM layout). */
export async function scrollElementToCenter(
  element: ChainablePromiseElement
): Promise<void> {
  const resolved = await element;
  await driver.execute(
    // runs in WebView browser context
    'arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });',
    resolved
  );
  await driver.pause(300);
}

/**
 * Tap a raw screen coordinate. Use when an element's real tap target isn't at its bounding-box
 * center (default .click() behavior) — e.g. a merged accessibility node.
 * Katalon: UI.tapAtCoordinates
 */
export async function tapAtCoordinates(x: number, y: number): Promise<void> {
  await driver.execute('mobile: clickGesture', { x, y });
}

/**
 * Scroll down repeatedly until `locator` exists, or maxAttempts is reached. Returns whether found.
 * Katalon: ScrollActions.scrollUntilElementFound (used raw W3C pointer actions via
 * scrollDownWithW3CActions; this reuses the same mobile: scrollGesture primitive as every
 * other scroll in this file instead of maintaining a second gesture mechanism).
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
