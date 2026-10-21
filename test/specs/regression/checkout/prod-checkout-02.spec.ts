import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { addMultipleToCart } from '../../../helpers/api.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';

describe('PROD_CHECKOUT_02', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('multi products (IM, VD, HA) to cart then payment', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_02', async (site) => {
      // Precondition: logged in with the device account, so Continue to checkout opens the checkout and not the login page
      await loginPage.preconditionSignedInOnDevice();
      await mypagePage.ensureLoggedIn();

      await cartPage.clearCart();

      const skus = [site.product.sku, site.search.haSku, site.search.vdSku].filter(
        (sku): sku is string => Boolean(sku)
      );
      await addMultipleToCart(skus);

      await cartPage.prepareCartPage();
      await cartPage.clickContinueToCheckout();
      await checkoutPage.prepareCheckoutPage();

      await checkoutPage.proceedToPayment();

      await checkoutPage.checkPaymentMethod();

    });
  });
});
