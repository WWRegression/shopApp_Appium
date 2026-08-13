import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';

describe('PROD_HOME_03', () => {
  const homePage = new HomePage();

  it('BNB Home/Shop/Offers/Cart/Account redirects correctly', async function () {
    await runOrSkip.call(this, 'PROD_HOME_03', async () => {
      await homePage.verifyBottomNavigation();
    });
  });
});
