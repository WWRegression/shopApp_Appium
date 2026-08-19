import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { LoginPage } from '../../../pages/login.page';

describe('PROD_HOME_01', () => {
  const homePage = new HomePage();
  const loginPage = new LoginPage();

  it('Guest User - initial setup, continue as guest, TrustArc cookie', async function () {
    await runOrSkip.call(this, 'PROD_HOME_01', async (site) => {
      await homePage.verifyOnboarding();
      await loginPage.continueAsGuest();
      await homePage.dismissCookieIfShown();
      void site;
    });
  });
});
