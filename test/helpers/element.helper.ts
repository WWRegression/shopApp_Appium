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

import { quickSwipeDown, scrollElementToCenter, scrollListDown, scrollWebViewDown, scrollDown, scrollWithinElement, tapAtCoordinates } from './gesture.helper';
import { currentSiteCode } from './tc-filter.helper';
import { switchToNative, targetPackage } from './context.helper';
import { getBrowserPages } from './device.helper';
import { HeaderLocator } from '../locators/header.locator';
import { HomeLocator } from '../locators/home.locator';
import type { WaitForOptions } from 'webdriverio';

const DEFAULT_TIMEOUT_MS = 3000;

/** isDisplayed() that never throws. */
export async function isDisplayedOrFalse(element: ChainablePromiseElement | WebdriverIO.Element): Promise<boolean> {
  return await (element as WebdriverIO.Element).isDisplayed().catch(() => false);
}

/** waitForDisplayed() that never throws. */
export async function waitForDisplayedOrFalse(element: ChainablePromiseElement | WebdriverIO.Element, options?: WaitForOptions): Promise<boolean> {
  return await (element as WebdriverIO.Element).waitForDisplayed(options).then(() => true).catch(() => false);
}

/**
 * True if any element is checked/selected.
 * Native radio/checkbox/option only: isSelected() ignores aria-checked and classes, so other elements are always false.
 */
export async function isAnySelected(elements: WebdriverIO.Element[]): Promise<boolean> {
  for (const el of elements) {
    if (await el.isSelected().catch(() => false)) {
      return true;
    }
  }
  return false;
}

/**
 * Keeps only enabled elements.
 * Form controls only: isEnabled() reads the disabled attribute, so div/a/label and class-based disabling always pass.
 */
export async function getEnabledElements(elements: WebdriverIO.Element[]): Promise<WebdriverIO.Element[]> {
  const enabled: WebdriverIO.Element[] = [];
  for (const el of elements) {
    if (await el.isEnabled().catch(() => false)) {
      enabled.push(el);
    }
  }
  return enabled;
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

/**
 * Read visible text from a WebView locator. If nothing is displayed, scroll and re-query.
 * Pass a factory (`() => locator`) so each attempt gets a fresh $ / $$ — a resolved empty
 * list is reused and never sees nodes that appear after scroll.
 */
export async function readDisplayedText(
  locate: () => ReturnType<typeof $$> | ReturnType<typeof $>,
  joinAll = false
): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const resolved = await locate();
    const list = Array.isArray(resolved) ? resolved : [resolved];
    const parts: string[] = [];

    for (const node of list) {
      if (!(await node.isExisting().catch(() => false))) {
        continue;
      }
      if (!(await node.isDisplayed().catch(() => false))) {
        continue;
      }
      const raw = currentSiteCode().toUpperCase() === 'US'
        ? String((await node.getProperty('textContent').catch(() => '')) ?? '')
        : ((await node.getText().catch(() => '')) ?? '');
      const text = raw.replace(/\s+/g, ' ').trim();
      if (!text) {
        continue;
      }
      if (!joinAll) {
        return text;
      }
      parts.push(text);
    }

    if (parts.length > 0) {
      return parts.join(' ');
    }
    console.warn(`[readDisplayedText] no text, scroll down attempt=${attempt + 1}`);
    await scrollWebViewDown();
  }
  return '';
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
 * Native list scroll until locator.exists.
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

/**
 * Quick adb swipes down until the locator is displayed, without the idle wait.
 * For long pages with moving KVs (Home, Offers): they never go idle, and they snap one KV per swipe.
 */
