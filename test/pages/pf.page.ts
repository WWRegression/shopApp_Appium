import { BasePage } from './base.page';
import { PfLocator } from '../locators/pf.locator';

export class PfPage extends BasePage {
  private readonly locator = new PfLocator();

  async selectFirstProduct(): Promise<void> {
    // TODO: Implement PF product selection
    await this.locator.firstProductCard.click();
  }

  async openFirstProduct(): Promise<void> {
    await this.selectFirstProduct();
  }

  async applyFilterAndSort(): Promise<void> {
    // TODO: Implement 1 filter and 1 sort-by option
  }

  async verifyProductGridDisplayed(): Promise<void> {
    // TODO: Implement PF grid verification
    await this.locator.productGrid.waitForDisplayed();
  }

  async verifyProductSetupSections(): Promise<void> {
    // TODO: Verify device / storage / color / summary sections for Flagship
  }
}
