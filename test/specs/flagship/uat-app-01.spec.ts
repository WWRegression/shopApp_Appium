import { runOrSkip } from '../../helpers/tc-filter.helper';
import { PfPage } from '../../pages/pf.page';
import { PdPage } from '../../pages/pd.page';

describe('UAT_APP_01', () => {
  const pfPage = new PfPage();
  const pdPage = new PdPage();

  it('PF card redirection and product setup verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_01', async (site) => {
      void site.product;
      await pfPage.verifyProductGridDisplayed();
      await pfPage.openFirstProduct();
      await pfPage.verifyProductSetupSections();
      await pdPage.getProductName();
    });
  });
});
