import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';

describe('UAT_APP_09', () => {
  const bcPage = new BcPage();

  it('EUP (Samsung Flex) validation on BC', async function () {
    await runOrSkip.call(this, 'UAT_APP_09', async () => {
      // TODO: reimplement using new PfPage API
      await bcPage.eup.addService();
      await bcPage.eup.verifyServiceApplied();
    });
  });
});
