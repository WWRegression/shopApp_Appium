import { BasePage } from './base.page';
import { SearchLocator } from '../locators/search.locator';
import { switchToNative, switchToWebView, switchToWindowByPage } from '../helpers/context.helper';
import { clickElement, clickIfDisplayed, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

const KEYCODE_DEL = 67;

const BLACKLIST_WORDS = ['google', 'apple', 'iphone', '@'];

export class SearchPage extends BasePage {
  private readonly locator = new SearchLocator();
  private typedLength = 0;

  async openSearch(): Promise<void> {
    await this.selectHeaderIcon('search');
  }

  async search(keyword: string): Promise<void> {
    await switchToNative();
    console.warn('[search] searching for:', keyword);
    await clickIfDisplayed(this.locator.searchInput, 3000);
    for (let index = 0; index < this.typedLength; index += 1) {
      await driver.pressKeyCode(KEYCODE_DEL);
    }
    await driver.keys(keyword.split(''));
    await driver.keys(['Enter']);
    this.typedLength = keyword.length;
    await driver.pause(500);
  }

  async searchByKeyword(keyword: string): Promise<void> {
    await switchToNative();
    if (!(await this.isSearchOpen())) {
      await this.openSearch();
    }
    await this.search(keyword);
  }

  /** The no-result page keeps the search field and has no header search icon. */
  private async isSearchOpen(): Promise<boolean> {
    for (const input of await this.locator.searchInputs) {
      if (await input.isDisplayed().catch(() => false)) {
        return true;
      }
    }
    return false;
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

  /** Reads the recent search keywords on the search screen, most recent first. */
  private async getSearchHistory(): Promise<string[]> {
    await switchToNative();
    const keywords: string[] = [];
    for (const keyword of await this.locator.recentKeywords) {
      keywords.push(((await keyword.getAttribute('content-desc').catch(() => '')) ?? '').trim());
    }
    return keywords;
  }

  private isSameKeyword(actual: string, expected: string): boolean {
    return actual.trim().toLowerCase() === expected.trim().toLowerCase();
  }

  /** Deletes every recent search keyword left by earlier searches. */
  async clearSearchHistoryIfShown(): Promise<void> {
    await switchToNative();
    // The search screen opens a moment after the header icon; the previous page is still up until then
    await waitForDisplayedOrFalse(this.locator.searchInput, { timeout: 500 });
    for (let deleted = 0; deleted < 10; deleted += 1) {
      // Counting the list returns at once when it is empty; indexing it ([0]) would wait for a missing element
      if ((await this.locator.recentKeywordDeleteButtons.length) === 0) {
        return;
      }
      await clickElement(this.locator.recentKeywordDeleteButtons[0]);
      await driver.pause(500);
    }
  }

  /** Verifies the most recent search keyword is the searched keyword. */
  async verifySearchHistoryExists(keyword: string): Promise<void> {
    await switchToNative();
    await waitForDisplayedOrFalse(this.locator.searchInput, { timeout: 10000 });
    let history: string[] = [];
    await driver
      .waitUntil(async () => (history = await this.getSearchHistory()).length > 0, { timeout: 8000, interval: 500 })
      .catch(() => undefined);

    const recent = history[0] ?? '';
    const pass = this.isSameKeyword(recent, keyword);
    console.log(`[verifySearchHistoryExists] expected="${keyword}" actual="${recent}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop(
      [{ label: 'Recent search keyword mismatch', pass, detail: `expected "${keyword}", found "${recent}"` }],
      'verifySearchHistoryExists'
    );
  }

  /** Clicks the X (delete) button next to the recent search keyword. */
  async clickSearchHistoryDelete(keyword: string): Promise<void> {
    // The X buttons are listed in the same order as the keywords
    const index = (await this.getSearchHistory()).findIndex((recent) => this.isSameKeyword(recent, keyword));
    if (index < 0) {
      markFailed([{ label: 'No search history delete button found', pass: false, detail: keyword }], 'clickSearchHistoryDelete');
      return;
    }
    await clickElement(this.locator.recentKeywordDeleteButtons[index]);
    console.log(`[clickSearchHistoryDelete] deleted "${keyword}"`);
  }

  /** Verifies the keyword is no longer in the recent searches. */
  async verifySearchHistoryDeleted(keyword: string): Promise<void> {
    let history: string[] = [];
    const deleted = await driver
      .waitUntil(
        async () => {
          history = await this.getSearchHistory();
          return !history.some((recent) => this.isSameKeyword(recent, keyword));
        },
        { timeout: 3000, interval: 500 }
      )
      .then(() => true, () => false);

    console.log(
      `[verifySearchHistoryDeleted] expected="${keyword}" not in history actual=[${history.join(', ')}] result=${deleted ? 'PASS' : 'FAIL'}`
    );
    markFailedAndStop(
      [{ label: 'Search history delete failed', pass: deleted, detail: `still found "${keyword}"` }],
      'verifySearchHistoryDeleted'
    );
  }

  async verifySearchResultsDisplayed(): Promise<void> {
    await this.locator.searchResults.waitForDisplayed({ timeout: 15000 });
  }

  /** Searches each blacklist word and checks that the no-result message is shown. */
  async verifyBlacklistSearch(): Promise<void> {
    for (const word of BLACKLIST_WORDS) {
      await this.search(word);
      await this.verifyNoResultPage();
    }
  }

  async verifyNoResultPage(): Promise<void> {
    await switchToNative();
    const shown = await waitForDisplayedOrFalse(this.locator.noResultMessage, { timeout: 10000 });
    console.log(`[verifyNoResultPage] expected=no results actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'No results page was not displayed', pass: shown }], 'verifyNoResultPage');
  }
}
