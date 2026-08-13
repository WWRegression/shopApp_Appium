import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';

describe('PROD_SEARCH_04', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();

  it('search by product name then filter/sort on Search PF', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_04', async (site) => {
      await searchPage.searchByKeyword(site.product.deviceName);
      await pfPage.applyFilterAndSort();
    });
  });
});
