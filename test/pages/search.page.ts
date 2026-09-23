import { BasePage } from './base.page';
import { SearchLocator } from '../locators/search.locator';
import { switchToNative, switchToWebView, switchToWindowByPage } from '../helpers/context.helper';

export class SearchPage extends BasePage {
  private readonly locator = new SearchLocator();

  async openSearch(): Promise<void> {
    await this.selectHeaderIcon('search');
  }

  async search(keyword: string): Promise<void> {
    await switchToNative();
    console.warn('[search] searching for:', keyword);
    await this.locator.searchInput.waitForDisplayed({ timeout: 10000 });
    await this.locator.searchInput.click();
    await driver.keys(keyword.split(''));
    await driver.keys(['Enter']);
    await driver.pause(500);
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
    await switchToWebView(10000);
    try {
      await switchToWindowByPage('bc');
    } catch {
      await switchToWindowByPage('pd');
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
