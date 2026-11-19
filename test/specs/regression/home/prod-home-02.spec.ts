import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { targetPackage } from '../../../helpers/context.helper';
import { clearPackage, restartApp } from '../../../helpers/device.helper';
import { HomePage } from '../../../pages/home.page';
import { OnboardingPage } from '../../../pages/onboarding.page';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { ShopPage } from '../../../pages/shop.page';

/** (Registered user) Verify the initial app setup, auto-login, TrustArc cookie, and that the TrustArc cookie data is saved. */
describe('PROD_HOME_02', () => {
  const onboardingPage = new OnboardingPage();
  const loginPage = new LoginPage();
  const homePage = new HomePage();
  const shopPage = new ShopPage();
  const mypagePage = new MypagePage();

  it('Registered User - initial setup, auto-login, TrustArc cookie', async function () {
    await runOrSkip.call(this, 'PROD_HOME_02', async (site) => {
      // Wiped app with the device account, so the initial setup starts from its first screen and logs in automatically
      await clearPackage(targetPackage());
      await loginPage.signInOnDevice();
      await restartApp();

      await onboardingPage.allowLocationPermission();
      await onboardingPage.selectCountry(site.countryName);
      await onboardingPage.clickAssuranceCancelIfShown();
      await onboardingPage.selectTrustArcCookie('accept');
      await onboardingPage.agreeToPrivacyAndTerms();
      await onboardingPage.selectNotification('no');
      await onboardingPage.clickGetStarted();

      await loginPage.clickLoginBtnOnLoginPageForCnIn();
      await loginPage.skipPurpose();

      await homePage.verifyAndCloseCookiePopup();
      await mypagePage.verifyLoggedIn({ continueOnFail: true });
      await shopPage.verifyCountry(site.countryName);

      await homePage.configureUniversalBuild();
      await onboardingPage.selectTrustArcCookieIfShown('accept');
      await loginPage.loginOnSelectProfileIfShown();
      await loginPage.skipPurpose();

      await mypagePage.openPushNotificationMenu();
      await mypagePage.verifyNotification('no');
      await mypagePage.openCookiePreferencesMenu();
      await mypagePage.verifyTrustArcCookie('accept');
    });
  });
});
