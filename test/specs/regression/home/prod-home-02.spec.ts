import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { targetPackage } from '../../../helpers/context.helper';
import { clearPackage, restartApp } from '../../../helpers/device.helper';
import { HomePage } from '../../../pages/home.page';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { ShopPage } from '../../../pages/shop.page';

/** (Registered user) Verify the initial app setup, auto-login, TrustArc cookie, and that the TrustArc cookie data is saved. */
describe('PROD_HOME_02', () => {
  const homePage = new HomePage();
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const shopPage = new ShopPage();

  it('Registered User - initial setup, auto-login, TrustArc cookie', async function () {
    await runOrSkip.call(this, 'PROD_HOME_02', async (site) => {
      // Wiped app with the device account, so the initial setup starts from its first screen and logs in automatically
      await clearPackage(targetPackage());
      await loginPage.signInOnDevice();
      await restartApp();
      await homePage.allowLocationPermissionIfShown();
      await homePage.selectCountry(site.countryName);
      
      await homePage.clickAssuranceCancelIfShown();

      await homePage.clickTrustArcCookie('accept');
      await homePage.clickTncCheckbox();
      await homePage.selectNotification('no');
      await homePage.clickGetStarted();

      await loginPage.clickLoginBtnOnLoginPageForCnIn();
      await loginPage.skipPurpose();
      await homePage.verifyCookiePopup();
      await mypagePage.verifyLoggedIn({ continueOnFail: true });

      await shopPage.verifyCountry(site.countryName);
      await homePage.applyBuildSetup();
      await loginPage.loginOnSelectProfileIfShown();
      await loginPage.skipPurpose();

      await mypagePage.prepareNotificationPage();
      await mypagePage.verifyNotification('no');
      await mypagePage.prepareCookiePreferencesPage();
      await mypagePage.verifyTrustArcCookie('accept');
    });
  });
});
