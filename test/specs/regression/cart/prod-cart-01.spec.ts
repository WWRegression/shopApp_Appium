import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';
import { AddOnPage } from '../../../pages/addon.page';

describe('PROD_CART_01', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const cartPage = new CartPage();
  const addOnPage = new AddOnPage();

  it('quantity +/-, product removal, cart icon count', async function () {
    await runOrSkip.call(this, 'PROD_CART_01', async (site) => {
      await cartPage.clearCart();

      await searchPage.searchByKeyword(site.product.sku);
      await pfPage.selectPfCard();

      await bcPage.selectOptions(site.product); 
      await bcPage.galaxyClub.selectNoForService();
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();
      await bcPage.clickAddToCart();
      await addOnPage.clickSplashContinue();

      const sku = await cartPage.getFirstItemSku();
      await cartPage.verifySkuInCart(sku);
      await cartPage.verifyCartIconQuantity(1);

      // Step1: Add quantity and verify cart icon quantity
      await cartPage.addQuantity(sku);
      await cartPage.verifyCartIconQuantity(2);

      // Step2: Reduce quantity and verify cart icon quantity
      await cartPage.reduceQuantity(sku);
      await cartPage.verifyCartIconQuantity(1);

      // Step3: Clear cart and verify cart icon quantity
      await cartPage.clearCart();
      await cartPage.verifyCartIconQuantity(0);
    });
  });
});
