import { runOrSkip } from '../../helpers/tc-filter.helper';
import { PfPage } from '../../pages/pf.page';
import { BcPage } from '../../pages/bc.page';

describe('UAT_APP_05', () => {
  const pfPage = new PfPage();
  const bcPage = new BcPage();

  it('SC+ validation on BC', async function () {
    await runOrSkip.call(this, 'UAT_APP_05', async () => {
      await pfPage.openFirstProduct();
      await bcPage.scPlus.addService();
      await bcPage.scPlus.verifyServiceApplied();
    });
  });
});
