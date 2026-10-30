import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { SplashPage } from '../../../pages/splash.page';

describe('PROD_BUY_04', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();

  it('add EUP on BC and verify in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_04', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.imSku);
      await pfPage.selectPfCard({ mode: 'first' });

      await bcPage.prepareBcPage();
      await bcPage.selectOptions(site.product);
      await bcPage.verifySku(site.product.imSku);
      
      await bcPage.eup.addService();
      await bcPage.eup.verifyServiceApplied();

      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();
      await bcPage.galaxyClub.selectNoForService();

      await bcPage.clickAddToCart();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.product.imSku);      
      await cartPage.eup.verifyServiceApplied();

      // Increase quantity to 2 and verify the EUP error text is shown
      await cartPage.increaseQuantity(site.product.imSku);
      await cartPage.verifyServiceErrorText('eup');
    });
  });
});
