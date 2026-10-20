import { AddedService } from '../added-service.interface';
import { PdLocator } from '../../locators/pd.locator';
import { AemTradeInPopupService, TradeInInput } from './aem-tradein-popup.service';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';
import { clickIfDisplayed } from '../../helpers/element.helper';

export class PdTradeInService implements AddedService {
  private readonly locator = new PdLocator();
  private readonly popup = new AemTradeInPopupService();

  async addService(input?: TradeInInput): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeInAddButton, 15000))) {
      throw new Error('[PD.TRADEIN.addService] Trade-In add button not found or clicked');
    }
    await this.popup.popupProcess(input);
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement PD Trade-In "No" option selection
    await this.locator.tradeInNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement PD Trade-In removal
    await this.locator.tradeInRemoveButton.click();
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement PD Trade-In verification
    await assertElementDisplayed(this.locator.tradeInAppliedLabel);
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement PD Trade-In price retrieval
    const priceText = await this.locator.tradeInPriceLabel.getText();
    return parsePriceToNumber(priceText);
  }
}
