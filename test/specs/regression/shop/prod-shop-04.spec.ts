import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { ShopPage } from '../../../pages/shop.page';

/** Change country from Shop > Country and stay logged in. Does not switch the country back. */
describe('PROD_SHOP_04', () => {
  const shopPage = new ShopPage();
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();

  it('change country and auto login via Country menu', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_04', async (site) => {
      const target = site.countryName?.startsWith('Chile') ? 'Columbia (Español)' : 'Chile (Español)';

      await shopPage.changeCountry(target);
      
      await loginPage.skipPurpose(20000);
      await shopPage.dismissOverlays();
      
      await mypagePage.verifyLoggedIn();
      await shopPage.verifyCountry(target);
    });
  });
});
