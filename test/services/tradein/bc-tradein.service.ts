import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { AemTradeInPopupService } from './aem-tradein-popup.service';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { TradeInInput } from './tradein.types';
import { clickIfDisplayed } from '../../helpers/element.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';

export class BcTradeInService implements AddedService {
  private readonly locator = new BcLocator();
  private readonly popup = new AemTradeInPopupService();
  private pendingInput: TradeInInput = {};

  async addService(input?: TradeInInput): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeInAddButton, 15000))) {
      console.warn('[BC.TRADEIN.addService] Trade-In add button not found or clicked');
      return;
    }

    if (input) {
      this.pendingInput = input;
    }
    
    await this.popup.completeTradeInFlow(this.pendingInput);
  }

  async selectNoForService(): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeInNoButton, 3000))) {
      console.warn('[BC.TRADEIN.selectNoForService] Trade-In no button not found or clicked');
      return;
    }
  }

  async removeService(): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeInRemoveButton, 3000))) {
      console.warn('[BC.TRADEIN.removeService] Trade-In remove button not found or clicked');
      return;
    }
  }

  async verifyServiceApplied(): Promise<void> {
    await assertElementDisplayed(this.locator.tradeInEditButton, 'Trade-In not applied on BC');
    console.warn('[BC.TRADEIN.verifyServiceApplied] applied');
  }

  async getServicePrice(): Promise<number> {
    const priceText = await this.locator.tradeInPriceLabel.getText();
    console.warn('[BC.TRADEIN.getServicePrice] priceText=', priceText);
    return parsePriceToNumber(priceText);
  }
}
