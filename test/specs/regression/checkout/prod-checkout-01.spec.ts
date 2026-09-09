import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { AddOnPage } from '../../../pages/addon.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { clearSavedAddresses } from '../../../helpers/api.helper';

describe('PROD_CHECKOUT_01', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const addOnPage = new AddOnPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('BC product to cart then checkout order summary', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_01', async (site) => {
      await cartPage.clearCart();
      await clearSavedAddresses();
      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      await bcPage.verifyOptions(site.product);
      await bcPage.galaxyClub.selectNoForService();
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();
      
      await bcPage.clickAddToCart();
      await addOnPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.product.sku);
      await cartPage.verifyOptions(site.product.sku, site.product);
      
      await cartPage.clickContinueToCheckout();
      await checkoutPage.prepareCheckoutPage();
      
      await checkoutPage.runCheckout();

      await checkoutPage.verifyNoRewardOptIn();
      await checkoutPage.verifyRewardArea();

      await checkoutPage.checkPaymentMethod();
    });
  });
});
