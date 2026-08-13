import { BasePage } from './base.page';
import { OfferLocator } from '../locators/offer.locator';

export class OfferPage extends BasePage {
  private readonly locator = new OfferLocator();

  async openRtbSection(): Promise<void> {
    // TODO: Implement RTB section navigation
    await this.locator.rtbSection.click();
  }

  async verifyCategoryFilterBehavior(): Promise<void> {
    // TODO: Implement category icon filter verification
    await this.locator.categoryFilterSection.waitForExist({ reverse: false });
  }
}
