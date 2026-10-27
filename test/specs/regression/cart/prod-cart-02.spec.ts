import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { addToCart } from '../../../helpers/api.helper';

describe('PROD_CART_02', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('add Trade-In on cart and go to payment', async function () {
    await runOrSkip.call(this, 'PROD_CART_02', async (site) => {
      await cartPage.clearCart();
      await addToCart(site.product.sku);

      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.product.sku);
      
      await cartPage.tradeIn.addService(site.tradeIn);
      await cartPage.tradeIn.verifyServiceApplied();
      await cartPage.clickContinueToCheckout();
      await checkoutPage.verifyCheckoutPage();
    });
  });
});
