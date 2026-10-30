import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { MypageWishlistPage } from '../../../pages/mypage-wishlist.page';
import { PfPage } from '../../../pages/pf.page';
import { SearchPage } from '../../../pages/search.page';
import { ShopPage } from '../../../pages/shop.page';

/** Add a product from the wishlist to cart up to payment, then go back to cart and the wishlist checking each page and the product. */
describe('PROD_BACKWARD_02', function () {
  // Forward to payment and back runs past the default 240s; WDIO reads the limit when the test starts
  this.timeout(480000);

  const shopPage = new ShopPage();
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const wishlistPage = new MypageWishlistPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('Wishlist to payment then back to cart and Wishlist', async function () {
    await runOrSkip.call(this, 'PROD_BACKWARD_02', async (site) => {
      // clear cart and wishlist
      await cartPage.clearCart();
      await wishlistPage.clearWishlist();

      await shopPage.prepareShopPage();
      await searchPage.openSearch();
      await searchPage.search(site.product.imSku);
      const added = await pfPage.clickAddToWishlist();

      await wishlistPage.verifyAddedToWishlist(added);
      await wishlistPage.clickAddToCart(added.sku);

      await cartPage.prepareCartPage();
      await cartPage.verifySku(added.sku);
      await cartPage.clickContinueToCheckout();

      await checkoutPage.prepareCheckoutPage();
      const checkoutSteps = await checkoutPage.proceedToPayment();
      console.log(`[PROD_BACKWARD_02] checkout steps: ${checkoutSteps.join(' > ')}`);

      // Back walks the checkout steps in reverse, then Cart > Wishlist
      for (const step of [...checkoutSteps].reverse()) {
        await checkoutPage.verifyCheckoutStep(step);
        await checkoutPage.pressDeviceBack();
      }
      await checkoutPage.clickLeaveCheckoutConfirmIfShown();

      await cartPage.verifyCartPage();
      await cartPage.prepareCartPage();
      await cartPage.verifySku(added.sku);
      await cartPage.pressDeviceBack();

      await wishlistPage.verifyReturnedToWishlist(added.sku);
    });
  });
});
