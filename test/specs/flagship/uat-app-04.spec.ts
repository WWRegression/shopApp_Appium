import { runOrSkip } from '../../helpers/tc-filter.helper';
import { CartPage } from '../../pages/cart.page';

describe('UAT_APP_04', () => {
  const cartPage = new CartPage();

  it('Trade-In added to cart verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_04', async () => {
      // TODO: reimplement using new BcPage API
      await cartPage.tradeIn.verifyServiceApplied();
    });
  });
});
