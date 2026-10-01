import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { PdPage } from '../../../pages/pd.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';

describe('PROD_BUY_05', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const pdPage = new PdPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();
  

  it('add Trade-Up on PD and verify Trade-Un in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_05', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.search.vdSku ?? '');
      await pfPage.selectPfCard({ mode: 'first' });

      await pdPage.preparePdPage();
      await pdPage.verifySku(site.search.vdSku ?? '');
      
      await pdPage.tradeUp.addService(site.tradeUp?.postalCode ?? '');
      await pdPage.tradeUp.verifyServiceApplied();

      await pdPage.clickAddToCart();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.search.vdSku ?? '');
      await cartPage.tradeUp.verifyServiceApplied();
    });
  });
});
