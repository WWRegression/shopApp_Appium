import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';
import { switchToWebView, switchToWindowByPage } from '../../helpers/context.helper';
import { scrollAndJsClick } from '../../helpers/element.helper';

export class CartEupService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(): Promise<void> {
    await switchToWebView();
    await switchToWindowByPage('cart');
    await scrollAndJsClick(this.locator.eupAddButton);
  }

  async selectNoForService(): Promise<void> {
    await switchToWebView();
    await this.locator.eupNoButton.click();
  }

  async removeService(): Promise<void> {
    await switchToWebView();
    await switchToWindowByPage('cart');
    await scrollAndJsClick(this.locator.eupRemoveButton);
  }

  async verifyServiceApplied(): Promise<void> {
    await switchToWebView();
    await switchToWindowByPage('cart');
    await assertElementDisplayed(this.locator.eupAppliedLabel, 'EUP not found in cart');
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const text = (await this.locator.eupAppliedLabel.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text);
  }
}
