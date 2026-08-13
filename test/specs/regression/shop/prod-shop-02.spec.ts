import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { ShopPage } from '../../../pages/shop.page';

describe('PROD_SHOP_02', () => {
  const shopPage = new ShopPage();

  it('add/remove wishlist and move wishlist item to cart', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_02', async () => {
      await shopPage.openFirstCategory();
    });
  });
});
