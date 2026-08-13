import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { LoginPage } from '../../../pages/login.page';

describe('PROD_LOGIN_04', () => {
  const loginPage = new LoginPage();

  it('Registered - logout / login on Account page', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_04', async () => {
      await loginPage.logout();
      await loginPage.loginWithEmailSso();
    });
  });
});
