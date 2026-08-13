import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { LoginPage } from '../../../pages/login.page';

describe('PROD_LOGIN_03', () => {
  const loginPage = new LoginPage();

  it('Guest - SSO Gmail login on empty cart page', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_03', async () => {
      await loginPage.loginWithGmailSso();
    });
  });
});