export async function quickSwipeUntilVisible(locator: ChainablePromiseElement, maxSwipes = 40): Promise<boolean> {
  let shown = await isDisplayedOrFalse(locator);
  let swipes = 0;
  await withoutIdleWait(async () => {
    for (; swipes < maxSwipes && !shown; swipes += 2) {
      const before = await lastScrollContentFingerprint();
      await quickSwipeDown();
      await quickSwipeDown();
      shown = await isDisplayedOrFalse(locator);
      const after = await lastScrollContentFingerprint();
      // The page did not move — already at the bottom, no point swiping further
      if (before && before === after) {
        console.log(`[quickSwipeUntilVisible] stopped at bottom after ${swipes + 2} swipes`);
        break;
      }
    }
  });
  if (!shown) {
    console.log(`[quickSwipeUntilVisible] not found after ${swipes} swipes`);
  }
  return shown;
}

/** Last labelled node in the page ScrollView — used to tell whether a swipe still moved the page. */
async function lastScrollContentFingerprint(): Promise<string> {
  const last = await $('(//android.widget.ScrollView//*[@content-desc != ""])[last()]');
  if (!(await last.isExisting().catch(() => false))) {
    return '';
  }
  const desc = ((await last.getAttribute('content-desc').catch(() => '')) ?? '').slice(0, 80);
  const y = await last.getLocation().then((point) => Math.round(point.y)).catch(() => -1);
  return `${desc}|${y}`;
}

