import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { restartApp } from '../../../helpers/device.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';

/** (Logged in on the device settings) Able to logout / login on Account page. */
describe('PROD_LOGIN_04', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();

  it('Registered - logout / login on Account page', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_04', async () => {
      await loginPage.signInSamsungAccountOnDevice();
      await restartApp();
      await mypagePage.dismissPermissionPopups();
      await mypagePage.selectHome();

      await mypagePage.logoutOnMypage();
      await mypagePage.verifyLoggedOut();

      // Device already has a Samsung account, so Sign in on the SSO page logs in without typing credentials
      await mypagePage.clickLoginOnMypage();
      await loginPage.clickSsoSignIn();
      await loginPage.skipPurposeIfShown();

      await mypagePage.verifyLoggedIn();
    });
  });
});
