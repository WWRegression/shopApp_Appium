import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_CART_04', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('add EUP on cart and go to payment', async function () {
    await runOrSkip.call(this, 'PROD_CART_04', async () => {
      await cartPage.eup.addService();
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
