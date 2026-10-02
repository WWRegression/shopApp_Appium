import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { restartApp } from '../../../helpers/device.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';

/** (Not logged in on the device settings) Login by SSO (Email option) on Account page. */
describe('PROD_LOGIN_01', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();

  it('Guest - SSO Email login on Account page', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_01', async () => {
      await loginPage.signOutOnDevice();
      await loginPage.clearAppDataForIn();
      await restartApp();
      await mypagePage.dismissOverlays();
      await loginPage.continueAsGuestIfShown();

      // Make sure the app is logged out
      await mypagePage.ensureLoggedOut();
      await mypagePage.verifyLoggedOut();

      await mypagePage.clickLoginOnMypage();
      await loginPage.clickLoginBtnOnLoginPage();
      await loginPage.loginWithEmailOnSso();
      await loginPage.skipPurpose();

      await mypagePage.verifyLoggedIn();
    });
  });
});
