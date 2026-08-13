import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';

describe('PROD_BUY_03', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('add SIM on BC and verify in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_03', async () => {
      await bcPage.sim.addService();
      await bcPage.sim.verifyServiceApplied();
      await bcPage.proceedToCart();
      await cartPage.sim.verifyServiceApplied();
    });
  });
});
