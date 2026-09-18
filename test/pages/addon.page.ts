import { BasePage } from './base.page';
import { AddOnLocator } from '../locators/addon.locator';
import { jsClick, isDisplayedSafe, isExistingInWebView } from '../helpers/element.helper';
import {
  switchToWebView,
  switchToWindowByPage,
  getCurrentWindowUrl,
  getDetailedWebViewWindows,
} from '../helpers/context.helper';

const SPLASH_HREF_RE = /addon|add-on|gift|evoucher|splash|free-gift|freegift/i;

export class AddOnPage extends BasePage {
  private readonly locator = new AddOnLocator();

  /**
   * Post-ATC splash / add-on → cart.
   * Continue often closes the splash window; always recover WebView and prefer cart
   * after a successful click so "no such window" does not abort the TC.
   */
  async clickSplashContinue(): Promise<void> {
    await this.recoverWebView();

    const deadline = Date.now() + 25000;
    const started = Date.now();
    const splashGraceMs = 3500;
    const maxClicks = 8;
    let clicks = 0;

    await driver.pause(400);

    while (Date.now() < deadline && clicks < maxClicks) {
      if (!(await this.recoverWebView())) {
        await driver.pause(500);
        continue;
      }

      await this.tryFocusSplashWindow();

      const skipped = await this.clickIfShown(this.locator.popupSkipButton);
      if (skipped) {
        clicks += 1;
        console.warn(`[splash] clicked popup skip (${clicks})`);
        await driver.pause(500);
        await this.recoverWebView();
        if (await this.isOnCartOrCheckout()) {
          console.warn(`[splash] on cart/checkout after skip (${clicks})`);
          return;
        }
        continue;
      }

      const continued = await this.clickContinueIfShown();
      if (continued) {
        clicks += 1;
        console.warn(`[splash] clicked continue (${clicks})`);
        await driver.pause(700);
        // Splash window is often destroyed here — re-attach before any DOM probe.
        await this.recoverWebView();
        if (await this.isOnCartOrCheckout()) {
          console.warn(`[splash] on cart/checkout after continue (${clicks})`);
          return;
        }
        continue;
      }

      if (!(await this.hasSplashCta()) && (await this.isOnCartOrCheckout())) {
        if (clicks > 0 || Date.now() - started >= splashGraceMs) {
          console.warn(`[splash] on cart/checkout after ${clicks} click(s)`);
          return;
        }
        console.warn('[splash] cart window present but waiting for splash CTA');
      }

      await driver.pause(400);
    }

    await this.recoverWebView();
    if (await this.isOnCartOrCheckout()) {
      console.warn('[splash] reached cart/checkout on final check');
      return;
    }

    console.warn(
      `[splash] done without cart (clicks=${clicks}). prepareCartPage will verify.`
    );
  }

  /** Re-enter WebView after splash teardown ("no such window"). */
  private async recoverWebView(): Promise<boolean> {
    const ok = await switchToWebView(3000).catch(() => false);
    if (!ok) {
      return false;
    }
    // Probe: if focused page is dead, try cart/any remaining window.
    const href = await getCurrentWindowUrl().catch(() => undefined);
    if (href) {
      return true;
    }
    try {
      await switchToWindowByPage('cart', 1500);
      return true;
    } catch {
      const windows = await getDetailedWebViewWindows().catch(() => []);
      for (const win of windows) {
        try {
          await driver.switchToWindow(win.webviewPageId);
          return true;
        } catch {
          // try next
        }
      }
    }
    return false;
  }

  private async hasSplashCta(): Promise<boolean> {
    try {
      if (await isDisplayedSafe(this.locator.popupSkipButton)) {
        return true;
      }
      if (await isDisplayedSafe(this.locator.continueButton)) {
        return true;
      }
      if (await isExistingInWebView(this.locator.continueButton)) {
        return true;
      }
      if (await isExistingInWebView(this.locator.popupSkipButton)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async clickContinueIfShown(): Promise<boolean> {
    try {
      const continueBtn = this.locator.continueButton;
      const shown =
        (await isDisplayedSafe(continueBtn)) ||
        (await isExistingInWebView(continueBtn));
      if (!shown) {
        return false;
      }
      await jsClick(continueBtn).catch(async () => {
        await continueBtn.click().catch(() => undefined);
      });
      return true;
    } catch {
      return false;
    }
  }

  private async isOnCartOrCheckout(): Promise<boolean> {
    try {
      await switchToWindowByPage('cart', 1200);
      return true;
    } catch {
      // fall through
    }
    try {
      await switchToWindowByPage('checkout', 600);
      return true;
    } catch {
      return false;
    }
  }

  private async tryFocusSplashWindow(): Promise<void> {
    try {
      const href = (await getCurrentWindowUrl().catch(() => '')) ?? '';
      if (SPLASH_HREF_RE.test(href)) {
        return;
      }

      const windows = await getDetailedWebViewWindows().catch(() => []);
      for (const win of windows) {
        if (!SPLASH_HREF_RE.test(win.url)) {
          continue;
        }
        try {
          await driver.switchToWindow(win.webviewPageId);
          console.warn('[splash] focused splash/addon window');
          return;
        } catch {
          // try next
        }
      }
    } catch {
      // closed window mid-scan
    }
  }

  private async clickIfShown(el: ChainablePromiseElement): Promise<boolean> {
    try {
      const shown =
        (await isDisplayedSafe(el)) || (await isExistingInWebView(el));
      if (!shown) {
        return false;
      }
      await jsClick(el).catch(async () => {
        await el.click().catch(() => undefined);
      });
      await driver.pause(400);
      return true;
    } catch {
      return false;
    }
  }
}
