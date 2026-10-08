import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertEqual } from '../../helpers/validation.helper';
import { switchToWebView } from '../../helpers/context.helper';
import { clickIfDisplayed, scrollAndWdioClick, isDisplayedOrFalse, waitForDisplayedOrFalse } from '../../helpers/element.helper';
import { closeExternalBrowserIfOpen } from '../../helpers/device.helper';
import { CartPage } from '../../pages/cart.page';
import { getRunConfig } from '../../../config/run.config';

export class CartScPlusService implements AddedService {
  constructor(private readonly cartPage: CartPage) {}
  private readonly locator = new CartLocator();
  

  async addService(): Promise<void> {
    console.warn('[Cart.SCPLUS.addService] started=============');
    let before_cartCount = 0;
    let before_bnbCount = 0;
    if(getRunConfig().siteCode !== 'US') {
      before_cartCount = await this.cartPage.getCartTotalCount();
      before_bnbCount = await this.cartPage.getBNBCartCount();
      console.warn(`[Cart.SCPLUS.addService] before_bnbCount: ${before_bnbCount} | before_cartCount: ${before_cartCount}`);
      await this.cartPage.selectBnbMenu('cart');
      await this.cartPage.prepareCartPage();
    }
    await this.selectAddOption();
    await this.popupProcess();

    console.warn('[Cart.SCPLUS.addService] Added to cart=============');

    await this.verifyServiceApplied();
    console.warn('[Cart.SCPLUS.addService] Verified Service Applied=============');

    if(getRunConfig().siteCode !== 'US') {
      const after_cartCount = await this.cartPage.getCartTotalCount();
      const after_bnbCount = await this.cartPage.getBNBCartCount();
      console.warn(`[Cart.SCPLUS.addService] after_bnbCount: ${after_bnbCount} | after_cartCount: ${after_cartCount}`);
      await this.cartPage.selectBnbMenu('cart');
      await this.cartPage.prepareCartPage();

      assertEqual(after_cartCount, before_cartCount + 1);
      assertEqual(after_bnbCount, before_bnbCount + 1);
    }
    console.warn('[Cart.SCPLUS.addService] done=============');
  }

  async selectNoForService(): Promise<void> {
    await switchToWebView();
    await this.locator.scPlusNoButton.click();
  }

  async removeService(): Promise<void> {
    // Cart SC+ removal not required for PROD_BUY_02.
  }

  async verifyServiceApplied(): Promise<void> {
    if(await waitForDisplayedOrFalse(this.locator.scPlusAppliedLabel, 5000)) {
      console.warn('[Cart.SCPLUS.verifyServiceApplied] SC+ found in cart');
    } else {
      console.warn('[Cart.SCPLUS.verifyServiceApplied] SC+ not found in cart');
      throw new Error('SC+ not found in cart');
    }
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const text = (await this.locator.scPlusAppliedLabel.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text);
  }

  private async selectAddOption(): Promise<void> {
    if(await clickIfDisplayed(this.locator.scPlusAddButton)) {
      console.warn('[Cart.SCPLUS.addService] addOption found and clicked');
    } else {
      console.warn('[Cart.SCPLUS.addService] addOption not found');
    }
  }
  private async popupProcess(): Promise<void> {
    if (await this.waitForOpen()) {
      console.warn('[BC.SCPLUS.addService] modalOpened: true');

      await this.selectPlanOption();

      await this.checkAllTermsAndConditions();
      console.warn('[BC.SCPLUS.addService] checkAllTermsAndConditions done');

      await this.clickConfirm();
      console.warn('[BC.SCPLUS.addService] clickConfirm done');

      await this.waitForClose();
      console.warn('[BC.SCPLUS.addService] waitForClose done');
    } else {
      console.warn('[BC.SCPLUS.addService] modalOpened: false');
    }
  }

  private async selectPlanOption(): Promise<void> {
    if(await clickIfDisplayed(this.locator.scPlusPlanOption, 3000)) {
      console.warn('[Cart.SCPLUS.addService] planOption found and clicked');
    } else {
      console.warn('[Cart.SCPLUS.addService] planOption not found');
    }
  }

  private async checkAllTermsAndConditions(): Promise<void> {
    const checkboxes = await this.locator.scPlusTermsCheckboxes;
    for (const checkbox of checkboxes) {
      const checked = await checkbox.isSelected().catch(() => false);
      if (checked) {
        continue;
      }
      await scrollAndWdioClick(checkbox);
    }
  }

  private async clickConfirm(): Promise<void> {
    if(await closeExternalBrowserIfOpen()){
      await switchToWebView(3000).catch(() => undefined);
    }
    if(await clickIfDisplayed(this.locator.scPlusConfirmButton, 3000)) {
      console.warn('[Cart.SCPLUS.addService] confirm found and clicked');
    } else {
      console.warn('[Cart.SCPLUS.addService] confirm not found');
    }
    
    if(await closeExternalBrowserIfOpen()){
      await switchToWebView(3000).catch(() => undefined);
    }
  }

  private async waitForOpen(): Promise<boolean> {
    return await this.locator.scPlusModal.waitForDisplayed({ timeout: 5000 }).catch(() => false);
  }

  private async waitForClose(): Promise<void> {
    await this.locator.scPlusModal.waitForDisplayed({ reverse: true, timeout: 5000 });
  }
}
