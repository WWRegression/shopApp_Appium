import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';

describe('PROD_SEARCH_04', () => {
  const searchPage = new SearchPage();

  it('search by product name then filter/sort on Search PF', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_04', async (site) => {
      await searchPage.searchByKeyword(site.product.deviceName);
      // TODO: reimplement using new PfPage API
    });
  });
});
