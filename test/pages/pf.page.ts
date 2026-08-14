import { BasePage } from './base.page';
import { PfLocator } from '../locators/pf.locator';
import { switchToNative, switchToWebView, switchUrl } from '../helpers/context.helper';

export type PfTabTarget = { tab: string } | { product: string };
export type WishState = 'add' | 'remove';

export class PfPage extends BasePage {
  private readonly locator = new PfLocator();

  async selectPfCard(criteria?: string): Promise<void> {
    await switchToNative();
    const card = criteria
      ? this.locator.productCardContaining(criteria)
      : this.locator.firstProductCard;

    await card.waitForDisplayed({ timeout: 20000 });
    await card.click();

    await switchToWebView(10);
    await switchUrl('buy').catch(() => switchUrl('PD'));
  }

  async selectPfCardExcluding(_keywords: string[]): Promise<void> {
    // TODO: Implement PF card selection excluding keywords
  }

  async selectFilterOption(_option: string): Promise<void> {
    // TODO: Implement filter option selection
  }

  async selectSortOption(_option: string): Promise<void> {
    // TODO: Implement sort option selection
  }

  async selectPfTab(_target: PfTabTarget): Promise<void> {
    // TODO: Implement PF tab selection (isPfTabMatch / selectPfTabUs 참고)
  }

  isPfTabMatch(_tabLabel: string, _target: PfTabTarget): boolean {
    // TODO: Implement tab label matching helper for selectPfTab
    return false;
  }

  async selectPfTabUs(_target: PfTabTarget): Promise<void> {
    // TODO: Implement US-specific tab selection variant
  }

  async getPfCardInfo(part?: string): Promise<string | Record<string, string>> {
    // TODO: Implement PF card info readback
    return part ? '' : {};
  }

  async getPfCardList(): Promise<string[]> {
    // TODO: Implement PF card list readback
    return [];
  }

  async getPfCardMatchCount(_keywords: string[]): Promise<number> {
    // TODO: Implement PF card match count
    return 0;
  }

  async getResultCount(): Promise<number> {
    // TODO: Implement PF result count readback
    return 0;
  }

  async getPfTabs(): Promise<string[]> {
    // TODO: Implement PF tab list readback
    return [];
  }

  async getMatchedPfTabs(_product: string): Promise<string[]> {
    // TODO: Implement matched PF tab lookup
    return [];
  }

  async getWishState(): Promise<WishState> {
    // TODO: Implement wish icon state readback
    return 'remove';
  }

  async verifySearchResultCount(_keywords: string[]): Promise<void> {
    // TODO: Implement search result count verification
  }

  async verifyNoSearchResultsFound(): Promise<void> {
    // TODO: Implement no-results verification
  }

  async verifyFilterApplied(_selected: string, _products?: string[]): Promise<void> {
    // TODO: Implement filter-applied verification
  }

  async verifySortApplied(_selected: string, _products?: string[]): Promise<void> {
    // TODO: Implement sort-applied verification
  }

  async verifyWishState(_expected: WishState): Promise<void> {
    // TODO: Implement wish state verification
  }

  async verifyPfRedirect(_options: Record<string, string>): Promise<void> {
    // TODO: Implement PF redirect verification
  }

  async clickFilter(): Promise<void> {
    // TODO: Implement filter panel open
  }

  async clickFilterApply(): Promise<void> {
    // TODO: Implement filter apply action
  }

  async clickSort(): Promise<void> {
    // TODO: Implement sort panel open
  }

  async clickSortApply(): Promise<void> {
    // TODO: Implement sort apply action
  }

  async clickWish(_expect: WishState): Promise<void> {
    // TODO: Implement wish icon toggle
  }
}
