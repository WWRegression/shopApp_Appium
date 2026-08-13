import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';
import { CartPage } from '../../pages/cart.page';

describe('UAT_APP_08', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('SIM added to cart verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_08', async () => {
      await bcPage.proceedToCart();
      await cartPage.sim.verifyServiceApplied();
    });
  });
});
