import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class BcEupService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    // TODO: Implement BC EUP add flow
    await this.locator.eupAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement BC EUP "No" option
    await this.locator.eupNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement BC EUP removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement BC EUP verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement BC EUP price retrieval
    return parsePriceToNumber('0');
  }
}
