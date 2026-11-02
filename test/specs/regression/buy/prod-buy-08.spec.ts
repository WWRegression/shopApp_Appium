import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';

/**
 * PROD_BUY_08
 * Able to add products from add-on page to the cart page successfully
 */
describe('PROD_BUY_08', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();

  it('add products from add-on page to cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_08', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.imSku);
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      await bcPage.verifySku(site.product.imSku);

      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();
      await bcPage.galaxyClub.selectNoForService();

      await bcPage.clickAddToCart();
      await splashPage.prepareAddonPage();
      await splashPage.verifyCartIconUpdated();

      const addonSku = await splashPage.selectAddonOption();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(addonSku);
    });
  });
});
