import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

/** Verify that the Price/Special Price is displayed consistently across PF/BC/Cart/Checkout pages. */
describe('PROD_BUY_09', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('Price/Special Price consistent across PF/BC/Cart/Checkout', async function () {
    await runOrSkip.call(this, 'PROD_BUY_09', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.imSku);
      const pfPrice = await pfPage.getFirstCardPrice();
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      await bcPage.verifySku(site.product.imSku);
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();
      await bcPage.galaxyClub.selectNoForService();
      await bcPage.verifyTotalPrice(pfPrice);

      await bcPage.clickAddToCart();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.product.imSku);
      const cartPrice = await cartPage.verifyItemPrice(site.product.imSku, pfPrice);

      await cartPage.clickContinueToCheckout();
      await checkoutPage.prepareCheckoutPage();
      await checkoutPage.verifyItemPrice(site.product.imSku, cartPrice);
    });
  });
});