export async function clickElement(
  element: ChainablePromiseElement,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  await element.waitForDisplayed({ timeout });
  await element.click();
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

/**
 * Current value of an input (the DOM property).
 * getValue() reads the value *attribute* in mobile sessions, which stays empty after typing.
 */
export async function getInputValue(element: ChainablePromiseElement): Promise<string> {
  return driver
    .execute((node) => (node as unknown as HTMLInputElement).value ?? '', await element)
    .catch(() => '');
}

/**
 * Sets an input's value and returns what it ends up holding (getInputValue counterpart).
 * Unlike setElementValue, falls back to a JS set + input/keyup/change when typed keys don't land
 * (focus kept elsewhere in a WebView), so the page's handlers still run.
 */
export async function setInputValue(element: ChainablePromiseElement, value: string): Promise<string> {
  await element.setValue(value).catch(() => undefined);
  const typed = await getInputValue(element);
  if (typed === value) {
    return typed;
  }
  await driver.execute(
    (node, text) => {
      const input = node as unknown as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(input, text);
      } else {
        input.value = text;
      }
      for (const type of ['input', 'keyup', 'change']) {
        input.dispatchEvent(new Event(type, { bubbles: true }));
      }
    },
    await element,
    value
  );
  return getInputValue(element);
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
    await (el as WebdriverIO.Element).click().catch((err) => {
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
    await (el as WebdriverIO.Element).click();
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

// ── Hyperlinks ──────────────────────────────────────────────────────────

/** A link on screen; `id` = text right before it | name | order, `cutOff` = cut by the area bottom. */
export type ScreenLink = { name: string; textBefore: string; id: string; tapX: number; tapY: number; cutOff: boolean };
/** A link tap result; `opened` = something opened, so a Back is needed. */
export type LinkResult = { name: string; pass: boolean; opened: boolean; expected: string; actual: string };
type Box = { left: number; top: number; right: number; bottom: number };
type ScreenNode = Box & { isButton: boolean; desc: string };

async function getBox(element: ChainablePromiseElement): Promise<Box> {
  const { x, y } = await element.getLocation();
  const { width, height } = await element.getSize();
  return { left: x, top: y, right: x + width, bottom: y + height };
}

/** The container's own scroll area (a long T&C); not existing when it has none. */
function getScrollArea(getContainer: () => ChainablePromiseElement): ChainablePromiseElement {
  return getContainer().$('.//android.widget.ScrollView');
}

/** The scroll area if there is one, else the container. */
async function getLinkArea(getContainer: () => ChainablePromiseElement): Promise<ChainablePromiseElement> {
  return (await getScrollArea(getContainer).isExisting()) ? getScrollArea(getContainer) : getContainer();
}

/** App screen a link opened: PDF viewer title or 'app page with Back'; '' when none. */
async function getAppPageName(): Promise<string> {
  const pdfTitle = new HomeLocator().pdfTitle;
  if (await pdfTitle.isExisting()) {
    return getElementLabel(pdfTitle);
  }
  return (await new HeaderLocator().backButton.isExisting()) ? 'app page with Back' : '';
}

/** Every node of the page source: button or not, text and bounds. */
async function getScreenNodes(): Promise<ScreenNode[]> {
  const nodes: ScreenNode[] = [];
  for (const node of (await driver.getPageSource()).match(/<android\.[^>]*>/g) ?? []) {
    const bounds = node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!bounds) {
      continue;
    }
    const [left, top, right, bottom] = bounds.slice(1).map(Number);
    // A text holding " is quoted with '
    const desc = (node.match(/content-desc=(["'])(.*?)\1/)?.[2] ?? '').trim();
    nodes.push({ isButton: node.startsWith('<android.widget.Button '), desc, left, top, right, bottom });
  }
  return nodes;
}

/** Links inside the area, top to bottom, and a snapshot of its texts to tell whether it scrolled. */
async function getLinksInArea(area: ChainablePromiseElement): Promise<{ links: ScreenLink[]; snapshot: string }> {
  const box = await getBox(area);
  const links: ScreenLink[] = [];
  const texts: string[] = [];
  let textBefore = '';
  for (const node of await getScreenNodes()) {
    if (!node.isButton) {
      // A long paragraph runs past the area; the row around the area is not a text
      const overlaps = node.left < box.right && node.right > box.left && node.top < box.bottom && node.bottom > box.top;
      const surrounds = node.left <= box.left && node.right >= box.right && node.top <= box.top && node.bottom >= box.bottom;
      if (node.desc && overlaps && !surrounds) {
        textBefore = node.desc.slice(0, 40);
        texts.push(`${textBefore}@${node.top - box.top}`);
      }
      continue;
    }
    const inside = node.left >= box.left && node.right <= box.right && node.top >= box.top && node.bottom <= box.bottom;
    // No text before it: still being drawn
    if (!inside || !textBefore) {
      continue;
    }
    const order = links.filter((link) => link.textBefore === textBefore && link.name === node.desc).length + 1;
    // A wrapped link has an empty center: tap the start of its last line
    const tapY = node.top + Math.round((node.bottom - node.top) * 0.75);
    const id = `${textBefore}|${node.desc}|${order}`;
    links.push({ name: node.desc, textBefore, id, tapX: node.left + 20, tapY, cutOff: node.bottom >= box.bottom });
  }
  return { links, snapshot: texts.join(' | ') };
}

/**
 * Scrolls inside the container's own scroll area; returns whether it moved.
 * Without one, only scrolls the page on to show the rest (PT T&C opened near the bottom), from mid-screen:
 * a drag next to the BNB opens the Home notification panel. Never back up, which moves the container away.
 */
async function scrollInsideArea(getContainer: () => ChainablePromiseElement, distance: number): Promise<boolean> {
  if (!(await getScrollArea(getContainer).isExisting())) {
    if (distance < 0) {
      return false;
    }
    const topBefore = (await getBox(getContainer())).top;
    await scrollListDown();
    return (await getBox(getContainer())).top !== topBefore;
  }
  const before = (await getLinksInArea(getScrollArea(getContainer))).snapshot;
  await scrollWithinElement(getScrollArea(getContainer), distance);
  return (await getLinksInArea(getScrollArea(getContainer))).snapshot !== before;
}

/** WebView pages opened since `pageIdsBefore`, or the package of another app in front. */
async function getNewPages(pageIdsBefore: Set<string>): Promise<string[]> {
  const newPages = (await getBrowserPages()).filter((page) => !pageIdsBefore.has(page.id));
  const pages = newPages.map((page) => `${page.title} ${page.url.split('?')[0]}`);
  const currentPackage = await driver.getCurrentPackage().catch(() => '');
  if (currentPackage && currentPackage !== targetPackage()) {
    pages.push(currentPackage);
  }
  return pages;
}

/** Taps the link and waits up to 8s: a URL link must open that URL, a text link anything. */
async function clickLinkAndCheckRedirect(link: ScreenLink): Promise<LinkResult> {
  const isUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\//i.test(link.name);
  const expected = isUrl ? link.name.replace(/^https?:\/\//i, '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase() : 'new page';
  const urlOpened = (pages: string[]) => pages.some((page) => page.toLowerCase().includes(expected));
  const pageIdsBefore = new Set((await getBrowserPages()).map((page) => page.id));
  await tapAtCoordinates(link.tapX, link.tapY);

  let pages: string[] = [];
  let appPage = '';
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    pages = await getNewPages(pageIdsBefore);
    // A WebView shows Back before its URL, so a URL link waits for the URL
    if (isUrl ? urlOpened(pages) : pages.length > 0) {
      break;
    }
    if (!isUrl) {
      appPage = await getAppPageName();
      if (appPage) {
        break;
      }
    }
    await driver.pause(500);
  }
  if (pages.length === 0 && !appPage) {
    appPage = await getAppPageName();
  }

  const actual = pages.join(' | ') || appPage || 'nothing opened';
  const opened = actual !== 'nothing opened';
  return { name: link.name, pass: isUrl ? urlOpened(pages) : opened, opened, expected, actual };
}

/**
 * Taps every link in the container once, top to bottom, and returns whether each opened its page.
 * Same-named links are told apart by the text before them. `getContainer` finds the container again on each use.
 */
export async function verifyHyperlinkRedirects(getContainer: () => ChainablePromiseElement): Promise<LinkResult[]> {
  const results: LinkResult[] = [];
  const clickedIds = new Set<string>();
  // UiAutomator2 leaves offscreen nodes out by default, so show them to find a link anywhere in the container
  const { allowInvisibleElements } = (await driver.getSettings()) as { allowInvisibleElements: boolean };
  await driver.updateSettings({ allowInvisibleElements: true });
  const hasLink = await getContainer().$('.//android.widget.Button').isExisting();
  await driver.updateSettings({ allowInvisibleElements });
  if (!hasLink) {
    console.log('[verifyHyperlinkRedirects] no link — passed');
    return results;
  }
  // A scroll area keeps its position from an earlier visit: start from its top
  await withoutIdleWait(async () => {
    for (let up = 0; up < 15 && (await scrollInsideArea(getContainer, -250)); up++);
  });

  for (let step = 0; step < 40; step++) {
    if (!(await getContainer().isExisting())) {
      break;
    }
    const { links } = await withoutIdleWait(async () => getLinksInArea(await getLinkArea(getContainer)));
    const unclicked = links.filter((item) => !clickedIds.has(item.id));
    let link = unclicked.find((item) => !item.cutOff);
    if (!link) {
      // Small step near a cut link, bigger one through a stretch without links
      if (await withoutIdleWait(() => scrollInsideArea(getContainer, unclicked.length > 0 ? 250 : 550))) {
        continue;
      }
      // Area end: the last link sits on the bottom edge
      link = unclicked[0];
      if (!link) {
        break;
      }
    }

    clickedIds.add(link.id);
    const result = await withoutIdleWait(() => clickLinkAndCheckRedirect(link));
    console.log(
      `[verifyHyperlinkRedirects] ${results.length + 1}. link="${link.name}" after "${link.textBefore}" expected=${result.expected} actual=${result.actual} result=${result.pass ? 'PASS' : 'FAIL'}`
    );
    results.push(result);
    // Back only when something opened, then let an app page over the container close
    if (result.opened) {
      await switchToNative();
      await driver.back();
      await driver.waitUntil(async () => !(await getAppPageName()), { timeout: 5000, interval: 500 }).catch(() => undefined);
      await driver.pause(1000);
    }
  }
  console.log(results.length === 0 ? '[verifyHyperlinkRedirects] no link — passed' : `[verifyHyperlinkRedirects] clicked ${results.length} links`);
  return results;
}
