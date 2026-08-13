import { BasePage } from './base.page';
import { ShopLocator } from '../locators/shop.locator';

export class ShopPage extends BasePage {
  private readonly locator = new ShopLocator();

  async openFirstCategory(): Promise<void> {
    // TODO: Implement category navigation
    await this.locator.categoryList.click();
  }

  async selectFirstProduct(): Promise<void> {
    // TODO: Implement product selection
    await this.locator.firstProduct.click();
  }
}
