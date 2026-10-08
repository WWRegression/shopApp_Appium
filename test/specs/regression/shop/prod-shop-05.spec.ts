import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { PfPage } from '../../../pages/pf.page';
import { ShopPage } from '../../../pages/shop.page';

/** (Guest user) The wishlist icon on a PF product card shows the login popup when not logged in. */
describe('PROD_SHOP_05', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const shopPage = new ShopPage();
  const pfPage = new PfPage();

  it('Guest User - wishlist icon shows login popup', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_05', async () => {
      await loginPage.startAppAsGuest();
      await mypagePage.verifyLoggedOut();

      await shopPage.openCategory('mobile');
      await pfPage.clickAddToWishlist();
      await pfPage.verifyLoginPopup();
    });
  });

  // Log back in from the popup so the next TCs start logged in (no device account: login page -> Samsung account SSO)
  afterEach(async function () {
    // Sites that skip this TC never logged out
    if (this.currentTest?.isPending()) {
      return;
    }
    await pfPage.clickContinueOnLoginPopup();
    await loginPage.clickLoginBtnOnLoginPage();
    await loginPage.loginWithEmailOnSsoIfShown();
    await loginPage.skipPurpose();
  });
});
