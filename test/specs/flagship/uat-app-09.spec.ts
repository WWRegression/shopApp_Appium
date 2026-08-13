import { runOrSkip } from '../../helpers/tc-filter.helper';
import { PfPage } from '../../pages/pf.page';
import { BcPage } from '../../pages/bc.page';

describe('UAT_APP_09', () => {
  const pfPage = new PfPage();
  const bcPage = new BcPage();

  it('EUP (Samsung Flex) validation on BC', async function () {
    await runOrSkip.call(this, 'UAT_APP_09', async () => {
      await pfPage.openFirstProduct();
      await bcPage.eup.addService();
      await bcPage.eup.verifyServiceApplied();
    });
  });
});
