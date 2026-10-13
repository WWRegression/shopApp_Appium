import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { targetPackage } from '../../../helpers/context.helper';
import { clearPackage, restartApp } from '../../../helpers/device.helper';
import { HomePage } from '../../../pages/home.page';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { ShopPage } from '../../../pages/shop.page';

/** (Guest user) Verify the initial app setup, continue as guest, TrustArc cookie, and that the TrustArc cookie data is saved. */
describe('PROD_HOME_01', () => {
  const homePage = new HomePage();
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const shopPage = new ShopPage();

  it('Guest User - initial setup, continue as guest, TrustArc cookie', async function () {
    await runOrSkip.call(this, 'PROD_HOME_01', async (site) => {
      // Wiped app without a device account, so the initial setup starts from its first screen
      await clearPackage(targetPackage());
      await loginPage.signOutOnDevice();
      await restartApp();
      await homePage.allowLocationPermissionIfShown();

      await homePage.selectCountry(site.countryName);
      await homePage.clickTrustArcCookie('decline');
      await homePage.clickTncCheckbox();
      await homePage.selectNotification('yes');
      await homePage.clickGetStarted();
      await homePage.allowNotificationPermissionIfShown();

      await loginPage.continueAsGuestIfShown();
      await homePage.verifyCookiePopup();
      await mypagePage.verifyLoggedOut();

      await shopPage.verifyCountry(site.countryName);
      await homePage.enableWebviewDebugging();
      await loginPage.continueAsGuestIfShown();

      await mypagePage.prepareNotificationPage();
      await mypagePage.verifyNotification('yes');
      await mypagePage.prepareCookiePreferencesPage();
      await mypagePage.verifyTrustArcCookie('decline');
    });
  });
});
