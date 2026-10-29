import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { PfPage } from '../../../pages/pf.page';
import { SearchPage } from '../../../pages/search.page';


/** Able to search by SKU and use one filter and one sort on the search PF. */
describe('PROD_SEARCH_03', () => {
  const homePage = new HomePage();
  const searchPage = new SearchPage();
  const pfPage = new PfPage();

  it('search by SKU then sort and filter on Search PF', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_03', async () => {
      const keyword = 'SM-S';
      const matches = ['Galaxy S', 'S26', 'S25'];

      await homePage.prepareHomePage();
      await searchPage.searchByKeyword(keyword);
      
      const sort = await pfPage.applySort();
      await pfPage.verifySearchResultAndSort(matches, sort);

      const filter = await pfPage.applyFilter();
      await pfPage.verifySearchResultAndFilter(matches, filter);
    });
  });
});
