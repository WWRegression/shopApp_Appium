import { BasePage } from './base.page';
import { SplashLocator } from '../locators/splash.locator';
import { isDisplayedOrFalse, scrollAndWdioClick } from '../helpers/element.helper';
import { getCurrentWindowUrl } from '../helpers/context.helper';

/** Post-ATC splash (addon / gift / popup) → cart. */
export class SplashPage extends BasePage {
  private readonly locator = new SplashLocator();

  /** Clicks Continue until a click opens the cart in a new window, or the cart opens with no splash. */
  async clickSplashContinue(): Promise<void> {
    for (let i = 0; i < 8; i++) {
      const windowCount = (await driver.getWindowHandles()).length;
      const button = await this.waitForContinueOrCart();
      if (!button) return;
      const clickedPopup = await isDisplayedOrFalse(this.locator.continueButtonOnPopup);
      await scrollAndWdioClick(button);

      // The old splash window keeps its Continue, so a second click would load cart there as well
      // A footer Continue can open a popup (NZ e-voucher Skip) instead of the cart, so that ends the wait too
      let newWindow = false;
      await driver
        .waitUntil(
          async () => {
            newWindow = (await driver.getWindowHandles()).length > windowCount;
            return newWindow || (!clickedPopup && (await isDisplayedOrFalse(this.locator.continueButtonOnPopup)));
          },
          { timeout: 10000, interval: 500 }
        )
        .catch(() => undefined);
      if (newWindow) return;
    }
  }

  /** Waits for whichever comes first: a splash Continue (returned) or the cart opening with no splash (undefined). */
  private async waitForContinueOrCart(timeoutMs = 15000): Promise<ChainablePromiseElement | undefined> {
    const before = await driver.getWindowHandles();
    let found: ChainablePromiseElement | undefined;
    await driver
      .waitUntil(
        async () => {
          for (const button of [this.locator.continueButtonOnPopup, this.locator.continueButton]) {
            if (await isDisplayedOrFalse(button)) {
              found = button;
              return true;
            }
          }
          // No splash: the cart opened in this window or in a new one
          const handles = await driver.getWindowHandles();
          return handles.some((h) => !before.includes(h)) || /\/cart/.test((await getCurrentWindowUrl()) ?? '');
        },
        { timeout: timeoutMs, interval: 500 }
      )
      .catch(() => console.log(`[clickSplashContinue] no splash Continue and no cart within ${timeoutMs / 1000}s`));
    return found;
  }
}
