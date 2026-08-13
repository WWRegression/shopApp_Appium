import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class CartSimService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(): Promise<void> {
    // TODO: Implement Cart SIM add flow
    await this.locator.simAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement Cart SIM "No" option
    await this.locator.simNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement Cart SIM removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement Cart SIM verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement Cart SIM price retrieval
    return parsePriceToNumber('0');
  }
}
