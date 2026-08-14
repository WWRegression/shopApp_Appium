import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';

describe('UAT_APP_03', () => {
  const bcPage = new BcPage();

  it('Trade-In validation on BC', async function () {
    await runOrSkip.call(this, 'UAT_APP_03', async (site) => {
      void site.tradeIn;
      // TODO: reimplement using new PfPage API
      await bcPage.tradeIn.addService();
      await bcPage.tradeIn.verifyServiceApplied();
    });
  });
});
