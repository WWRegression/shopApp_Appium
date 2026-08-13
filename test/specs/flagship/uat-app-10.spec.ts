import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';
import { CartPage } from '../../pages/cart.page';

describe('UAT_APP_10', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('EUP added to cart verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_10', async () => {
      await bcPage.proceedToCart();
      await cartPage.eup.verifyServiceApplied();
    });
  });
});
