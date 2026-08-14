import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { scrollElementToCenter } from '../../helpers/gesture.helper';

export class BcGalaxyClubService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    // TODO: Implement BC Galaxy Club join flow
  }

  async selectNoForService(): Promise<void> {
    if (!(await this.locator.galaxyClubBanner.isDisplayed().catch(() => false))) {
      return;
    }

    const no = this.locator.galaxyClubNoButton;
    if (await no.isDisplayed().catch(() => false)) {
      // Banner sits under the sticky price bar — scroll it clear first,
      // otherwise the native click gets intercepted and burns ~3 retries.
      await scrollElementToCenter(no);
      await no.click();
    }
  }

  async removeService(): Promise<void> {
    // TODO: Implement BC Galaxy Club removal
  }

  async verifyServiceApplied(): Promise<void> {
    // TODO: Implement BC Galaxy Club verification
  }

  async getServicePrice(): Promise<number> {
    // TODO: Implement BC Galaxy Club price retrieval
    return parsePriceToNumber('0');
  }
}
