import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { AddOnPage } from '../../../pages/addon.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { MypageProfilePage } from '../../../pages/mypage-profile.page';

describe('PROD_CHECKOUT_01', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const addOnPage = new AddOnPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();
  const mypageProfilePage = new MypageProfilePage();

  it('BC product to cart then checkout order summary', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_01', async (site) => {
      await cartPage.clearCart();

      await mypageProfilePage.prepareAddressPage();
      await mypageProfilePage.clearAllAddresses();

      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      const bcSummary = await bcPage.verifyOptions(site.product);

      await bcPage.galaxyClub.selectNoForService();
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();

      await bcPage.clickAddToCart();
      await addOnPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(bcSummary.sku);
      await cartPage.verifyOptions(bcSummary.sku, bcSummary);

      await cartPage.clickContinueToCheckout();
      await checkoutPage.prepareCheckoutPage();

      await checkoutPage.runCheckout();

      await checkoutPage.verifyNoRewardOptIn();
      await checkoutPage.verifyRewardArea();

      await checkoutPage.checkPaymentMethod();
    });
  });
});
