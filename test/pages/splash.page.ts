import { BasePage } from './base.page';
import { SplashLocator } from '../locators/splash.locator';
import { isDisplayedOrFalse, scrollAndWdioClick, waitForDisplayedOrFalse } from '../helpers/element.helper';

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

      if (await this.clickContinueOnPopup()) {
        continue;
      }

      if (await this.clickContinueButton()) {
        continue;
      }

      if(!await waitForDisplayedOrFalse(this.locator.continueButton, {timeout:1000})) {
        console.warn('[SplashPage] continue button not found');
        return;
      }
    }
    console.warn('[SplashPage] done without cart confirmation; prepareCartPage will verify');
  }

  private async clickContinueButton(): Promise<boolean> {
    const continueBtn = this.locator.continueButton;
    if (await waitForDisplayedOrFalse(continueBtn, {timeout:3000})) {
      console.warn('[clickContinueButton] clicking continue on footer');
      await scrollAndWdioClick(continueBtn);
      await driver.pause(1000);
      return true;
    }
    return false;
  }

  private async clickContinueOnPopup(): Promise<boolean> {
    const continueToCartBtn = this.locator.continueButtonOnPopup;
    if (await isDisplayedOrFalse(continueToCartBtn)) {
      console.warn('[clickContinueOnPopup] clicking continue on popup');
      await scrollAndWdioClick(continueToCartBtn);
      await driver.pause(1000);
      return true;
    }
    return false;
  }
}
