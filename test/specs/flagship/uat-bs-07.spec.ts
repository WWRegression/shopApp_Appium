import { runOrSkip } from '../../helpers/tc-filter.helper';
import { PfPage } from '../../pages/pf.page';
import { BcPage } from '../../pages/bc.page';

describe('UAT_BS_07', () => {
  const pfPage = new PfPage();
  const bcPage = new BcPage();

  it('SIM validation on BC', async function () {
    await runOrSkip.call(this, 'UAT_BS_07', async () => {
      await pfPage.openFirstProduct();
      await bcPage.sim.addService();
      await bcPage.sim.verifyServiceApplied();
    });
  });
});
