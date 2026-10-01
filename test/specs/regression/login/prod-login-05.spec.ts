import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { addToCart } from '../../../helpers/api.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

/** Auto login by click on "Continue to checkout" CTA on the cart page. */
describe('PROD_LOGIN_05', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('Guest - auto login via Continue to checkout CTA', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_05', async (site) => {
      // Katalon Launch.startExistingAppWithGuestUser
      await loginPage.startAppAsGuest();      
      await mypagePage.verifyLoggedOut();

      await cartPage.selectBnbMenu('cart');
      await cartPage.prepareCartPage();
      await addToCart(site.product.sku);
      // await cartPage.prepareCartPage();
      await cartPage.clickContinueToCheckout();

      // Guest checkout opens the login page; its login button logs in with the device account, or with Gmail when it was signed out (IN)
      await loginPage.verifyLoginPage();
      await loginPage.clickLoginBtnOnLoginPage();
      await loginPage.loginWithGmailOnSsoIfShown();
      await loginPage.skipPurpose();

      await checkoutPage.prepareCheckoutPage();
      await mypagePage.verifyLoggedIn();
    });
  });
});
