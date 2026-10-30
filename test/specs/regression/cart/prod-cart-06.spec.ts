import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';
import { addToCart } from '../../../helpers/api.helper';


describe('PROD_CART_06', () => {
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('Click the product name in the Cart to open the BC page and verify the SKU', async function () {
    await runOrSkip.call(this, 'PROD_CART_06', async (site) => {
      await cartPage.clearCart();
      await addToCart(site.product.imSku);
      await cartPage.prepareCartPage();
      await cartPage.verifySku(site.product.imSku);
      await cartPage.clickProductName(site.product.imSku);

      await bcPage.prepareBcPage();
      await bcPage.verifySku(site.product.imSku);
    });
  });
});
