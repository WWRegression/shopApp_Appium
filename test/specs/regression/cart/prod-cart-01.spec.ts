import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { addToCart } from '../../../helpers/api.helper';

describe('PROD_CART_01', () => {
  const cartPage = new CartPage();
  
  it('quantity +/-, product removal, cart icon count', async function () {
    await runOrSkip.call(this, 'PROD_CART_01', async (site) => {
      await cartPage.clearCart();
      await addToCart(site.product.sku);
      await cartPage.verifySku(site.product.sku);
      
      // Step1: Add quantity and verify cart icon quantity
      await cartPage.increaseQuantity(site.product.sku);
      
      // Step2: Reduce quantity and verify cart icon quantity
      await cartPage.decreaseQuantity(site.product.sku);
      
      // Step3: Clear cart and verify cart icon quantity
      await cartPage.clearCart();
      await cartPage.verifyCartIconQuantity(0);

      await addToCart(site.product.sku);
    });
  });
});
