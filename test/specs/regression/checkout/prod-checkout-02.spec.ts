import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_CHECKOUT_02', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('multi products (IM, VD, HA) to cart then payment', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_02', async (site) => {
      void site.search;
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
