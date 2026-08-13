import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { LoginPage } from '../../../pages/login.page';

describe('PROD_HOME_05', () => {
  const loginPage = new LoginPage();

  it('Guest - change country via login boarding and Shop Country menu', async function () {
    await runOrSkip.call(this, 'PROD_HOME_05', async (site) => {
      await loginPage.continueAsGuest();
      // TODO: change country using site.countryName
      void site.countryName;
    });
  });
});
