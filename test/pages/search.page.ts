import { BasePage } from './base.page';
import { SearchLocator } from '../locators/search.locator';
import { switchToNative, switchToWebView, switchToWebViewWindow } from '../helpers/context.helper';

export class SearchPage extends BasePage {
  private readonly locator = new SearchLocator();

  async openSearch(): Promise<void> {
    await this.selectHeaderIcon('search');
  }

  async search(keyword: string): Promise<void> {
    await switchToNative();
    await this.locator.searchInput.waitForDisplayed({ timeout: 10000 });
    await this.locator.searchInput.setValue(keyword);

    if (await this.locator.searchSubmitButton.isDisplayed().catch(() => false)) {
      await this.locator.searchSubmitButton.click();
    } else {
      await driver.keys(['Enter']);
    }
  }

  async searchByKeyword(keyword: string): Promise<void> {
    await this.openSearch();
    await this.search(keyword);
  }

  async openProductFromResults(skuOrName: string): Promise<void> {
    await switchToNative();
    const card = this.locator.productCardContaining(skuOrName);
    await card.waitForDisplayed({ timeout: 20000 });
    await card.click();

    // BC/PD는 WebView인 경우가 많음
    await switchToWebView(10);
    try {
      await switchToWebViewWindow('bc');
    } catch {
      await switchToWebViewWindow('pd');
    }
  }

  async clearSearchHistory(): Promise<void> {
    // site별 UI 차이 — 필요 시 구현
  }

  async verifySearchResultsDisplayed(): Promise<void> {
    await this.locator.searchResults.waitForDisplayed({ timeout: 15000 });
  }

  async verifyNoResultPage(): Promise<void> {
    // site별 UI 차이 — 필요 시 구현
  }
}
