import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { ShopPage } from '../../../pages/shop.page';

describe('PROD_SHOP_01', () => {
  const shopPage = new ShopPage();

  it('L0 > L1 opens PF and redirects to PD/BC', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_01', async (site) => {
      await shopPage.openFirstCategory();
      await shopPage.selectFirstProduct();
      void site.product.sku;
    });
  });
});
