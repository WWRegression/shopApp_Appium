import { runOrSkip } from '../../helpers/tc-filter.helper';
import { PfPage } from '../../pages/pf.page';
import { ShopPage } from '../../pages/shop.page';
import { LoginPage } from '../../pages/login.page';

describe('UAT_APP_11', () => {
  const pfPage = new PfPage();
  const shopPage = new ShopPage();
  const loginPage = new LoginPage();

  it('Category and Category Chip on PF for Flagship SKUs', async function () {
    await runOrSkip.call(this, 'UAT_APP_11', async () => {
      await loginPage.loginWithEmailSso();
      await shopPage.openFirstCategory();
      await pfPage.verifyProductGridDisplayed();
    });
  });
});
