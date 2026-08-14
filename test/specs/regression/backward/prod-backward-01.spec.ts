import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_BACKWARD_01', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('PF to payment then back to cart and PF', async function () {
    await runOrSkip.call(this, 'PROD_BACKWARD_01', async () => {
      // TODO: reimplement using new PfPage API
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
