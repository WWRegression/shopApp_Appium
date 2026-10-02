import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { restartApp } from '../../../helpers/device.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';

/** Verify app logout after deleting the SSO account from device settings. */
describe('PROD_LOGIN_08', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();

  it('Registered - logout after deleting SSO account from device settings', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_08', async () => {
      // Precondition: logged in with the device account
      await loginPage.signInOnDevice();
      await restartApp();
      await loginPage.openHome();
      await mypagePage.ensureLoggedIn();

      // Delete the device account (IN keeps its app data, so it opens on "Select profile")
      await loginPage.signOutOnDevice(false);

      // Verify logout status in app
      await restartApp();
      await mypagePage.dismissOverlays();
      await loginPage.continueAsGuest();
      await mypagePage.verifyLoggedOut();

      // Login for next TC execution
      await mypagePage.clickLoginOnMypage();
      await loginPage.clickLoginBtnOnLoginPage();
      await loginPage.loginWithGmailOnSso();
    });
  });
});
