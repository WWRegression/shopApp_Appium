import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class BcSimService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    // TODO: Implement BC SIM add flow
    await this.locator.simAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement BC SIM "No" option
    await this.locator.simNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement BC SIM removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement BC SIM verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement BC SIM price retrieval
    return parsePriceToNumber('0');
  }
}
