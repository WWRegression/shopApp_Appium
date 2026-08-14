import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';

describe('UAT_APP_05', () => {
  const bcPage = new BcPage();

  it('SC+ validation on BC', async function () {
    await runOrSkip.call(this, 'UAT_APP_05', async () => {
      // TODO: reimplement using new PfPage API
      await bcPage.scPlus.addService();
      await bcPage.scPlus.verifyServiceApplied();
    });
  });
});
