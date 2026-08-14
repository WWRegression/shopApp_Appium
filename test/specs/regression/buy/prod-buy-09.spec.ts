import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_BUY_09', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('Price/Special Price consistent across PF/BC/Cart/Checkout', async function () {
    await runOrSkip.call(this, 'PROD_BUY_09', async () => {
      // TODO: reimplement using new PfPage/BcPage API
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
