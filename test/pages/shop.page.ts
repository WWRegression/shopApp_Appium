import { BasePage } from './base.page';
import { ShopLocator, ShopCategory } from '../locators/shop.locator';
import { currentSiteCode } from '../helpers/tc-filter.helper';

export class ShopPage extends BasePage {
  private readonly locator = new ShopLocator();

  /** Shop tab -> L0 category -> L1 subcategory, down to the PF list. Katalon moveToPF. */
  async openPfList(category: ShopCategory): Promise<void> {
    await this.selectBnbMenu('shop');

    const steps = this.locator.categorySteps(currentSiteCode(), category);
    for (const xpath of [steps.l0, steps.l1]) {
      const el = $(xpath);
      if (await el.isDisplayed().catch(() => false)) {
        await el.click();
      }
    }
  }

  async openFirstCategory(): Promise<void> {
    // TODO: Implement category navigation
    await this.locator.categoryList.click();
  }

  async selectFirstProduct(): Promise<void> {
    // TODO: Implement product selection
    await this.locator.firstProduct.click();
  }
}
