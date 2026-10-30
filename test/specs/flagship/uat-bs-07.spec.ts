import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';

describe('UAT_BS_07', () => {
  const bcPage = new BcPage();

  it('SIM validation on BC', async function () {
    await runOrSkip.call(this, 'UAT_BS_07', async (site) => {
      // TODO: reimplement using new PfPage API
      await bcPage.sim.addService(site.product.imSku);
      await bcPage.sim.verifyServiceApplied();
    });
  });
});
