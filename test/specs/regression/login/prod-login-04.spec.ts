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
      await loginPage.signInOnDevice();
      await restartApp();
      await loginPage.openHome();

      await mypagePage.logoutOnMypage();
      await mypagePage.verifyLoggedOut();

      // Device already has a Samsung account, so the login button on the login page logs in without typing credentials
      await mypagePage.clickLoginOnMypage();
      await loginPage.clickLoginBtnOnLoginPage();
      await loginPage.skipPurpose();

      await mypagePage.verifyLoggedIn();
    });
  });
});
