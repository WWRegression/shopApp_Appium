import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { addToCart } from '../../../helpers/api.helper';

describe('PROD_CART_04', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('add EUP on cart and go to payment', async function () {
    await runOrSkip.call(this, 'PROD_CART_04', async (site) => {
      await cartPage.clearCart();
      await addToCart(site.product.imSku);

      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.product.imSku);
      await cartPage.eup.addService();
      await cartPage.clickContinueToCheckout();

      await checkoutPage.verifyCheckoutPage();
    });
  });
});
