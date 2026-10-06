import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';

/** Verify that selecting the profile on the Account page redirects to the correct page. */
describe('PROD_MYPAGE_01', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();

  it('profile redirects to the correct page', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_01', async () => {
      // Name of the Samsung account signed in on the device
      const accountName = await loginPage.getAccountNameOnDevice();

      await mypagePage.prepareMypage();
      await mypagePage.verifyProfileName(accountName);

      await mypagePage.clickProfileOnMypage(accountName);
      await mypagePage.verifyProfileRedirected();
    });
  });
});
