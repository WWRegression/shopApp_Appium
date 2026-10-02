import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { PdPage } from '../../../pages/pd.page';

/**
 * PROD_BUY_06
 * Verify Native PD page is shown for VD product
 */
describe('PROD_BUY_06', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const pdPage = new PdPage();

  it('Native PD is shown', async function () {
    await runOrSkip.call(this, 'PROD_BUY_06', async (site) => {
      await searchPage.searchByKeyword(site.search.vdSku ?? '');
      await pfPage.selectPfCard({ mode: 'first' });
      await pdPage.verifySkuForNativePdPage(site.search.vdSku ?? '');
    });
  });
});
