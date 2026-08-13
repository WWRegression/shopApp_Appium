import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_CART_05', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('add Trade-Up on cart and go to payment', async function () {
    await runOrSkip.call(this, 'PROD_CART_05', async (site) => {
      void site.tradeUp;
      await cartPage.tradeIn.addService();
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
