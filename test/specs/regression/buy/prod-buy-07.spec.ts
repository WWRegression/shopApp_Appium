import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { PdPage } from '../../../pages/pd.page';

/**
 * PROD_BUY_07
 * Verify AR function on TV/Monitor (VD) PD
 */
describe('PROD_BUY_07', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const pdPage = new PdPage();
  
  it('AR function on TV/Monitor PD', async function () {
    await runOrSkip.call(this, 'PROD_BUY_07', async (site) => {
      await searchPage.searchByKeyword(site.search.vdSku ?? '');
      await pfPage.selectPfCard({ mode: 'first' });

      await pdPage.preparePdPage();
      await pdPage.verifySku(site.search.vdSku ?? '');      
      await pdPage.openArAndVerify();
    });
  });
});
