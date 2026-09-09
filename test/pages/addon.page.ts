import { BasePage } from './base.page';
import { AddOnLocator } from '../locators/addon.locator';
import { jsClick } from '../helpers/element.helper';

export class AddOnPage extends BasePage {
  private readonly locator = new AddOnLocator();

  /**
   * Clicks through splash screens after add-to-cart until none remain.
   * Splash can take several seconds to render; sticky continue needs a JS click.
   */
  async clickSplashContinue(): Promise<void> {
    for (;;) {
      const skip = this.locator.popupSkipButton;
      if (await skip.isDisplayed().catch(() => false)) {
        await jsClick(skip);
        await driver.pause(800);
        continue;
      }

      const button = this.locator.continueButton;
      const shown = await button.waitForDisplayed({ timeout: 15000 }).catch(() => false);
      if (!shown) {
        break;
      }
      await jsClick(button);
      await driver.pause(800);
    }
  }
}
