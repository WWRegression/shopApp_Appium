import { BasePage } from './base.page';
import { AddOnLocator } from '../locators/addon.locator';

export class AddOnPage extends BasePage {
  private readonly locator = new AddOnLocator();

  /**
   * Clicks through any splash screens after add-to-cart (free gift, evoucher, add-on, etc.)
   * until none remain. Checks for a popup skip button each loop, since an open popup can
   * overlay and intercept clicks on the continue button.
   */
  async clickSplashContinue(): Promise<void> {
    for (;;) {
      if (await this.locator.popupSkipButton.isDisplayed().catch(() => false)) {
        await this.locator.popupSkipButton.click();
        continue;
      }

      const button = this.locator.continueButton;
      const shown = await button.waitForDisplayed({ timeout: 5000 }).catch(() => false);
      if (!shown) {
        break;
      }
      await button.click();
    }
  }
}
