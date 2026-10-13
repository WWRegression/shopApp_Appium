import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { clickIfDisplayed, waitForDisplayedOrFalse } from '../../helpers/element.helper';

export class CartEupService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(): Promise<void> {
    console.warn('[Cart.EUP.addService] =============Starting to add EUP to cart=============');
    if(await clickIfDisplayed(this.locator.eupAddButton, 3000)) {
      console.warn('[Cart.EUP.addService] EUP add button found and clicked');
    } else {
      console.warn('[Cart.EUP.addService] EUP add button not found');
      throw new Error('EUP add button not found');
    }    
    await this.verifyServiceApplied();

    console.warn('[Cart.EUP.addService] =============Verified EUP applied to cart=============');
  }

  async selectNoForService(): Promise<void> {
  }

  async removeService(): Promise<void> {
    if(await clickIfDisplayed(this.locator.eupRemoveButton, 3000)){
      console.warn('[Cart.EUP.removeService] EUP remove button found and clicked');
    } else {
      console.warn('[Cart.EUP.removeService] EUP remove button not found');
      throw new Error('EUP remove button not found');
    }
  }

  async verifyServiceApplied(): Promise<void> {
    if(await waitForDisplayedOrFalse(this.locator.eupAppliedLabel, { timeout: 5000 })) {
      console.warn('[Cart.EUP.verifyServiceApplied] EUP found in cart');
    } else {
      console.warn('[Cart.EUP.verifyServiceApplied] EUP not found in cart');
      throw new Error('EUP not found in cart');
    }
  }

  async getServicePrice(): Promise<number> {
    const text = (await this.locator.eupAppliedLabel.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text);
  }
}
