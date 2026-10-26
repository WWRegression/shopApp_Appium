import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { addToCart } from '../../../helpers/api.helper';

describe('PROD_CART_05', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('add Trade-Up on cart and go to payment', async function () {
    await runOrSkip.call(this, 'PROD_CART_05', async (site) => {
      const sku = site.search.vdSku ?? site.search.haSku ?? '';
      if (!sku) {
        throw new Error('[PROD_CART_05] site.search.vdSku or site.search.haSku is required');
      }
      await cartPage.clearCart();
      await addToCart(sku);
      await cartPage.verifySku(sku);

      if (['AE', 'AE_AR', 'VN'].includes(site.siteCode)) {
        await cartPage.tradeIn.addService(site.tradeIn);
      } else {
        await cartPage.tradeUp.addService(site.tradeUp?.postalCode ?? '');
      }
      await cartPage.tradeUp.verifyServiceApplied();
      await cartPage.clickContinueToCheckout();

      await checkoutPage.prepareCheckoutPage();
    });
  });
});
