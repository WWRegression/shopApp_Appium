import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { MypageWishlistPage } from '../../../pages/mypage-wishlist.page';
import { PfPage } from '../../../pages/pf.page';
import { ShopPage } from '../../../pages/shop.page';

/** Verify ability to add/remove products to the wishlist and from the wishlist to the cart page. */
describe('PROD_SHOP_02', () => {
  const shopPage = new ShopPage();
  const pfPage = new PfPage();
  const wishlistPage = new MypageWishlistPage();
  const cartPage = new CartPage();

  it('add/remove wishlist and move wishlist item to cart', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_02', async () => {
      await cartPage.clearCart();

      await wishlistPage.clearWishlist();
      await shopPage.openCategory('mobile');
      const added = await pfPage.clickAddToWishlist();

      await wishlistPage.verifyAddedToWishlist(added);
      await wishlistPage.clickAddToCart(added.sku);
      
      await cartPage.selectBnbMenu('cart');
      await cartPage.prepareCartPage();
      await cartPage.verifySku(added.sku);

      await wishlistPage.clickRemoveFromWishlist(added.sku);
      await wishlistPage.verifyRemovedFromWishlist(added.sku);
    });
  });
});
