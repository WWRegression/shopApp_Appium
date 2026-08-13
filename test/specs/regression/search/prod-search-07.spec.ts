import { runOrSkip } from '../../../helpers/tc-filter.helper';

describe('PROD_SEARCH_07', () => {
  it('keyword suggestions show product card/categories and redirect', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_07', async (site) => {
      void site.search.keyword;
    });
  });
});
