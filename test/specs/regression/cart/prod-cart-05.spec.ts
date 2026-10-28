import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { addToCart } from '../../../helpers/api.helper';

describe('PROD_CART_05', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('add Trade-Up on cart and go to payment', async function () {
    await runOrSkip.call(this, 'PROD_CART_05', async (site) => {
      const vdSku = site.search.vdSku ?? '';
      await cartPage.clearCart();
      await addToCart(vdSku);

      await cartPage.prepareCartPage();
      await cartPage.verifySku(vdSku);
      if (['AE', 'AE_AR', 'VN'].includes(site.siteCode)) {
        await cartPage.tradeIn.addService(site.tradeIn);
      } else {
        await cartPage.tradeUp.addService(site.tradeUp?.postalCode ?? '');
      }
      await cartPage.tradeUp.verifyServiceApplied();
      await cartPage.clickContinueToCheckout();
      await checkoutPage.verifyCheckoutPage();
    });
  });
});
