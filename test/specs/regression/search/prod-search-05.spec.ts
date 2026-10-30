import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { PfPage } from '../../../pages/pf.page';
import { SearchPage } from '../../../pages/search.page';

/** Card titles stay "Galaxy Watch" / "Galaxy Fit" on many shops, including after a local search. */
const WATCH_RESULT_KEYWORDS = ['watch', 'fit', 'ساعة'];

/** Able to search by local language and use one filter and one sort on the search PF. */
describe('PROD_SEARCH_05', () => {
  const homePage = new HomePage();
  const searchPage = new SearchPage();
  const pfPage = new PfPage();

  it('search by local language then sort and filter on Search PF', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_05', async (site) => {
      const keyword = site.search.localKeyword;
      const matches = [...WATCH_RESULT_KEYWORDS, keyword];

      await homePage.prepareHomePage();
      await searchPage.searchByKeyword(keyword);

      const sort = await pfPage.applySort();
      await pfPage.verifySearchResultAndSort(matches, sort);

      const filter = await pfPage.applyFilter();
      await pfPage.verifySearchResultAndFilter(matches, filter);
    });
  });
});
