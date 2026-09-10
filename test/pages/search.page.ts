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
    await this.locator.searchInput.waitForDisplayed({ timeout: 10000 });
    await this.locator.searchInput.click();
    // Synthetic accessibility node, not a real EditText — setValue() is a no-op; real key events are required.
    await driver.waitUntil(() => driver.isKeyboardShown(), { timeout: 5000, interval: 300 }).catch(() => undefined);
    await driver.keys(keyword.split(''));

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
