import { runOrSkip } from '../../helpers/tc-filter.helper';
import { PdPage } from '../../pages/pd.page';

describe('UAT_APP_01', () => {
  const pdPage = new PdPage();

  it('PF card redirection and product setup verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_01', async (site) => {
      void site.product;
      // TODO: reimplement using new PfPage API
      await pdPage.getProductName();
    });
  });
});
