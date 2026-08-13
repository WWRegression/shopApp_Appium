import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class BcScPlusService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    // TODO: Implement BC Samsung Care+ add flow
    await this.locator.scPlusAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement BC Samsung Care+ "No" option
    await this.locator.scPlusNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement BC Samsung Care+ removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement BC Samsung Care+ verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement BC Samsung Care+ price retrieval
    return parsePriceToNumber('0');
  }
}
