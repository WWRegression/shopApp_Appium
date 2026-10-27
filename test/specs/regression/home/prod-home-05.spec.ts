import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { targetPackage } from '../../../helpers/context.helper';
import { clearPackage, restartApp } from '../../../helpers/device.helper';
import { HomePage } from '../../../pages/home.page';
import { LoginPage } from '../../../pages/login.page';
import { ShopPage } from '../../../pages/shop.page';

/** Able to change the country via the Country menu on the login boarding page and the Shop page. */
describe('PROD_HOME_05', () => {
  const homePage = new HomePage();
  const loginPage = new LoginPage();
  const shopPage = new ShopPage();

  it('Guest - change country via login boarding and Shop Country menu', async function () {
    await runOrSkip.call(this, 'PROD_HOME_05', async (site) => {
      if (!site.countryName) {
        console.log('[PROD_HOME_05] no countryName — skipped');
        return;
      }
      const target = site.countryName.startsWith('Australia') ? 'Chile (Español)' : 'Australia (English)';

      await clearPackage(targetPackage());
      await loginPage.signOutOnDevice();
      await restartApp();
      await homePage.allowLocationPermissionIfShown();
      await homePage.selectCountry(site.countryName);
      await homePage.clickAssuranceCancelIfShown();
      await homePage.clickTrustArcCookie('decline');
      await homePage.clickTncCheckbox();
      await homePage.selectNotification('yes');
      await homePage.clickGetStarted();
      await homePage.allowNotificationPermissionIfShown();

      await loginPage.changeCountryOnLoginSplash(target);
      await loginPage.continueAsGuest();
      await homePage.dismissCookieIfShown();
      await shopPage.verifyCountry(target);

      await shopPage.changeCountry(site.countryName);
      await loginPage.continueAsGuestIfShown();
      await homePage.dismissCookieIfShown();
      await shopPage.verifyCountry(site.countryName);
    });
  });
});
