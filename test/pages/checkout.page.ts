import { BasePage } from './base.page';
import { CheckoutLocator } from '../locators/checkout.locator';

export class CheckoutPage extends BasePage {
  private readonly locator = new CheckoutLocator();

  async verifyOnCheckout(): Promise<void> {
    // TODO: Implement checkout page verification
    await this.locator.orderSummary.waitForDisplayed();
  }

  async verifyOrderSummaryDisplayed(): Promise<void> {
    // TODO: Implement order summary verification
    await this.locator.orderSummary.waitForDisplayed();
  }

  async editOrderSummary(): Promise<void> {
    // TODO: Implement Order Summary edit navigation
  }

  async editContactDetails(): Promise<void> {
    // TODO: Implement Contact Details edit navigation
  }

  async editDeliveryMode(): Promise<void> {
    // TODO: Implement Delivery Mode edit navigation
  }

  async placeOrder(): Promise<void> {
    // TODO: Implement place order action
    await this.locator.placeOrderButton.click();
  }
}
