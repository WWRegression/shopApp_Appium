import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { ShopPage } from '../../../pages/shop.page';
import { PfPage } from '../../../pages/pf.page';

/** Search keyword per site; SA lists products in Arabic */
const SEARCH_KEYWORD: Record<string, string> = { SA: 'جالاكسي إس 26' };

/** Verify keyword search results, then the search history is saved and deleted. */
describe('PROD_SEARCH_01', () => {
  const searchPage = new SearchPage();
  const shopPage = new ShopPage();
  const pfPage = new PfPage();

  it('keyword search and save/delete search history', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_01', async (site) => {
      const keyword = SEARCH_KEYWORD[site.siteCode] ?? 'Galaxy S26';

      await shopPage.prepareShopPage();
      await searchPage.openSearch();
      await searchPage.clearSearchHistoryIfShown();
      await searchPage.search(keyword);
      await pfPage.verifySearchResultCount([keyword]);

      await shopPage.prepareShopPage();
      await searchPage.openSearch();
      await searchPage.verifySearchHistoryExists(keyword);
      await searchPage.clickSearchHistoryDelete(keyword);
      await searchPage.verifySearchHistoryDeleted(keyword);
    });
  });
});
