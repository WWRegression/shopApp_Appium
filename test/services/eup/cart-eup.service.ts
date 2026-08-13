import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class CartEupService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(): Promise<void> {
    // TODO: Implement Cart EUP add flow
    await this.locator.eupAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement Cart EUP "No" option
    await this.locator.eupNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement Cart EUP removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement Cart EUP verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement Cart EUP price retrieval
    return parsePriceToNumber('0');
  }
}
