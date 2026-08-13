import { CartTradeInPopupLocator } from '../../locators/cart-tradein-popup.locator';

export class CartTradeInPopupService {
  private readonly locator = new CartTradeInPopupLocator();

  async completeTradeInFlow(): Promise<void> {
    // TODO: Implement Cart Hybris Trade-In popup flow
    await this.locator.step1NextButton.click();
    await this.locator.step2NextButton.click();
    await this.locator.step3NextButton.click();
    await this.locator.confirmButton.click();
  }
}
