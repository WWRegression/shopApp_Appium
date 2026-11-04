import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { ShopPage } from '../../../pages/shop.page';
import { PfPage } from '../../../pages/pf.page';

/** Trending/Popular search opens results; that keyword is saved then deleted from history. */
describe('PROD_SEARCH_02', () => {
  const searchPage = new SearchPage();
  const shopPage = new ShopPage();
  const pfPage = new PfPage();

  it('trending search and save/delete search history', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_02', async () => {
      await shopPage.prepareShopPage();
      await searchPage.openSearch();
      await searchPage.clearSearchHistoryIfShown();
      const keyword = await searchPage.tapTrendingSearch();
      await pfPage.verifySearchResult([keyword]);

      await shopPage.prepareShopPage();
      await searchPage.openSearch();
      await searchPage.verifySearchHistoryExists(keyword);
      await searchPage.deleteSearchHistoryKeyword(keyword);
      await searchPage.verifySearchHistoryDeleted(keyword);
    });
  });
});
