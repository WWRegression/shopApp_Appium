import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';

describe('PROD_LOGIN_02', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();

  it('Guest - SSO Gmail login on Account page', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_02', async () => {
      await mypagePage.tapLogin();
      await loginPage.loginWithGmailSso();
    });
  });
});
