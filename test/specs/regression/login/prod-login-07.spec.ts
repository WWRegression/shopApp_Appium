import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { addToCart } from '../../../helpers/api.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

/** Auto login by clicking on "Login" CTA on the checkout page. */
describe('PROD_LOGIN_07', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('Guest - auto login via Login CTA on checkout', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_07', async (site) => {
      // Katalon Launch.startExistingAppWithGuestUser
      await loginPage.startAppAsGuest();
      await mypagePage.verifyLoggedOut();

      await cartPage.selectBnbMenu('cart');
      await cartPage.prepareCartPage();
      await addToCart(site.product.sku);
      await cartPage.clickContinueToCheckout();
      await checkoutPage.prepareCheckoutPage();

      // Checkout Login opens the login page; its login button logs in with the device account
      await checkoutPage.clickLoginOnCheckout();
      await loginPage.clickLoginBtnOnLoginPage();
      await loginPage.skipPurpose();

      // Katalon Checkout.verifyCheckoutPage — redirected back to the checkout
      await checkoutPage.prepareCheckoutPage();
      await mypagePage.verifyLoggedIn();
    });
  });
});
