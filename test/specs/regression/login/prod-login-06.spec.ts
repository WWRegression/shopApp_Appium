import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { addToCart } from '../../../helpers/api.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { CartPage } from '../../../pages/cart.page';

/** Auto login by clicking on "Login" CTA on the cart page. */
describe('PROD_LOGIN_06', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const cartPage = new CartPage();

  it('Guest - auto login via Login CTA on cart', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_06', async (site) => {
      // Katalon Launch.startExistingAppWithGuestUser
      await loginPage.startAppAsGuest();
      await mypagePage.verifyLoggedOut();

      await cartPage.selectBnbMenu('cart');
      await cartPage.prepareCartPage();
      await addToCart(site.product.sku);

      // Cart Sign in opens the login page; its login button logs in with the device account, or with Gmail when it was signed out (IN)
      await cartPage.clickLoginOnCart();
      await loginPage.clickLoginBtnOnLoginPage();
      await loginPage.loginWithGmailOnSsoIfShown();

      // Katalon Cart.verifyCartLoad — redirected back to the cart; the WebView reconnects slowly after login (Katalon waits 15s + 10s)
      await cartPage.prepareCartPage(25000);
      await mypagePage.verifyLoggedIn();
    });
  });
});
