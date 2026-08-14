import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';

describe('PROD_BUY_02', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('add SC+ on BC and verify in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_02', async (site) => {
      void site.product;
      await bcPage.scPlus.addService();
      await bcPage.scPlus.verifyServiceApplied();
      await cartPage.scPlus.verifyServiceApplied();
    });
  });
});
