/**
 * Gesture helpers — pure motion only (finger / viewport / document scroll).
 * Element checks, clicks, and "scroll until found" live in element.helper.ts.
 *
 * ── Catalog ──────────────────────────────────────────────────────────────
 *
 * [Primitives — Native mobile:*Gesture]
 *   gestureByBoundary  Swipe/scroll inside a screen rectangle (left/top/width/height).
 *   gestureByElement   Swipe/scroll anchored to an element's bounds (elementId).
 *
 * [Native convenience]
 *   scrollDown         One-page Native list scroll down (scrollGesture).
 *   scrollUp           Short W3C-pointer drag up — reveals Header/BNB after long pages.
 *   swipeToTop         Strong swipe toward top of screen.
 *   swipeByBoundary    Directional swipe in a boundary box (Katalon swipeByBoundary).
 *   scrollByBoundary   Directional scroll in a boundary box, N attempts.
 *   scrollByElement    Directional scroll relative to an element (Katalon scrollByElementId).
 *
 * [WebView document — native gesture does NOT move the inner scroller]
 *   scrollWebViewDown      document.scrollBy ≈ 55% of viewport height.
 *   scrollElementToCenter  element.scrollIntoView({ block: "center", instant }).
 *
 * [Tap]
 *   tapAtCoordinates   mobile: clickGesture at raw (x, y).
 *
 * Layout: types → primitives → Native convenience → WebView → tap.
 */

// ── Types ────────────────────────────────────────────────────────────────

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

// ── Primitives (Native mobile:*Gesture) ──────────────────────────────────

/**
 * Swipe or scroll inside a screen rectangle.
 * Prefer an explicit boundary when porting Katalon; DEFAULT_BOUNDARY is only a fallback.
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
 * Swipe or scroll using an element's bounds as the gesture area (not an element click).
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

// ── Native convenience ───────────────────────────────────────────────────

/** One-page Native list scroll down (mobile: scrollGesture). */
export async function scrollDown(): Promise<void> {
  await gestureByBoundary('scroll', 'down', 1, { left: 250, top: 400 });
}

/**
 * Short finger drag upward (content moves down) via W3C pointer.
 * Long pages hide Header/BNB; one nudge brings them back into view.
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

/** Strong swipe toward the top of the screen (finger moves down). */
export async function swipeToTop(): Promise<void> {
  await gestureByBoundary('swipe', 'down', 0.95, { top: 300 });
}

/**
 * Directional swipe inside a boundary box.
 * Katalon: ScrollActions.swipeByBoundary
 */
export async function swipeByBoundary(
  direction: GestureDirection,
  percent: number,
  boundary: Partial<GestureBoundary> = {}
): Promise<void> {
  await gestureByBoundary('swipe', direction, percent, boundary);
}

/**
 * Directional scroll inside a boundary box, repeated `attempts` times.
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
 * Directional scroll relative to an element's bounds (gesture area only).
 * Katalon: ScrollActions.scrollByElementId
 */
export async function scrollByElement(
  element: ChainablePromiseElement,
  direction: GestureDirection,
  percent: number
): Promise<void> {
  await gestureByElement('scroll', element, direction, percent);
}

// ── WebView document scroll ──────────────────────────────────────────────
// Native mobile:*Gesture does not move the inner WebView scroller.

/**
 * Scroll the WebView document down (~55% of window.innerHeight).
 * Brings lazy-rendered Hybris nodes into the DOM.
 */
export async function scrollWebViewDown(): Promise<void> {
  await driver.execute(
    `const root = document.scrollingElement || document.documentElement;
     root.scrollBy(0, Math.floor(window.innerHeight * 0.55));`
  );
  await driver.pause(400);
}

/**
 * Move the WebView viewport so `element` sits in the vertical center.
 * Pure scroll — does not click or assert existence.
 * `behavior: "instant"` so the call returns after the scroll has finished.
 */
export async function scrollElementToCenter(
  element: ChainablePromiseElement | WebdriverIO.Element
): Promise<void> {
  await driver.execute(
    'arguments[0].scrollIntoView({ behavior: "instant", block: "center" });',
    await element
  ).catch(() => undefined);
}

// ── Tap ──────────────────────────────────────────────────────────────────

/**
 * Tap a raw screen coordinate (when the hit target is not the element bbox center).
 * Katalon: UI.tapAtCoordinates
 */
export async function tapAtCoordinates(x: number, y: number): Promise<void> {
  await driver.execute('mobile: clickGesture', { x, y });
}
