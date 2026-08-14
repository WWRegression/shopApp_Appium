import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { AemTradeInPopupService } from './aem-tradein-popup.service';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';
import { switchToWebView } from '../../helpers/context.helper';
import { scrollElementToCenter } from '../../helpers/gesture.helper';
import { TradeInInput } from './tradein.types';

export class BcTradeInService implements AddedService {
  private readonly locator = new BcLocator();
  private readonly popup = new AemTradeInPopupService();
  private pendingInput: TradeInInput = {};

  async addService(input?: TradeInInput): Promise<void> {
    if (input) {
      this.pendingInput = input;
    }
    await switchToWebView();
    const yes = this.locator.tradeInYesOption();
    await scrollElementToCenter(yes);
    await yes.waitForClickable({ timeout: 15000 });
    await yes.click();
    await this.popup.completeTradeInFlow(this.pendingInput);
  }

  async selectNoForService(): Promise<void> {
    await switchToWebView();
    const no = this.locator.tradeInNoOption();
    if (await no.isDisplayed().catch(() => false)) {
      await scrollElementToCenter(no);
      await no.click();
    }
  }

  async removeService(): Promise<void> {
    await switchToWebView();
    await this.locator.tradeInRemoveButton.click();
  }

  async verifyServiceApplied(): Promise<void> {
    await switchToWebView();
    const removeVisible = await this.locator.tradeInRemoveButton
      .waitForDisplayed({ timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (removeVisible) {
      return;
    }
    await assertElementDisplayed(this.locator.tradeInEditButton, 'Trade-In not applied on BC');
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const priceText = await this.locator.tradeInPriceLabel.getText();
    return parsePriceToNumber(priceText);
  }
}
