import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';
import { CartPage } from '../../pages/cart.page';

describe('UAT_APP_04', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('Trade-In added to cart verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_04', async () => {
      await bcPage.proceedToCart();
      await cartPage.tradeIn.verifyServiceApplied();
    });
  });
});
