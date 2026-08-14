import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';

describe('PROD_BUY_04', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('add EUP on BC and verify in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_04', async (site) => {
      void site.checkout?.eupImei;
      await bcPage.eup.addService();
      await bcPage.eup.verifyServiceApplied();
      await cartPage.eup.verifyServiceApplied();
    });
  });
});
