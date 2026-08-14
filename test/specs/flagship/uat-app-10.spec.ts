import { runOrSkip } from '../../helpers/tc-filter.helper';
import { CartPage } from '../../pages/cart.page';

describe('UAT_APP_10', () => {
  const cartPage = new CartPage();

  it('EUP added to cart verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_10', async () => {
      // TODO: reimplement using new BcPage API
      await cartPage.eup.verifyServiceApplied();
    });
  });
});
