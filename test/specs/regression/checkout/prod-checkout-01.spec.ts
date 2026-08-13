import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_CHECKOUT_01', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('BC product to cart then payment page', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_01', async (site) => {
      void site.product;
      void site.shipping;
      await bcPage.proceedToCart();
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
