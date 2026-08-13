import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { PdPage } from '../../../pages/pd.page';
import { CartPage } from '../../../pages/cart.page';

describe('PROD_BUY_05', () => {
  const pdPage = new PdPage();
  const cartPage = new CartPage();

  it('add Trade-Up on PD and verify Trade-In in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_05', async (site) => {
      void site.tradeUp;
      await pdPage.tradeIn.addService();
      await pdPage.tradeIn.verifyServiceApplied();
      await pdPage.addToCart();
      await cartPage.tradeIn.verifyServiceApplied();
    });
  });
});
