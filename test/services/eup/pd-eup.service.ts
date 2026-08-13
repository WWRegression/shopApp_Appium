import { AddedService } from '../added-service.interface';
import { PdLocator } from '../../locators/pd.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';

export class PdEupService implements AddedService {
  private readonly locator = new PdLocator();

  async addService(): Promise<void> {
    // TODO: Implement PD EUP add flow
    await this.locator.eupAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    // TODO: Implement PD EUP "No" option
    await this.locator.eupNoButton.click();
  }

  async removeService(): Promise<void> {
    // TODO: Implement PD EUP removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement PD EUP verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement PD EUP price retrieval
    return parsePriceToNumber('0');
  }
}
