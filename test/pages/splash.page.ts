import { BasePage } from './base.page';
import { SplashLocator } from '../locators/splash.locator';
import { isDisplayedSafe, scrollAndWdioClick } from '../helpers/element.helper';
import { switchToWebView, isCurrentWebViewPage } from '../helpers/context.helper';

/**
 * Post-ATC splash (addon / gift / popup) → cart.
 * If already on cart (url or header title) → done.
 * Otherwise click Continue and re-check.
 */
export class SplashPage extends BasePage {
  private readonly locator = new SplashLocator();

  async clickSplashContinue(): Promise<void> {
    console.warn('[SplashPage] start');

    const maxAttempts = 8;

    for (let i = 0; i < maxAttempts; i++) {
      console.warn('[SplashPage] attempt:', i);
      if (await this.isOnCart()) {
        console.warn('[SplashPage] already on cart');
        return;
      }
      console.warn('[SplashPage] not on cart');

      if (await this.clickContinueOnPopup()) {
        continue;
      }

      if (await this.clickContinueButton()) {
        continue;
      }
    }
    console.warn('[SplashPage] done without cart confirmation; prepareCartPage will verify');
  }

  private async clickContinueButton(): Promise<boolean> {
    const continueBtn = this.locator.continueButton;
    if (await isDisplayedSafe(continueBtn)) {
      console.warn('[clickContinueButton] clicking continue on footer');
      await scrollAndWdioClick(continueBtn);
      await driver.pause(1000);
      return true;
    }
    return false;
  }

  private async clickContinueOnPopup(): Promise<boolean> {
    const continueToCartBtn = this.locator.continueButtonOnPopup;
    if (await isDisplayedSafe(continueToCartBtn)) {
      console.warn('[clickContinueOnPopup] clicking continue on popup');
      await scrollAndWdioClick(continueToCartBtn);
      await driver.pause(1000);
      return true;
    }
    return false;
  }

  private async isOnCart(): Promise<boolean> {
    if (await isCurrentWebViewPage('cart').catch(() => false)) {
      console.warn('[splash] on cart (url)');
      return true;
    }
    if (await this.matchesHeaderTitle(/cart/i).catch(() => false)) {
      console.warn('[splash] on cart (header title)');
      await switchToWebView(3000).catch(() => false);
      return true;
    }
    await switchToWebView(3000).catch(() => false);
    return false;
  }
}
