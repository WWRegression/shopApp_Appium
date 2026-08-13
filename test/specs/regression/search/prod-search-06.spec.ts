import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';

describe('PROD_SEARCH_06', () => {
  const searchPage = new SearchPage();

  it('blacklist/special characters show no-result page', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_06', async () => {
      await searchPage.searchByKeyword('iPhone');
      await searchPage.verifyNoResultPage();
    });
  });
});
