import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { CartTradeInInput, CartTradeInPopupService } from './cart-tradein-popup.service';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';
import { clickIfDisplayed } from '../../helpers/element.helper';
import { switchToWebView } from '../../helpers/context.helper';

export class CartTradeInService implements AddedService {
  private readonly locator = new CartLocator();
  private readonly popup = new CartTradeInPopupService();

  async addService(input?: CartTradeInInput): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeInAddButton, 15000))) {
      throw new Error('[Cart.TRADEIN.addService] Trade-In add button not found or clicked');
    }
    await this.popup.popupProcess(input);
  }

  async selectNoForService(): Promise<void> {
    await switchToWebView();
    await this.locator.tradeInNoButton.click();
  }

  async removeService(): Promise<void> {
    await switchToWebView();
    await this.locator.tradeInRemoveButton.click();
  }

  async verifyServiceApplied(): Promise<void> {
    try {
      await assertElementDisplayed(this.locator.tradeInAppliedLabel, 'Trade-In not found in cart');
    } catch (err) {
      console.warn('[Cart.TRADEIN.verifyServiceApplied] FAIL: Trade-In not found in cart');
      throw err;
    }
    const price = (await this.locator.tradeInPriceLabel.getText().catch(() => '')).trim();
    console.warn(`[Cart.TRADEIN.verifyServiceApplied] PASS: Trade-In found in cart, price="${price || '-'}"`);
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const priceText = await this.locator.tradeInPriceLabel.getText();
    return parsePriceToNumber(priceText);
  }
}
