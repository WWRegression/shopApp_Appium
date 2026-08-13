import { BasePage } from './base.page';
import { CartLocator } from '../locators/cart.locator';
import { CartTradeInService } from '../services/tradein/cart-tradein.service';
import { CartScPlusService } from '../services/scplus/cart-scplus.service';
import { CartEupService } from '../services/eup/cart-eup.service';
import { CartSimService } from '../services/sim/cart-sim.service';
import { switchToWebView, switchUrl } from '../helpers/context.helper';

export class CartPage extends BasePage {
  private readonly locator = new CartLocator();

  readonly tradeIn = new CartTradeInService();
  readonly scPlus = new CartScPlusService();
  readonly eup = new CartEupService();
  readonly sim = new CartSimService();

  async ready(): Promise<void> {
    await switchToWebView();
    await switchUrl('cart');
  }

  async proceedToCheckout(): Promise<void> {
    await this.ready();
    await this.locator.checkoutButton.click();
  }
}
