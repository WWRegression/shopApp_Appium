import { BasePage } from './base.page';
import { BcLocator } from '../locators/bc.locator';
import { BcTradeInService } from '../services/tradein/bc-tradein.service';
import { BcScPlusService } from '../services/scplus/bc-scplus.service';
import { BcEupService } from '../services/eup/bc-eup.service';
import { BcSimService } from '../services/sim/bc-sim.service';
import { switchToWebView, switchUrl } from '../helpers/context.helper';
import { scrollElementToCenter } from '../helpers/gesture.helper';

export interface BcProductOptions {
  deviceName: string;
  storage: string;
  color: string;
}

export class BcPage extends BasePage {
  private readonly locator = new BcLocator();

  readonly tradeIn = new BcTradeInService();
  readonly scPlus = new BcScPlusService();
  readonly eup = new BcEupService();
  readonly sim = new BcSimService();

  /** BC WebView로 전환하고 buy URL 윈도우를 잡는다. */
  async ready(): Promise<void> {
    await switchToWebView();
    await switchUrl('buy');
    await this.closePopupIfDisplayed();
    await this.acceptCookieBannerIfShown();
  }

  async selectDeviceOptions(options: BcProductOptions): Promise<void> {
    await this.ready();

    const device = this.locator.deviceOption(options.deviceName);
    if (await device.isDisplayed().catch(() => false)) {
      await this.clickWhenReady(device);
    }

    const storage = this.locator.storageOption(options.storage);
    if (await storage.isDisplayed().catch(() => false)) {
      await this.clickWhenReady(storage);
    }

    const color = this.locator.colorOption(options.color);
    if (await color.isDisplayed().catch(() => false)) {
      await this.clickWhenReady(color);
    }
  }

  async proceedToCart(): Promise<void> {
    await switchToWebView();
    await scrollElementToCenter(this.locator.addToCartButton).catch(() => undefined);
    await this.locator.addToCartButton.waitForClickable({ timeout: 15000 });
    await this.locator.addToCartButton.click();

    if (await this.locator.continueSplashButton.isDisplayed().catch(() => false)) {
      await this.locator.continueSplashButton.click();
    }

    await switchUrl('cart').catch(() => false);
  }
}
