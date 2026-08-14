import { runOrSkip } from '../../helpers/tc-filter.helper';
import { ShopPage } from '../../pages/shop.page';
import { LoginPage } from '../../pages/login.page';

describe('UAT_APP_11', () => {
  const shopPage = new ShopPage();
  const loginPage = new LoginPage();

  it('Category and Category Chip on PF for Flagship SKUs', async function () {
    await runOrSkip.call(this, 'UAT_APP_11', async () => {
      await loginPage.loginWithEmailSso();
      await shopPage.openFirstCategory();
      // TODO: reimplement using new PfPage API
    });
  });
});
