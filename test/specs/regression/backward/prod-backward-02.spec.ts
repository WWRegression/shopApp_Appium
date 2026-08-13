import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_BACKWARD_02', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('Wishlist to payment then back to cart and Wishlist', async function () {
    await runOrSkip.call(this, 'PROD_BACKWARD_02', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
