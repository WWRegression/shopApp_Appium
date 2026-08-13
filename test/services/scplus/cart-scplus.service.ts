import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class CartScPlusService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(): Promise<void> {
    // TODO: Implement Cart Samsung Care+ add flow
    await this.locator.scPlusAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement Cart Samsung Care+ "No" option
    await this.locator.scPlusNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement Cart Samsung Care+ removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement Cart Samsung Care+ verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement Cart Samsung Care+ price retrieval
    return parsePriceToNumber('0');
  }
}
