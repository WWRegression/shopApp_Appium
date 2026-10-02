import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { restartApp } from '../../../helpers/device.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { CartPage } from '../../../pages/cart.page';

/** (Not logged in on the device settings) Login by SSO (Gmail option) on the empty cart page. */
describe('PROD_LOGIN_03', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const cartPage = new CartPage();

  it('Guest - SSO Gmail login on empty cart page', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_03', async () => {
      await loginPage.signOutOnDevice();
      await restartApp();
      await mypagePage.dismissOverlays();
      await loginPage.continueAsGuest();

      // Try logging out again on My Page to make sure
      await mypagePage.logoutOnMypage();
      await mypagePage.verifyLoggedOut();

      await cartPage.clearCart();

      // Login on the empty cart page
      await cartPage.clickLoginOnCart();
      await loginPage.clickLoginBtnOnLoginPage();
      await loginPage.loginWithGmailOnSso();
      await loginPage.skipPurpose();

      await cartPage.verifyLoggedInOnCart();
      await mypagePage.verifyLoggedIn();
    });
  });
});
