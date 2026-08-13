import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { PfPage } from '../../../pages/pf.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_BACKWARD_01', () => {
  const pfPage = new PfPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('PF to payment then back to cart and PF', async function () {
    await runOrSkip.call(this, 'PROD_BACKWARD_01', async () => {
      await pfPage.openFirstProduct();
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
