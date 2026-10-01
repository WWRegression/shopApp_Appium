import { CartLocator } from "../../locators/cart.locator";
import { AddedService } from "../added-service.interface";
import { assertElementDisplayed } from "../../helpers/validation.helper";
import { parsePriceToNumber } from "../../helpers/data.helper";

export class CartTradeUpService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(): Promise<void> {
  }
  async selectNoForService(): Promise<void> {
  }

  async removeService(): Promise<void> {
    await this.locator.tradeUpRemoveButton.click();
  }
  async verifyServiceApplied(): Promise<void> {
    await assertElementDisplayed(
      this.locator.tradeUpRemoveButton,
      'Trade-Up not applied on PD'
    );
  }
  async getServicePrice(): Promise<number> {
    const text = (await this.locator.tradeUpPriceLabel.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text);
  }
}