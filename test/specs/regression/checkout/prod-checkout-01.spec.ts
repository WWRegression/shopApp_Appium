import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_CHECKOUT_01', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('BC product to cart then payment page', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_01', async (site) => {
      void site.product;
      void site.shipping;
      // TODO: reimplement using new BcPage API
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
