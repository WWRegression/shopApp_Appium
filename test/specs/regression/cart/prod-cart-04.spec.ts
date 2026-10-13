import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { PfPage } from '../../../pages/pf.page';
import { SearchPage } from '../../../pages/search.page';
import { BcPage } from '../../../pages/bc.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_CART_04', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('add EUP on cart and go to payment', async function () {
    await runOrSkip.call(this, 'PROD_CART_04', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard({ mode: 'first' });
      
      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      await bcPage.verifySku(site.product.sku);
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();
      await bcPage.galaxyClub.selectNoForService();
      await bcPage.clickAddToCart();      
      await splashPage.clickSplashContinue();

      await cartPage.verifySku(site.product.sku);
      await cartPage.eup.addService();     
      await cartPage.clickContinueToCheckout();

      await checkoutPage.prepareCheckoutPage();
    });
  });
});
