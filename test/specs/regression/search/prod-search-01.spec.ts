import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';

describe('PROD_SEARCH_01', () => {
  const searchPage = new SearchPage();

  it('keyword search and save/delete search history', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_01', async (site) => {
      await searchPage.searchByKeyword(site.search.keyword);
      await searchPage.clearSearchHistory();
    });
  });
});
