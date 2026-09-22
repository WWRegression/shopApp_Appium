import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { AddOnPage } from '../../../pages/addon.page';
import { CartPage } from '../../../pages/cart.page';

/**
 * PROD_BUY_03
 * Able to add SIM on BC page, verify that SIM is added to the cart
 * Available sites (feature flag): AU, FR, UK, DE, SE, US
 */
describe('PROD_BUY_03', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const addOnPage = new AddOnPage();
  const cartPage = new CartPage();

  it('add SIM on BC and verify in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_03', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      await bcPage.verifySku(site.product.sku);
      
      await bcPage.sim.addService(site.product.sku );
      await bcPage.sim.verifyServiceApplied();
      
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();
      await bcPage.galaxyClub.selectNoForService();

      await bcPage.clickAddToCart();
      await addOnPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.product.sku);
      await cartPage.sim.verifyServiceApplied(site.product.sku);      
    });
  });
});
