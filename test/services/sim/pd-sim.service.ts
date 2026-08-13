import { AddedService } from '../added-service.interface';
import { PdLocator } from '../../locators/pd.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class PdSimService implements AddedService {
  private readonly locator = new PdLocator();

  async addService(): Promise<void> {
    // TODO: Implement PD SIM add flow
    await this.locator.simAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement PD SIM "No" option
    await this.locator.simNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement PD SIM removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement PD SIM verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement PD SIM price retrieval
    return parsePriceToNumber('0');
  }
}
