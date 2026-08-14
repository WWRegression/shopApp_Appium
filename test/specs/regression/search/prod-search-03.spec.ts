import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';

describe('PROD_SEARCH_03', () => {
  const searchPage = new SearchPage();

  it('search by SKU then filter/sort on Search PF', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_03', async (site) => {
      await searchPage.searchByKeyword(site.product.sku);
      // TODO: reimplement using new PfPage API
    });
  });
});
