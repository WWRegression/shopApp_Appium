import { BasePage } from './base.page';
import { SplashLocator } from '../locators/splash.locator';
import { clickIfDisplayed } from '../helpers/element.helper';
import { getSiteData as getSite } from '../../config/site';

/** Post-ATC splash (addon / gift / popup) → cart. */
export class SplashPage extends BasePage {
  private readonly locator = new SplashLocator();

  /** Clicks Continue until a click opens the cart in a new window or no Continue is shown. */
  async clickSplashContinue(): Promise<void> {
    // IN: the add-on splash can take over 7s to show after Add to Cart
    const footerWaitMs = getSite().siteCode === 'IN' ? 15000 : 7000;
    for (let i = 0; i < 8; i++) {
      const windowCount = (await driver.getWindowHandles()).length;

      const clicked =
        (await clickIfDisplayed(this.locator.continueButtonOnPopup)) ||
        (await clickIfDisplayed(this.locator.continueButton, footerWaitMs)) ||
        (await clickIfDisplayed(this.locator.continueButtonOnPopup));
      if (!clicked) return;

      // The old splash window keeps its Continue, so a second click would load cart there as well
      const newWindow = await driver
        .waitUntil(async () => (await driver.getWindowHandles()).length > windowCount, { timeout: 10000, interval: 500 })
        .then(() => true, () => false);
      if (newWindow) return;
    }
  }
}
