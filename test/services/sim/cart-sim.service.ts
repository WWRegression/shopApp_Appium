import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';
import { switchToWebView, switchToWindowByPage } from '../../helpers/context.helper';
import { getRunConfig } from '../../../config/run.config';

const US_CARRIERS = ['Verizon', 'AT&T', 'T-Mobile'] as const;

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

  async verifyServiceApplied(): Promise<void> {
    await console.warn('[CART.SIM.verifyServiceApplied] Start');
    if (getRunConfig().siteCode === 'US') {
      const items = await $$('.cart-item, .cart-item__options, [class*="device"]');
      for (const item of items) {
        if (!(await item.isDisplayed().catch(() => false))) {
          continue;
        }
        const text = ((await item.getText().catch(() => '')) ?? '').trim();
        if (US_CARRIERS.some((carrier) => text.includes(carrier))) {
          return;
        }
      }
      throw new Error('SIM/carrier not found in cart (US)');
    }

    await assertElementDisplayed(this.locator.simAppliedLabel, 'SIM not found in cart');
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const text = (await this.locator.simAppliedLabel.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text);
  }
}
