import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { LoginPage } from '../../../pages/login.page';
import { MypagePage } from '../../../pages/mypage.page';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

/** (Guest user) Able to add products from BC page to cart page and go to payment page. */
describe('PROD_CHECKOUT_03', () => {
  const loginPage = new LoginPage();
  const mypagePage = new MypagePage();
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('Guest User - BC product to cart then payment', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_03', async (site) => {
      await loginPage.startAppAsGuest();
      await mypagePage.verifyLoggedOut();

      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);      

      await bcPage.galaxyClub.selectNoForService();
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();

      await bcPage.clickAddToCart();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.clickContinueToCheckout();

      // Guest checkout can open the login page (Sign in / Continue as guest) before the checkout
      await loginPage.continueAsGuestToCheckoutIfShown();
      await checkoutPage.prepareCheckoutPage();

      await checkoutPage.proceedToPayment({ verifyRewardOptIn: true });

      await checkoutPage.verifyRewardArea();

      await checkoutPage.checkPaymentMethod();

      // The checkout must have stayed a guest checkout
      await mypagePage.verifyLoggedOut();
    });
  });
});
