import { AddedService } from '../added-service.interface';
import { PdLocator } from '../../locators/pd.locator';
import { AemTradeInPopupService } from './aem-tradein-popup.service';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';

export class PdTradeInService implements AddedService {
  private readonly locator = new PdLocator();
  private readonly popup = new AemTradeInPopupService();

  async addService(): Promise<void> {
    // TODO: Implement PD-specific Trade-In entry
    await this.locator.tradeInAddButton.click();
    await this.popup.completeTradeInFlow();
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
