import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { PfPage } from '../../../pages/pf.page';
import { SearchPage } from '../../../pages/search.page';

/** Able to search by product name and use one filter and one sort on the search PF. */
describe('PROD_SEARCH_04', () => {
  const homePage = new HomePage();
  const searchPage = new SearchPage();
  const pfPage = new PfPage();

  it('search by product name then filter and sort on Search PF', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_04', async () => {
      const keyword = 'S26';
      const matches = ['S26'];

      await homePage.prepareHomePage();
      await searchPage.searchByKeyword(keyword);

      const sort = await pfPage.applySort();
      await pfPage.verifySearchResultAndSort(matches, sort);

      const filter = await pfPage.applyFilter();
      await pfPage.verifySearchResultAndFilter(matches, filter);
    });
  });
});
