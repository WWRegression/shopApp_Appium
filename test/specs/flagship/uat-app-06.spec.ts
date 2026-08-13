import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';
import { CartPage } from '../../pages/cart.page';

describe('UAT_APP_06', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('SC+ added to cart verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_06', async () => {
      await bcPage.proceedToCart();
      await cartPage.scPlus.verifyServiceApplied();
    });
  });
});
