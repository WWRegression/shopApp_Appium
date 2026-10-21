import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { MypageProfilePage } from '../../../pages/mypage-profile.page';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';

describe('PROD_CHECKOUT_01', function () {
  // Address cleanup plus search to payment runs close to the default 240s on slow sites (UK)
  this.timeout(480000);

  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();
  const mypageProfilePage = new MypageProfilePage();
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();

  it('BC product to cart then checkout order summary', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_01', async (site) => {
      // Precondition: logged in with the device account (the address book and checkout need a registered user)
      await loginPage.preconditionSignedInOnDevice();
      await mypagePage.ensureLoggedIn();

      await cartPage.clearCart();

      await mypageProfilePage.prepareAddressPage();
      await mypageProfilePage.clearAllAddresses();

      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      const productInfo = await bcPage.verifyOptions(site.product);

      await bcPage.galaxyClub.selectNoForService();
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();

      await bcPage.clickAddToCart();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(productInfo.summary.sku);
      await cartPage.verifyOptions(productInfo.summary.sku, productInfo.selected);

      await cartPage.clickContinueToCheckout();
      await checkoutPage.prepareCheckoutPage();

      await checkoutPage.proceedToPayment({ verifyRewardOptIn: true, verifyNoSavedAddress: true });

      await checkoutPage.checkPaymentMethod();

      await checkoutPage.verifyRewardArea();
    });
  });
});
