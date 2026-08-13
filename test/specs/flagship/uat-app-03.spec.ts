import { runOrSkip } from '../../helpers/tc-filter.helper';
import { PfPage } from '../../pages/pf.page';
import { BcPage } from '../../pages/bc.page';

describe('UAT_APP_03', () => {
  const pfPage = new PfPage();
  const bcPage = new BcPage();

  it('Trade-In validation on BC', async function () {
    await runOrSkip.call(this, 'UAT_APP_03', async (site) => {
      void site.tradeIn;
      await pfPage.openFirstProduct();
      await bcPage.tradeIn.addService();
      await bcPage.tradeIn.verifyServiceApplied();
    });
  });
});
