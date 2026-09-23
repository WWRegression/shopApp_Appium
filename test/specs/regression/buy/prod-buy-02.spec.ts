import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { BcPage } from '../../../pages/bc.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';
import { PfPage } from '../../../pages/pf.page';

/**
 * PROD_BUY_02
 * Able to add SC+ on BC page, verify that SC+ is added to the cart
 */
describe('PROD_BUY_02', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();
  
  it('add SC+ on BC and verify in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_02', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard({ mode: 'first' });
      
      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      await bcPage.verifySku(site.product.sku);

      await bcPage.scPlus.addService();
      await bcPage.scPlus.verifyServiceApplied();
      
      await bcPage.tradeIn.selectNoForService();
      await bcPage.galaxyClub.selectNoForService();

      await bcPage.clickAddToCart();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.product.sku);
      await cartPage.scPlus.verifyServiceApplied();
    });
  });
});
