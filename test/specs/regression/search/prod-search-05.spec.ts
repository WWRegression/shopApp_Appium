import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';

describe('PROD_SEARCH_05', () => {
  const searchPage = new SearchPage();

  it('search by local language then filter/sort on Search PF', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_05', async (site) => {
      await searchPage.searchByKeyword(site.search.keyword);
      // TODO: reimplement using new PfPage API
    });
  });
});
