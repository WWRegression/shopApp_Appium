import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { scrollElementToCenter } from '../../helpers/gesture.helper';

export class BcSimService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    // TODO: Implement BC SIM add flow
    await this.locator.simAddButton.click();
  }

  async selectNoForService(): Promise<void> {
    const no = this.locator.simNoButton;
    if (await no.isDisplayed().catch(() => false)) {
      // Option row sits under the sticky price bar — scroll it clear first,
      // otherwise the native click gets intercepted and burns ~3 retries.
      await scrollElementToCenter(no);
      await no.click();
    }
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
