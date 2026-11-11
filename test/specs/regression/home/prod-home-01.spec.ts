import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { targetPackage } from '../../../helpers/context.helper';
import { clearPackage, restartApp } from '../../../helpers/device.helper';
import { HomePage } from '../../../pages/home.page';
import { OnboardingPage } from '../../../pages/onboarding.page';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { ShopPage } from '../../../pages/shop.page';

/** (Guest user) Verify the initial app setup, continue as guest, TrustArc cookie, and that the TrustArc cookie data is saved. */
describe('PROD_HOME_01', () => {
  const onboardingPage = new OnboardingPage();
  const loginPage = new LoginPage();
  const homePage = new HomePage();  
  const mypagePage = new MypagePage();
  const shopPage = new ShopPage();

  it('Guest User - initial setup, continue as guest, TrustArc cookie', async function () {
    await runOrSkip.call(this, 'PROD_HOME_01', async (site) => {
      // Wiped app without a device account, so the initial setup starts from its first screen
      await clearPackage(targetPackage());
      await loginPage.signOutOnDevice();
      await restartApp();

      await onboardingPage.allowLocationPermission();
      await onboardingPage.selectCountry(site.countryName);
      await onboardingPage.clickAssuranceCancelIfShown();
      await onboardingPage.selectTrustArcCookie('decline');
      await onboardingPage.agreeToPrivacyAndTerms();
      await onboardingPage.selectNotification('yes');
      await onboardingPage.clickGetStarted();
      await onboardingPage.allowNotificationPermission();
      await loginPage.continueAsGuest();

      await homePage.verifyAndCloseCookiePopup();
      await mypagePage.verifyLoggedOut();
      await shopPage.verifyCountry(site.countryName);

      await homePage.configureUniversalBuild();
      await onboardingPage.selectTrustArcCookie('decline');
      await loginPage.continueAsGuestIfShown();

      await mypagePage.openPushNotificationMenu();
      await mypagePage.verifyNotification('yes');
      await mypagePage.openCookiePreferencesMenu();
      await mypagePage.verifyTrustArcCookie('decline');
    });
  });
});
