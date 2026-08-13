import { AddedService } from '../added-service.interface';
import { PdLocator } from '../../locators/pd.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class PdScPlusService implements AddedService {
  private readonly locator = new PdLocator();

  async addService(): Promise<void> {
    // TODO: Implement PD Samsung Care+ add flow
    await this.locator.scPlusAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement PD Samsung Care+ "No" option
    await this.locator.scPlusNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement PD Samsung Care+ removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement PD Samsung Care+ verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement PD Samsung Care+ price retrieval
    return parsePriceToNumber('0');
  }
}
