import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';
import { PfPage } from '../../../pages/pf.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_BUY_09', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();
  const pfPage = new PfPage();
  const checkoutPage = new CheckoutPage();

  it('Price/Special Price consistent across PF/BC/Cart/Checkout', async function () {
    await runOrSkip.call(this, 'PROD_BUY_09', async () => {
      await pfPage.verifyProductGridDisplayed();
      await bcPage.proceedToCart();
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyOnCheckout();
    });
  });
});
