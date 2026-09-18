import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { scrollAndJsClick, isExistingInWebView } from '../../helpers/element.helper';

export class BcGalaxyClubService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    // TODO: Implement BC Galaxy Club join flow
  }

  async selectNoForService(): Promise<void> {
    const no = this.locator.galaxyClubNoButton;
    if (!(await isExistingInWebView(no))) {
      await console.warn('[BC.GALAXYCLUB.selectNoForService] Galaxy Club section not exists');
      return;
    }
    await console.warn('[BC.GALAXYCLUB.selectNoForService] Galaxy Club section found No option');
    await scrollAndJsClick(no);
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
