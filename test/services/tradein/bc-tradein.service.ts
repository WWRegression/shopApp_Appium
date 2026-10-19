import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { AemTradeInPopupService, TradeInInput } from './aem-tradein-popup.service';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { clickIfDisplayed } from '../../helpers/element.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';

export class BcTradeInService implements AddedService {
  private readonly locator = new BcLocator();
  private readonly popup = new AemTradeInPopupService();
  
  async addService(input?: TradeInInput): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeInAddButton, 15000))) {
      throw new Error('[BC.TRADEIN.addService] Trade-In add button not found or clicked');
    }
    await this.popup.popupProcess(input);
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
    try {
      await assertElementDisplayed(this.locator.tradeInEditButton, 'Trade-In not applied on BC');
    } catch (err) {
      console.warn('[BC.TRADEIN.verifyServiceApplied] FAIL: edit button not shown');
      throw err;
    }
    const price = (await this.locator.tradeInPriceLabel.getText().catch(() => '')).trim();
    console.warn(`[BC.TRADEIN.verifyServiceApplied] PASS: applied, price="${price || '-'}"`);
  }

  async getServicePrice(): Promise<number> {
    const priceText = await this.locator.tradeInPriceLabel.getText();
    console.warn('[BC.TRADEIN.getServicePrice] priceText=', priceText);
    return parsePriceToNumber(priceText);
  }
}
