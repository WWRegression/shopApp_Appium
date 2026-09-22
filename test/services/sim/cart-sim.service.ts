import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';
import { switchToWebView, switchToWindowByPage } from '../../helpers/context.helper';
import { getRunConfig } from '../../../config/run.config';
import { getElementLabel } from '../../helpers/element.helper';

/** US SKU suffix → carrier display token (lowercase). */
const US_SKU_CARRIER: Record<string, string> = {
  VZW: 'verizon',
  ATT: 'at&t',
  XAU: 't-mobile',
};

export class CartSimService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(): Promise<void> {
    await switchToWebView();
    await switchToWindowByPage('cart');
    await this.locator.simAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    await switchToWebView();
    await this.locator.simNoButton.click();
  }

  async removeService(): Promise<void> {
    await switchToWebView();
    await switchToWindowByPage('cart');
    const remove = this.locator.simAppliedLabel;
    if (await remove.isDisplayed().catch(() => false)) {
      await remove.click();
    }
  }

  /**
   * Non-US: SIM remove chip present.
   * US: cart line for `skuInfo` shows the carrier derived from SKU suffix (VZW/ATT/XAU).
   */
  async verifyServiceApplied(skuInfo: string): Promise<void> {
    if (getRunConfig().siteCode === 'US') {
      const carrier = US_SKU_CARRIER[skuInfo.slice(-3).toUpperCase()].toLowerCase();
      if (!carrier) {
        throw new Error(`[CART.SIM.verifyServiceApplied] no carrier mapping for sku=${skuInfo}`);
      }
      const deviceName = (await getElementLabel(this.locator.cartItemName(skuInfo))).toLowerCase();
      console.warn(`[CART.SIM.verifyServiceApplied] deviceName=${deviceName} carrier=${carrier}`);
      if(!deviceName.includes(carrier))
      {
        throw new Error(`[CART.SIM.verifyServiceApplied] SIM not found in cart for sku=${skuInfo}`);
      }
      return;
    }
    await assertElementDisplayed(this.locator.simAppliedLabel, 'SIM not found in cart');
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const text = (await this.locator.simAppliedLabel.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text);
  }

}
