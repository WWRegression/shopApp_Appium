import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypageWishlistPage } from '../../../pages/mypage-wishlist.page';
import { PfPage } from '../../../pages/pf.page';
import { SearchPage } from '../../../pages/search.page';
import { ShopPage } from '../../../pages/shop.page';

/** Add from Search PF, remove on the wishlist page, then confirm the PF heart is add again. */
describe('PROD_SEARCH_08', () => {
  const shopPage = new ShopPage();
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const wishlistPage = new MypageWishlistPage();

  it('add/remove wishlist from Search PF and wishlist page', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_08', async (site) => {
      const searchKeyword = site.product.deviceName;

      await wishlistPage.clearWishlist();

      await shopPage.prepareShopPage();
      await searchPage.openSearch();
      await searchPage.search(searchKeyword);
      const added = await pfPage.clickAddToWishlist();

      await wishlistPage.verifyAddedToWishlist(added);
      await wishlistPage.clearWishlist();

      await shopPage.prepareShopPage();
      await searchPage.openSearch();
      await searchPage.search(searchKeyword);
      await pfPage.verifyWishlistRemovedOnPf(added.sku);
    });
  });
});
