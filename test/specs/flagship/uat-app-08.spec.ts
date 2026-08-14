import { runOrSkip } from '../../helpers/tc-filter.helper';
import { CartPage } from '../../pages/cart.page';

describe('UAT_APP_08', () => {
  const cartPage = new CartPage();

  it('SIM added to cart verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_08', async () => {
      // TODO: reimplement using new BcPage API
      await cartPage.sim.verifyServiceApplied();
    });
  });
});
