import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';

/**
 * PROD_BUY_01
 * Able to add trade-in on BC page, verify that TradeIn is added to the cart
 */
describe('PROD_BUY_01', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();

  it('add Trade-In on BC and verify in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_01', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      await bcPage.verifySku(site.product.sku);

      await bcPage.tradeIn.addService(site.tradeIn);
      await bcPage.tradeIn.verifyServiceApplied();

      await bcPage.scPlus.selectNoForService();
      await bcPage.galaxyClub.selectNoForService();

      await bcPage.clickAddToCart();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.tradeIn.verifyServiceApplied();
      await cartPage.verifySku(site.product.sku);
    });
  });
});
