import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';

describe('PROD_HOME_02', () => {
  const homePage = new HomePage();

  it('Registered User - initial setup, auto-login, TrustArc cookie', async function () {
    await runOrSkip.call(this, 'PROD_HOME_02', async () => {
      await homePage.verifyOnboarding();
      await homePage.dismissCookieIfShown();
    });
  });
});
